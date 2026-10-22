const crypto   = require("crypto");
const os       = require("os");
const QRCode   = require("qrcode");
const Event    = require("../models/Event");
const Unit     = require("../models/Unit");
const AuditLog = require("../models/AuditLog");
const { notifyChapterMembers } = require("../utils/notify");

// ─── Helper: log audit entry ──────────────────────────────────────────────────
const audit = (action, performedBy, targetId, meta = {}) =>
  AuditLog.create({ action, performedBy, targetType: "Event", targetId, meta }).catch(() => {});

// ─── Helper: resolve unit name → ObjectId ────────────────────────────────────
const resolveUnit = async (unitParam) => {
  if (!unitParam) return null;
  const isObjectId = /^[a-f\d]{24}$/i.test(unitParam);
  if (isObjectId) return unitParam;
  const doc = await Unit.findOne({ name: unitParam.toUpperCase() }).select("_id");
  return doc ? doc._id : null;
};

// ─── Public: GET /api/events ─────────────────────────────────────────────────
const getEvents = async (req, res, next) => {
  try {
    const { status = "published", unit, limit = 50, page = 1, upcoming } = req.query;
    const filter = {};

    if (status === "all") {
      filter.status = { $in: ["published", "archived"] };
    } else {
      filter.status = status;
    }

    if (unit) {
      const unitId = await resolveUnit(unit);
      if (unitId) filter.unit = unitId;
    }

    const limitNum = parseInt(limit) || 50;
    const pageNum  = parseInt(page) || 1;
    const skip     = (pageNum - 1) * limitNum;

    if (upcoming === "true") {
      // Prioritize events from now into the future
      const now = new Date();
      const upcomingFilter = { ...filter, date: { $gte: now } };
      let events = await Event.find(upcomingFilter)
        .populate("unit", "name type")
        .populate("createdBy", "name")
        .select("-registrations -attendance")
        .sort({ date: 1 })
        .limit(limitNum);

      // If we have fewer upcoming events than requested, backfill with recent events
      if (events.length < limitNum) {
        const remaining = limitNum - events.length;
        const pastFilter = {
          ...filter,
          date: { $lt: now },
          _id: { $nin: events.map((e) => e._id) },
        };
        const pastEvents = await Event.find(pastFilter)
          .populate("unit", "name type")
          .populate("createdBy", "name")
          .select("-registrations -attendance")
          .sort({ date: -1 })
          .limit(remaining);

        events = events.concat(pastEvents);
      }

      return res.status(200).json({
        success: true,
        total: events.length,
        page: 1,
        pages: 1,
        data: events,
      });
    }

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate("unit", "name type")
      .populate("createdBy", "name")
      .select("-registrations -attendance")
      .sort({ date: 1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), data: events });
  } catch (error) { next(error); }
};

// ─── Public: GET /api/events/:id ─────────────────────────────────────────────
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("unit", "name type description")
      .populate("createdBy", "name")
      .populate("registrations.user", "name");

    if (!event) { const e = new Error("Event not found."); e.statusCode = 404; return next(e); }

    // Attach registration count and whether current user is registered
    const result = event.toObject();
    result.registrationCount = event.registrations.length;
    result.attendanceCount   = event.attendance.length;
    if (req.user) {
      const uId = req.user._id?.toString();
      const uEmail = req.user.email?.toLowerCase().trim();
      result.isRegistered = event.registrations.some(
        (r) =>
          (r.user && (r.user._id || r.user)?.toString() === uId) ||
          (r.email && r.email.toLowerCase().trim() === uEmail)
      );
    }
    // Never expose QR token in public endpoint
    delete result.qrToken;

    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ─── Officer: GET /api/events/mine ───────────────────────────────────────────
const getMyEvents = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.globalRole === "superadmin") {
      // Super Admin sees ALL events across all chapters
      filter = {};
    } else {
      // chapteradmin or execom: see all events in chapters they belong to OR events they created
      const User = require("../models/User");
      const DutyAssignment = require("../models/DutyAssignment");

      const userDoc = await User.findById(req.user._id).select("chapterMemberships");
      const userUnits = (userDoc?.chapterMemberships || []).map((id) => (id._id || id).toString());

      const duties = await DutyAssignment.find({ user: req.user._id, status: "active" })
        .populate("positionTemplate", "unit");
      for (const d of duties) {
        if (d.positionTemplate?.unit) {
          userUnits.push((d.positionTemplate.unit._id || d.positionTemplate.unit).toString());
        }
      }

      const uniqueUnits = [...new Set(userUnits)];
      if (uniqueUnits.length > 0) {
        filter = {
          $or: [
            { unit: { $in: uniqueUnits } },
            { createdBy: req.user._id },
          ],
        };
      } else {
        filter = { createdBy: req.user._id };
      }
    }

    const events = await Event.find(filter)
      .populate("unit", "name type")
      .populate("registrations.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: events });
  } catch (error) { next(error); }
};

// ─── Officer: POST /api/events ───────────────────────────────────────────────
const createEvent = async (req, res, next) => {
  try {
    const {
      title, description, date, venue, unit: unitParam, maxAttendees,
      isPaid, fee, memberFee, upiId, status, publishImmediately,
    } = req.body;

    const unitId = await resolveUnit(unitParam);
    if (!unitId) { const e = new Error("Invalid or missing unit."); e.statusCode = 400; return next(e); }

    const eventStatus = (publishImmediately === true || status === "published") ? "published" : "draft";

    const event = await Event.create({
      title, description, date, venue,
      unit: unitId,
      createdBy: req.user._id,
      maxAttendees: maxAttendees || null,
      isPaid: Boolean(isPaid),
      fee: Number(fee) || 0,
      memberFee: Number(memberFee) || 0,
      upiId: upiId ? upiId.trim() : "",
      status: eventStatus,
    });

    await audit("EVENT_CREATED", req.user._id, event._id, { title: event.title, status: event.status });

    if (event.status === "published") {
      await audit("EVENT_PUBLISHED", req.user._id, event._id, { title: event.title });
      try {
        await notifyChapterMembers(
          event.unit,
          `New Event Published: ${event.title}`,
          `A new event "${event.title}" has been published. Register now!`,
          "event",
          `/events/${event._id}`
        );
      } catch (e) {}
    }

    const populated = await Event.findById(event._id).populate("unit", "name type").populate("createdBy", "name");
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// ─── Officer: PUT /api/events/:id ────────────────────────────────────────────
// (req.event pre-loaded by ownerOrAdmin middleware)
const updateEvent = async (req, res, next) => {
  try {
    const {
      title, description, unit, date, venue, maxAttendees,
      isPaid, fee, memberFee, upiId, status,
    } = req.body;
    const event = req.event;

    if (title)                      event.title        = title.trim();
    if (description !== undefined)  event.description  = description;
    if (unit) {
      const resolved = await resolveUnit(unit);
      if (resolved) event.unit = resolved;
    }
    if (date)                       event.date         = new Date(date);
    if (venue !== undefined)        event.venue        = venue;
    if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;
    if (isPaid !== undefined)       event.isPaid       = Boolean(isPaid);
    if (fee !== undefined)          event.fee          = Number(fee) || 0;
    if (memberFee !== undefined)    event.memberFee    = Number(memberFee) || 0;
    if (upiId !== undefined)        event.upiId        = upiId ? upiId.trim() : "";
    if (status && ["draft", "published", "archived"].includes(status)) event.status = status;

    await event.save();
    await audit("EVENT_EDITED", req.user._id, event._id, { title: event.title, date: event.date });

    const populated = await Event.findById(event._id).populate("unit", "name type").populate("createdBy", "name");
    res.status(200).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// ─── Officer: PATCH /api/events/:id/publish ───────────────────────────────────
const publishEvent = async (req, res, next) => {
  try {
    const event = req.event;
    if (event.status !== "draft") {
      const e = new Error(`Cannot publish an event with status "${event.status}".`);
      e.statusCode = 400; return next(e);
    }
    event.status = "published";
    await event.save();
    await audit("EVENT_PUBLISHED", req.user._id, event._id, { title: event.title });

    // Notify chapter members
    await notifyChapterMembers(
      event.unit,
      `New Event Published: ${event.title}`,
      `A new event "${event.title}" has been published. Register now!`,
      "event",
      `/events/${event._id}`
    );
    res.status(200).json({ success: true, data: { _id: event._id, status: event.status } });
  } catch (error) { next(error); }
};

// ─── Officer: PATCH /api/events/:id/archive ───────────────────────────────────
const archiveEvent = async (req, res, next) => {
  try {
    const event = req.event;
    if (event.status !== "published") {
      const e = new Error(`Cannot archive an event with status "${event.status}".`);
      e.statusCode = 400; return next(e);
    }
    event.status = "archived";
    await event.save();
    await audit("EVENT_ARCHIVED", req.user._id, event._id, { title: event.title });
    res.status(200).json({ success: true, data: { _id: event._id, status: event.status } });
  } catch (error) { next(error); }
};

// ─── Public: POST /api/events/:id/register ───────────────────────────────────
const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) { const e = new Error("Event not found."); e.statusCode = 404; return next(e); }
    if (event.status !== "published") {
      const e = new Error("Registration is only available for published events.");
      e.statusCode = 400; return next(e);
    }

    const { college, phone, transactionId, paymentScreenshot } = req.body || {};
    let name, email, userId = null;

    if (req.user) {
      // Logged-in member
      const User = require("../models/User");
      const u = await User.findById(req.user._id).select("name email");
      name  = u.name;
      email = u.email;
      userId = req.user._id;

      // Duplicate check for members
      const alreadyReg = event.registrations.some(
        (r) => r.user && r.user.equals(userId)
      );
      if (alreadyReg) {
        const e = new Error("You are already registered for this event.");
        e.statusCode = 409; return next(e);
      }
    } else {
      // Guest / Non-IEEE Outsider
      ({ name, email } = req.body);
      if (!name || !email) {
        const e = new Error("Name and email are required for guest registration.");
        e.statusCode = 400; return next(e);
      }
      // Duplicate check for guests by email
      const alreadyReg = event.registrations.some(
        (r) => !r.user && r.email === email.toLowerCase().trim()
      );
      if (alreadyReg) {
        const e = new Error("This email address is already registered for this event.");
        e.statusCode = 409; return next(e);
      }
    }

    // Cap check
    if (event.maxAttendees && event.registrations.length >= event.maxAttendees) {
      const e = new Error("This event has reached its registration limit.");
      e.statusCode = 409; return next(e);
    }

    // Determine payment status
    let paymentStatus = "free";
    if (event.isPaid) {
      const applicableFee = req.user ? (event.memberFee || 0) : (event.fee || 0);
      if (applicableFee === 0) {
        paymentStatus = "free";
      } else {
        paymentStatus = transactionId ? "paid" : "pending";
      }
    }

    // Generate human-friendly Ticket Code (e.g. "CIS-8492" or "IEEE-5912")
    let unitPrefix = "IEEE";
    try {
      if (event.unit) {
        const u = await Unit.findById(event.unit).select("name");
        if (u?.name) unitPrefix = u.name.slice(0, 4).toUpperCase();
      }
    } catch {}
    const ticketCode = `${unitPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    event.registrations.push({
      user: userId,
      name,
      email,
      college:           college ? college.trim() : "",
      phone:             phone ? phone.trim() : "",
      paymentStatus,
      transactionId:     transactionId ? transactionId.trim() : "",
      paymentScreenshot: paymentScreenshot || "",   // base64 image from client
      ticketCode,
    });
    await event.save();

    const createdReg = event.registrations[event.registrations.length - 1];

    res.status(200).json({
      success: true,
      message: "Registered successfully.",
      registrationCount: event.registrations.length,
      paymentStatus,
      registration: createdReg,
    });
  } catch (error) { next(error); }
};

// ─── Helper: detect machine LAN IPv4 address for mobile QR scanning ──────────
const getLocalIp = () => {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    console.error("Local IP detection error:", e);
  }
  return "localhost";
};

// ─── Officer: POST /api/events/:id/qr ────────────────────────────────────────
const generateQR = async (req, res, next) => {
  try {
    const event = req.event; // pre-loaded by ownerOrAdmin

    // Generate a token if one doesn't already exist
    if (!event.qrToken) {
      event.qrToken = crypto.randomBytes(16).toString("hex");
      await event.save();
    }

    const detectedIp = getLocalIp();
    const port = process.env.CLIENT_PORT || "3000";
    
    // Priority: Host header from incoming request or local LAN IP
    let hostIp = detectedIp;
    if (req.headers.host && !req.headers.host.includes("localhost") && !req.headers.host.includes("127.0.0.1")) {
      hostIp = req.headers.host.split(":")[0];
    }

    const lanOrigin = `http://${hostIp}:${port}`;
    const localOrigin = `http://localhost:${port}`;

    const checkInUrl = `${lanOrigin}/checkin/${event._id}?token=${event.qrToken}`;
    const localCheckInUrl = `${localOrigin}/checkin/${event._id}?token=${event.qrToken}`;

    // Generate QR codes
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#1a2744", light: "#ffffff" },
    });

    const localQrDataUrl = await QRCode.toDataURL(localCheckInUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#1a2744", light: "#ffffff" },
    });

    await audit("QR_GENERATED", req.user._id, event._id, { title: event.title, lanOrigin });

    res.status(200).json({
      success: true,
      checkInUrl,
      localCheckInUrl,
      lanIp: hostIp,
      qrDataUrl,
      localQrDataUrl,
    });
  } catch (error) { next(error); }
};

// ─── Public: POST /api/events/:id/checkin?token=xxx ──────────────────────────
const checkIn = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      const e = new Error("Venue check-in token is required. Please scan the official Venue QR Code.");
      e.statusCode = 400;
      return next(e);
    }

    // Fetch event WITH qrToken (normally excluded)
    const event = await Event.findById(req.params.id).select("+qrToken");
    if (!event) { const e = new Error("Event not found."); e.statusCode = 404; return next(e); }
    if (event.status !== "published") {
      const e = new Error("Check-in is only available for published events.");
      e.statusCode = 400; return next(e);
    }
    if (!event.qrToken || event.qrToken !== token) {
      const e = new Error("Invalid or expired venue check-in token."); e.statusCode = 400; return next(e);
    }

    const { code, email: bodyEmail, name: bodyName } = req.body;
    const searchCode = (code || "").trim();

    if (!searchCode && !bodyEmail && !req.user) {
      const e = new Error("Please enter your Pass / Ticket Code or registered email.");
      e.statusCode = 400;
      return next(e);
    }

    // Match registration in event.registrations
    let matchingReg = null;

    if (searchCode) {
      const upperSearch = searchCode.toUpperCase();
      matchingReg = (event.registrations || []).find((r) => {
        const tCode = (r.ticketCode || "").toUpperCase();
        const regId = (r._id ? r._id.toString() : "").toUpperCase();
        const rEmail = (r.email || "").toUpperCase();
        return (
          tCode === upperSearch ||
          (tCode && tCode.endsWith(upperSearch)) ||
          regId === upperSearch ||
          regId.endsWith(upperSearch) ||
          rEmail === upperSearch
        );
      });
    }

    if (!matchingReg && (bodyEmail || req.user?.email)) {
      const targetEmail = (bodyEmail || req.user.email).toLowerCase().trim();
      matchingReg = (event.registrations || []).find(
        (r) => (r.email && r.email.toLowerCase().trim() === targetEmail)
      );
    }

    if (!matchingReg) {
      const e = new Error(
        `No registration found for code "${searchCode || bodyEmail}". Please verify your ticket code or visit the registration desk.`
      );
      e.statusCode = 404;
      return next(e);
    }

    // Check if attendee is already checked in
    const regEmail = matchingReg.email.toLowerCase().trim();
    const regUserId = matchingReg.user ? matchingReg.user.toString() : null;

    const alreadyIn = (event.attendance || []).some(
      (a) => (regUserId && a.user && a.user.toString() === regUserId) || (a.email && a.email.toLowerCase().trim() === regEmail)
    );

    if (alreadyIn) {
      const e = new Error(`Already checked in! ${matchingReg.name} is already marked present.`);
      e.statusCode = 409;
      return next(e);
    }

    event.attendance.push({
      user: matchingReg.user || null,
      name: matchingReg.name,
      email: regEmail,
      markedAt: new Date(),
    });
    await event.save();

    await audit("CHECKIN_MARKED", matchingReg.user || null, event._id, {
      attendee: matchingReg.name,
      ticketCode: matchingReg.ticketCode,
      eventTitle: event.title,
    });

    res.status(200).json({
      success: true,
      message: `Check-in successful! Welcome, ${matchingReg.name}.`,
      attendee: {
        name: matchingReg.name,
        email: matchingReg.email,
        college: matchingReg.college,
        ticketCode: matchingReg.ticketCode || `TKT-${matchingReg._id.toString().slice(-4).toUpperCase()}`,
      },
      attendanceCount: event.attendance.length,
    });
  } catch (error) { next(error); }
};

// ─── Officer: POST /api/events/:id/attendance/mark ──────────────────────────
const markAttendance = async (req, res, next) => {
  try {
    const event = req.event; // pre-loaded by ownerOrAdmin
    const { email, name, userId, action } = req.body;

    if (!email) {
      const err = new Error("Attendee email is required.");
      err.statusCode = 400;
      return next(err);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingIndex = (event.attendance || []).findIndex(
      (a) => (userId && a.user && a.user.toString() === userId.toString()) || (a.email && a.email.toLowerCase().trim() === normalizedEmail)
    );

    if (action === "unmark" || action === "remove") {
      if (existingIndex > -1) {
        event.attendance.splice(existingIndex, 1);
        await event.save();
      }
      return res.status(200).json({
        success: true,
        message: `Attendance removed for ${name || normalizedEmail}`,
        attendance: event.attendance,
      });
    }

    // Default action: mark present
    if (existingIndex === -1) {
      const reg = (event.registrations || []).find(
        (r) => (userId && r.user && r.user.toString() === userId.toString()) || (r.email && r.email.toLowerCase().trim() === normalizedEmail)
      );

      event.attendance.push({
        user: userId || reg?.user || null,
        name: name || reg?.name || normalizedEmail,
        email: normalizedEmail,
        markedAt: new Date(),
      });
      await event.save();
    }

    await audit("DESK_CHECKIN_MARKED", req.user._id, event._id, {
      attendee: name || normalizedEmail,
      eventTitle: event.title,
    });

    res.status(200).json({
      success: true,
      message: `Marked present: ${name || normalizedEmail}`,
      attendance: event.attendance,
    });
  } catch (error) { next(error); }
};

module.exports = {
  getEvents, getEventById, getMyEvents,
  createEvent, updateEvent, publishEvent, archiveEvent,
  registerForEvent, generateQR, checkIn, markAttendance,
};
