const DutyAssignment   = require("../models/DutyAssignment");
const PositionTemplate = require("../models/PositionTemplate");
const User             = require("../models/User");
const Event            = require("../models/Event");
const BudgetProposal   = require("../models/BudgetProposal");
const AuditLog         = require("../models/AuditLog");

/**
 * GET /api/officer/my-duties
 * Returns active DutyAssignments for the logged-in officer.
 * Supports dutyType for position-specific workflows.
 */
const getMyDuties = async (req, res, next) => {
  try {
    const assignments = await DutyAssignment.find({
      user: req.user._id,
      status: "active",
    })
      .populate({
        path: "positionTemplate",
        select: "positionName academicYear dutyType isArchived",
        populate: { path: "unit", select: "name type" },
      })
      .sort({ assignedAt: -1 });

    let duties = assignments.map((a) => ({
      assignmentId: a._id,
      positionName: a.positionTemplate?.positionName,
      dutyType:     a.positionTemplate?.dutyType || "general",
      academicYear: a.positionTemplate?.academicYear,
      unit:         a.positionTemplate?.unit?.name,
      unitId:       a.positionTemplate?.unit?._id,
      assignedAt:   a.assignedAt,
      status:       a.status,
    }));

    // If officer is chapteradmin or superadmin but has no explicit duty assignment,
    // grant oversight role on their managed chapter(s)
    if (duties.length === 0 && (req.user.globalRole === "chapteradmin" || req.user.globalRole === "superadmin")) {
      const user = await User.findById(req.user._id).populate("chapterMemberships", "name type");
      if (user?.chapterMemberships?.length) {
        duties = user.chapterMemberships.map((ch) => ({
          assignmentId: `auto-${ch._id}`,
          positionName: "Chapter Executive / Advisor",
          dutyType: "oversight",
          academicYear: "Current Term",
          unit: ch.name,
          unitId: ch._id,
          assignedAt: user.createdAt,
          status: "active",
        }));
      }
    }

    res.status(200).json({ success: true, count: duties.length, data: duties });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/officer/chapter-overview?unitId=
 * Read-only overview for officers with dutyType="oversight" (Chair, Faculty Advisor).
 * Returns chapter events, all officer duty assignments, and all budget proposals.
 */
const getChapterOverview = async (req, res, next) => {
  try {
    const { unitId } = req.query;
    if (!unitId) {
      const err = new Error("unitId query parameter is required.");
      err.statusCode = 400;
      return next(err);
    }

    const [events, assignments, budgetProposals] = await Promise.all([
      Event.find({ unit: unitId })
        .select("title date venue status attendance")
        .sort({ date: -1 })
        .limit(20),
      DutyAssignment.find()
        .populate({
          path: "positionTemplate",
          match: { unit: unitId, isArchived: { $ne: true } },
          select: "positionName dutyType academicYear",
        })
        .populate("user", "name email globalRole"),
      BudgetProposal.find({ unit: unitId })
        .populate("submittedBy", "name")
        .populate("reviewedBy", "name")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    // Filter assignments that matched the unit
    const validAssignments = assignments
      .filter((a) => a.positionTemplate !== null)
      .map((a) => ({
        _id: a._id,
        positionName: a.positionTemplate?.positionName,
        dutyType: a.positionTemplate?.dutyType,
        user: a.user ? { _id: a.user._id, name: a.user.name, email: a.user.email } : null,
        status: a.status,
      }));

    const eventsSummary = events.map((ev) => ({
      _id: ev._id,
      title: ev.title,
      date: ev.date,
      venue: ev.venue,
      status: ev.status,
      attendeeCount: ev.attendance?.length || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        events: eventsSummary,
        dutyAssignments: validAssignments,
        budgetProposals,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/officer/budget-proposals
 * Submit a new budget proposal (Treasurer / ExeCom).
 */
const createBudgetProposal = async (req, res, next) => {
  try {
    const { unit, title, amount, description } = req.body;
    if (!unit || !title || !amount) {
      const err = new Error("Unit, title, and amount are required.");
      err.statusCode = 400;
      return next(err);
    }

    const proposal = await BudgetProposal.create({
      unit,
      title: title.trim(),
      amount: Number(amount),
      description: description ? description.trim() : "",
      submittedBy: req.user._id,
      status: "pending",
    });

    await AuditLog.create({
      action: "BUDGET_PROPOSAL_SUBMITTED",
      performedBy: req.user._id,
      targetType: "BudgetProposal",
      targetId: proposal._id,
      meta: { title: proposal.title, amount: proposal.amount },
    }).catch(() => {});

    const populated = await BudgetProposal.findById(proposal._id)
      .populate("unit", "name type")
      .populate("submittedBy", "name email");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/officer/budget-proposals
 * Returns budget proposals submitted by this officer, or for their chapter.
 */
const getMyBudgetProposals = async (req, res, next) => {
  try {
    const filter = { submittedBy: req.user._id };

    const proposals = await BudgetProposal.find(filter)
      .populate("unit", "name type")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: proposals.length, data: proposals });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/officer/members
 */
const getChapterMembers = async (req, res, next) => {
  try {
    let unitIds = [];

    if (req.user.globalRole === "superadmin") {
      // Superadmin: all members
    } else {
      const assignments = await DutyAssignment.find({
        user: req.user._id,
        status: "active",
      }).populate({ path: "positionTemplate", select: "unit" });

      unitIds = assignments
        .map((a) => a.positionTemplate?.unit)
        .filter(Boolean);

      const self = await User.findById(req.user._id).select("chapterMemberships");
      if (self?.chapterMemberships?.length) {
        unitIds = [...unitIds, ...self.chapterMemberships];
      }

      const seen = new Set();
      unitIds = unitIds.filter((id) => {
        const key = id.toString();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const filter =
      req.user.globalRole === "superadmin" || unitIds.length === 0
        ? {}
        : { chapterMemberships: { $in: unitIds } };

    const members = await User.find(filter)
      .select("name email chapterMemberships createdAt globalRole status profilePhoto")
      .populate("chapterMemberships", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, total: members.length, data: members });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDuties,
  getChapterOverview,
  createBudgetProposal,
  getMyBudgetProposals,
  getChapterMembers,
};
