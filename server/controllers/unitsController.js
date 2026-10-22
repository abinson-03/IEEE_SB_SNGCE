const Unit = require("../models/Unit");
const DutyAssignment = require("../models/DutyAssignment");
const PositionTemplate = require("../models/PositionTemplate");

/**
 * GET /api/units
 * List all units (branch + chapters).
 */
const getUnits = async (req, res, next) => {
  try {
    const { type, name } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (name) filter.name = name.toUpperCase();

    const units = await Unit.find(filter).sort({ type: 1, name: 1 });
    res.status(200).json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/units/:id
 * Fetch a single unit by MongoDB _id OR by name (slug lookup).
 * Accepts ?by=name to force name-based lookup.
 */
const getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { by } = req.query;

    let unit;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);

    if (by === "name" || !isObjectId) {
      unit = await Unit.findOne({ name: id.toUpperCase() });
    } else {
      unit = await Unit.findById(id);
    }

    if (!unit) {
      const err = new Error("Unit not found.");
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/units/:id/officers
 * Returns active DutyAssignments for a given unit, with position and user populated.
 * Design decision: filter to latest academic year found for this unit.
 * Returns [] gracefully if no active assignments exist — never throws 404.
 *
 * :id can be a MongoDB ObjectId or a unit name (e.g. "CIS").
 */
const getUnitOfficers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);

    // Resolve unit
    let unit;
    if (isObjectId) {
      unit = await Unit.findById(id);
    } else {
      unit = await Unit.findOne({ name: id.toUpperCase() });
    }

    if (!unit) {
      const err = new Error("Unit not found.");
      err.statusCode = 404;
      return next(err);
    }

    // Find all PositionTemplates belonging to this unit
    const templates = await PositionTemplate.find({ unit: unit._id }).select("_id");
    const templateIds = templates.map((t) => t._id);

    if (templateIds.length === 0) {
      // No templates yet — return empty gracefully
      return res.status(200).json({ success: true, unit: unit.name, data: [] });
    }

    // Active duty assignments for those templates
    const assignments = await DutyAssignment.find({
      positionTemplate: { $in: templateIds },
      status: "active",
      user: { $exists: true, $ne: null },
    })
      .populate("user", "name globalRole profilePhoto") // never include email/password
      .populate({
        path: "positionTemplate",
        select: "positionName academicYear",
      })
      .sort({ "positionTemplate.positionName": 1 });

    // Shape response for the frontend
    const HIERARCHY_ORDER = [
      "Faculty Advisor", "Chapter Advisor", "Advisor", "Counselor",
      "Chair", "Chapter Chair",
      "Vice Chair",
      "Secretary",
      "Joint Secretary",
      "Treasurer",
      "Program Lead",
      "Web Master", "Webmaster",
      "Design Lead",
      "Event Coordinator",
      "Technical Lead",
      "Social Event Lead",
      "Outreach Coordinator",
      "Marketing/Publicity Coordinator", "Publicity",
      "Membership Engagement",
      "Project Coordinator"
    ];

    const officers = assignments.map((a) => ({
      assignmentId: a._id,
      userId: a.user?._id,
      name: a.user?.name || "Vacant",
      profilePhoto: a.user?.profilePhoto || null,
      positionName: a.positionTemplate?.positionName,
      academicYear: a.positionTemplate?.academicYear,
    }));

    officers.sort((a, b) => {
      const getRank = (title) => {
        if (!title) return 999;
        const t = title.trim().toLowerCase();
        // Exact match check first
        const exactIdx = HIERARCHY_ORDER.findIndex(h => h.toLowerCase() === t);
        if (exactIdx !== -1) return exactIdx;
        // Prefix/contains check
        const idx = HIERARCHY_ORDER.findIndex(h => t.includes(h.toLowerCase()));
        return idx === -1 ? 999 : idx;
      };
      return getRank(a.positionName) - getRank(b.positionName);
    });

    res.status(200).json({
      success: true,
      unit: unit.name,
      data: officers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUnits, getUnitById, getUnitOfficers };
