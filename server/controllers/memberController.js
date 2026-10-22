const User  = require("../models/User");
const Event  = require("../models/Event");
const QRCode = require("qrcode");

/**
 * GET /api/member/profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("name email globalRole chapterMemberships createdAt profilePhoto")
      .populate("chapterMemberships", "name type description");

    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/member/my-events
 * Returns events the logged-in user has registered for with their unique ticket pass code.
 * (Direct venue check-in QR is NOT leaked here so attendees cannot falsely mark attendance from home).
 */
const getMyEvents = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find events where this user is in the registrations array (by userId or user email)
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : "";
    const events = await Event.find({
      $or: [
        { "registrations.user": userId },
        ...(userEmail ? [{ "registrations.email": userEmail }] : []),
      ],
    })
      .populate("unit", "name type")
      .populate("createdBy", "name")
      .sort({ date: -1 });

    const data = events.map((ev) => {
      const isUpcoming = ev.status === "published" && new Date(ev.date) > new Date();

      const reg = (ev.registrations || []).find(
        (r) => (r.user && r.user.equals(userId)) || (userEmail && r.email && r.email.toLowerCase() === userEmail)
      );

      const isAttended = (ev.attendance || []).some(
        (a) => (a.user && a.user.equals(userId)) || (userEmail && a.email && a.email.toLowerCase() === userEmail)
      );

      // Human-friendly ticketCode
      let unitPrefix = (ev.unit?.name || "IEEE").slice(0, 4).toUpperCase();
      const ticketCode = reg?.ticketCode || (reg?._id ? `${unitPrefix}-${reg._id.toString().slice(-4).toUpperCase()}` : `${unitPrefix}-PASS`);

      return {
        _id:          ev._id,
        title:        ev.title,
        description:  ev.description,
        date:         ev.date,
        venue:        ev.venue,
        status:       ev.status,
        unit:         ev.unit,
        createdBy:    ev.createdBy,
        isUpcoming,
        isPast:       new Date(ev.date) < new Date(),
        isAttended,
        ticketCode,
        paymentStatus: reg?.paymentStatus || "free",
        registeredAt: reg?.registeredAt,
      };
    });

    res.status(200).json({ success: true, total: data.length, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyProfile, getMyEvents };

