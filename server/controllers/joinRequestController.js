const ChapterJoinRequest = require("../models/ChapterJoinRequest");
const Unit               = require("../models/Unit");
const User               = require("../models/User");
const DutyAssignment     = require("../models/DutyAssignment");
const Notification       = require("../models/Notification");
const { notifyUser }     = require("../utils/notify");

/**
 * POST /api/chapters/:id/join-request (also /api/units/:id/join-request)
 * Authenticated user requests to join a chapter.
 * :id can be Unit ObjectId or Unit code (e.g. "CIS", "CS", "SPS", "WIE").
 */
const createJoinRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);

    let unit;
    if (isObjectId) {
      unit = await Unit.findById(id);
    } else {
      unit = await Unit.findOne({ name: id.toUpperCase() });
    }

    if (!unit) {
      const err = new Error("Chapter / Unit not found.");
      err.statusCode = 404;
      return next(err);
    }

    // Check if user is already a member of this chapter
    const currentUser = await User.findById(req.user._id);
    const isAlreadyMember = currentUser.chapterMemberships?.some(
      (chId) => chId.toString() === unit._id.toString()
    );

    if (isAlreadyMember) {
      const err = new Error("You are already a member of this chapter.");
      err.statusCode = 400;
      return next(err);
    }

    // Check for existing pending request
    const existing = await ChapterJoinRequest.findOne({
      user: req.user._id,
      unit: unit._id,
      status: "pending",
    });

    if (existing) {
      const err = new Error("You already have a pending join request for this chapter.");
      err.statusCode = 400;
      return next(err);
    }

    const joinReq = await ChapterJoinRequest.create({
      user: req.user._id,
      unit: unit._id,
      status: "pending",
      requestedAt: new Date(),
    });

    const populated = await ChapterJoinRequest.findById(joinReq._id)
      .populate("unit", "name type description")
      .populate("user", "name email profilePhoto department");

    // ── Dispatch Notifications to Chapter Leadership & SuperAdmins ──
    try {
      const officerIds = new Set();

      // 1. Active officers assigned to this chapter
      const chapterAssignments = await DutyAssignment.find({
        status: "active",
      }).populate("positionTemplate");

      chapterAssignments.forEach((a) => {
        if (a.positionTemplate?.unit?.toString() === unit._id.toString() && a.user) {
          officerIds.add(a.user.toString());
        }
      });

      // 2. ChapterAdmins (Faculty Advisors / Chairs) mapped to this chapter
      const chapterAdmins = await User.find({
        globalRole: "chapteradmin",
        chapterMemberships: unit._id,
        status: { $ne: "inactive" },
      }).select("_id");
      chapterAdmins.forEach((ca) => officerIds.add(ca._id.toString()));

      // 3. SuperAdmins (SB Counselor & SB Chair)
      const superAdmins = await User.find({
        globalRole: "superadmin",
        status: { $ne: "inactive" },
      }).select("_id");
      superAdmins.forEach((sa) => officerIds.add(sa._id.toString()));

      // Exclude applicant themselves
      officerIds.delete(req.user._id.toString());

      // Create notification for each officer
      const notifDocs = Array.from(officerIds).map((officerId) => ({
        recipient: officerId,
        title: `New Join Request: ${unit.name}`,
        message: `${currentUser.name} (${currentUser.email}) has requested to join IEEE ${unit.name} SBC.`,
        type: "general",
        link: "/officer/join-requests",
      }));

      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs);
      }

      // 4. Confirmation notification to applicant
      await notifyUser(
        req.user._id,
        `Join Request Submitted: ${unit.name}`,
        `Your request to join IEEE ${unit.name} SBC has been submitted successfully and is awaiting chapter review.`,
        "general",
        `/chapters/${unit.name}`
      );
    } catch (notifErr) {
      console.error("[createJoinRequest] Notification error (non-fatal):", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Join request for ${unit.name} submitted successfully.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chapters/:id/my-status (also /api/units/:id/my-status)
 * Authenticated user checks their membership and join request status for this chapter.
 */
const getMyJoinRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);

    let unit;
    if (isObjectId) {
      unit = await Unit.findById(id);
    } else {
      unit = await Unit.findOne({ name: id.toUpperCase() });
    }

    if (!unit) {
      const err = new Error("Chapter / Unit not found.");
      err.statusCode = 404;
      return next(err);
    }

    const currentUser = await User.findById(req.user._id).select("chapterMemberships name email globalRole");
    const isMember = currentUser.chapterMemberships?.some(
      (chId) => chId.toString() === unit._id.toString()
    ) || false;

    // Check for pending request
    const pendingRequest = await ChapterJoinRequest.findOne({
      user: req.user._id,
      unit: unit._id,
      status: "pending",
    }).sort({ requestedAt: -1 });

    // Latest request overall (could be approved/rejected)
    const latestRequest = await ChapterJoinRequest.findOne({
      user: req.user._id,
      unit: unit._id,
    }).sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        unitId: unit._id,
        unitName: unit.name,
        isMember,
        hasPendingRequest: Boolean(pendingRequest),
        pendingRequest,
        latestRequest,
        userChapterMemberships: currentUser.chapterMemberships,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/member/join-requests
 * Authenticated user views all their own join requests across all chapters.
 */
const getMyJoinRequests = async (req, res, next) => {
  try {
    const requests = await ChapterJoinRequest.find({ user: req.user._id })
      .populate("unit", "name type description")
      .populate("reviewedBy", "name")
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/officer/join-requests
 * ExeCom / ChapterAdmin / SuperAdmin view join requests.
 * Allows filtering by status ('pending', 'approved', 'rejected') and chapter/unitId.
 */
const getOfficerJoinRequests = async (req, res, next) => {
  try {
    const { status, unitId, chapter } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = "pending";
    }

    // Optional chapter name filter
    let requestedUnitId = unitId;
    if (chapter) {
      const targetUnit = await Unit.findOne({ name: chapter.toUpperCase() });
      if (targetUnit) {
        requestedUnitId = targetUnit._id.toString();
      }
    }

    // Authorization & scope filtering
    if (req.user.globalRole !== "superadmin") {
      // Find units this officer has assignments or memberships in
      const [assignments, userDoc, sbUnit] = await Promise.all([
        DutyAssignment.find({ user: req.user._id, status: "active" }).populate("positionTemplate"),
        User.findById(req.user._id).select("chapterMemberships"),
        Unit.findOne({ $or: [{ name: "SB" }, { type: "branch" }] }),
      ]);

      const unitIds = new Set();
      let isSbOfficer = false;

      assignments.forEach((a) => {
        if (a.positionTemplate?.unit) {
          const uId = a.positionTemplate.unit.toString();
          unitIds.add(uId);
          if (sbUnit && uId === sbUnit._id.toString()) isSbOfficer = true;
        }
      });

      userDoc?.chapterMemberships?.forEach((ch) => {
        const uId = ch.toString();
        unitIds.add(uId);
        if (sbUnit && uId === sbUnit._id.toString()) isSbOfficer = true;
      });

      // SB officers have oversight over all chapters
      if (isSbOfficer) {
        if (requestedUnitId) {
          filter.unit = requestedUnitId;
        }
      } else {
        // Scoped to officer's own chapter(s)
        if (requestedUnitId && unitIds.has(requestedUnitId)) {
          filter.unit = requestedUnitId;
        } else {
          filter.unit = { $in: Array.from(unitIds) };
        }
      }
    } else if (requestedUnitId) {
      filter.unit = requestedUnitId;
    }

    const requests = await ChapterJoinRequest.find(filter)
      .populate("unit", "name type description")
      .populate("user", "name email globalRole profilePhoto department")
      .populate("reviewedBy", "name")
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/officer/join-requests/:id
 * Approve or reject a join request.
 * Approving automatically adds unit to user.chapterMemberships and notifies applicant.
 */
const updateJoinRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      const err = new Error("Valid status ('approved' or 'rejected') is required.");
      err.statusCode = 400;
      return next(err);
    }

    const joinReq = await ChapterJoinRequest.findById(id).populate("unit");
    if (!joinReq) {
      const err = new Error("Join request not found.");
      err.statusCode = 404;
      return next(err);
    }

    if (joinReq.status !== "pending") {
      const err = new Error(`This request has already been ${joinReq.status}.`);
      err.statusCode = 400;
      return next(err);
    }

    // Chapter authorization check: SuperAdmin, SB Officer, or chapter's officer/advisor
    if (req.user.globalRole !== "superadmin") {
      const [assignments, userDoc, sbUnit] = await Promise.all([
        DutyAssignment.find({ user: req.user._id, status: "active" }).populate("positionTemplate"),
        User.findById(req.user._id).select("chapterMemberships"),
        Unit.findOne({ $or: [{ name: "SB" }, { type: "branch" }] }),
      ]);

      const officerUnitIds = new Set();
      let isSbOfficer = false;

      assignments.forEach((a) => {
        if (a.positionTemplate?.unit) {
          const uId = a.positionTemplate.unit.toString();
          officerUnitIds.add(uId);
          if (sbUnit && uId === sbUnit._id.toString()) isSbOfficer = true;
        }
      });

      userDoc?.chapterMemberships?.forEach((ch) => {
        const uId = ch.toString();
        officerUnitIds.add(uId);
        if (sbUnit && uId === sbUnit._id.toString()) isSbOfficer = true;
      });

      const targetUnitId = joinReq.unit?._id ? joinReq.unit._id.toString() : joinReq.unit.toString();
      if (!isSbOfficer && !officerUnitIds.has(targetUnitId)) {
        const err = new Error("You are not authorized to review requests for this chapter.");
        err.statusCode = 403;
        return next(err);
      }
    }

    // If approved, add unit to applicant's chapterMemberships
    const unitIdToGrant = joinReq.unit?._id || joinReq.unit;
    if (status === "approved") {
      await User.findByIdAndUpdate(joinReq.user, {
        $addToSet: { chapterMemberships: unitIdToGrant },
      });
    }

    joinReq.status = status;
    joinReq.reviewedBy = req.user._id;
    joinReq.reviewedAt = new Date();
    await joinReq.save();

    const unitName = joinReq.unit?.name || "Chapter";

    // Notify the applicant of the decision
    try {
      if (status === "approved") {
        await notifyUser(
          joinReq.user,
          `Join Request Approved: ${unitName}`,
          `Congratulations! Your request to join IEEE ${unitName} SBC has been approved. You are now an official member!`,
          "general",
          `/chapters/${unitName}`
        );
      } else {
        await notifyUser(
          joinReq.user,
          `Join Request Update: ${unitName}`,
          `Your request to join IEEE ${unitName} SBC was not approved at this time.`,
          "general",
          `/chapters/${unitName}`
        );
      }
    } catch (notifErr) {
      console.error("[updateJoinRequestStatus] Notification error (non-fatal):", notifErr.message);
    }

    const updated = await ChapterJoinRequest.findById(joinReq._id)
      .populate("unit", "name type description")
      .populate("user", "name email globalRole profilePhoto department")
      .populate("reviewedBy", "name");

    res.status(200).json({
      success: true,
      message: `Join request ${status} successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJoinRequest,
  getMyJoinRequestStatus,
  getMyJoinRequests,
  getOfficerJoinRequests,
  updateJoinRequestStatus,
};
