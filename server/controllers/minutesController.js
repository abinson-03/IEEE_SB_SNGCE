const MeetingMinute = require("../models/MeetingMinute");
const AuditLog      = require("../models/AuditLog");

/**
 * GET /api/minutes?unit=&search=
 */
const getMeetingMinutes = async (req, res, next) => {
  try {
    const { unit, search } = req.query;
    const filter = {};
    if (unit) filter.unit = unit;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const minutes = await MeetingMinute.find(filter)
      .populate("unit", "name type")
      .populate("submittedBy", "name email")
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: minutes.length, data: minutes });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/minutes
 * Secretary / Officer creates a new meeting minute archive entry.
 */
const createMeetingMinute = async (req, res, next) => {
  try {
    const { title, date, unit, content, attendees = "", fileUrl = "" } = req.body;
    if (!title || !date || !unit || !content) {
      const err = new Error("Title, date, chapter/unit, and content are required.");
      err.statusCode = 400;
      return next(err);
    }

    const minute = await MeetingMinute.create({
      title: title.trim(),
      date,
      unit,
      content: content.trim(),
      attendees: attendees.trim(),
      fileUrl,
      submittedBy: req.user._id,
    });

    await AuditLog.create({
      action: "MEETING_MINUTES_SUBMITTED",
      performedBy: req.user._id,
      targetType: "Unit",
      targetId: unit,
      meta: { title: minute.title, date: minute.date },
    }).catch(() => {});

    const populated = await MeetingMinute.findById(minute._id)
      .populate("unit", "name type")
      .populate("submittedBy", "name email");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/minutes/:id
 */
const deleteMeetingMinute = async (req, res, next) => {
  try {
    const minute = await MeetingMinute.findByIdAndDelete(req.params.id);
    if (!minute) {
      const err = new Error("Meeting minute not found.");
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, message: "Meeting minute deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeetingMinutes,
  createMeetingMinute,
  deleteMeetingMinute,
};
