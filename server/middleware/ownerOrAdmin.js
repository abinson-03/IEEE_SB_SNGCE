const Event = require("../models/Event");
const User  = require("../models/User");
const DutyAssignment = require("../models/DutyAssignment");

/**
 * ownerOrAdmin
 * Middleware that verifies the authenticated user is authorized to modify the event:
 *   1. The officer who created the event (event.createdBy equals req.user._id), OR
 *   2. A superadmin, OR
 *   3. A chapteradmin (Faculty Advisor / Chair) or ExeCom officer authorized for the event's chapter (event.unit).
 *
 * Must be used AFTER authMiddleware (req.user must be set).
 * Attaches the fetched event to req.event so subsequent handlers don't refetch.
 */
const ownerOrAdmin = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).select("+qrToken");
    if (!event) {
      const err = new Error("Event not found.");
      err.statusCode = 404;
      return next(err);
    }

    const isOwner = event.createdBy.equals(req.user._id);
    const isSuperAdmin = req.user.globalRole === "superadmin";

    let isAuthorizedChapterOfficer = false;
    if (!isOwner && !isSuperAdmin) {
      const eventUnitId = event.unit.toString();

      // Check if officer has chapter membership in this event's unit
      const userDoc = await User.findById(req.user._id).select("chapterMemberships globalRole");
      const inMemberships = (userDoc?.chapterMemberships || []).some(
        (ch) => (ch._id || ch).toString() === eventUnitId
      );

      if (inMemberships && (userDoc?.globalRole === "chapteradmin" || userDoc?.globalRole === "execom")) {
        isAuthorizedChapterOfficer = true;
      } else {
        // Also check active DutyAssignments for this unit
        const duties = await DutyAssignment.find({ user: req.user._id, status: "active" })
          .populate("positionTemplate", "unit");

        const hasUnitDuty = duties.some(
          (d) => d.positionTemplate?.unit?.toString() === eventUnitId
        );

        if (hasUnitDuty) {
          isAuthorizedChapterOfficer = true;
        }
      }
    }

    if (!isOwner && !isSuperAdmin && !isAuthorizedChapterOfficer) {
      const err = new Error("You do not have permission to modify this event.");
      err.statusCode = 403;
      return next(err);
    }

    req.event = event; // Pass along to controller — avoids double-fetch
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = ownerOrAdmin;
