const User             = require("../models/User");
const Event            = require("../models/Event");
const Unit             = require("../models/Unit");
const AuditLog         = require("../models/AuditLog");
const PositionTemplate = require("../models/PositionTemplate");
const DutyAssignment   = require("../models/DutyAssignment");
const BudgetProposal   = require("../models/BudgetProposal");
const { notifyUser }   = require("../utils/notify");

/**
 * GET /api/admin/overview
 * High-level system stats for the Super Admin dashboard.
 */
const getOverview = async (req, res, next) => {
  try {
    const [totalUsers, totalEvents, totalUnits, totalProposals, roleBreakdown] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Unit.countDocuments(),
      BudgetProposal.countDocuments({ status: "pending" }),
      User.aggregate([
        { $group: { _id: "$globalRole", count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalUnits,
        pendingProposals: totalProposals,
        roleBreakdown: Object.fromEntries(
          roleBreakdown.map((r) => [r._id, r.count])
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users?page=1&limit=20&role=&search=
 * Paginated user list for the User Management panel.
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const filter = {};
    if (role) filter.globalRole = role;
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("name email globalRole chapterMemberships status createdAt profilePhoto")
      .populate("chapterMemberships", "name type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate a user account.
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      const err = new Error("Status must be either 'active' or 'inactive'.");
      err.statusCode = 400;
      return next(err);
    }

    if (req.user._id.toString() === req.params.id && status === "inactive") {
      const err = new Error("You cannot deactivate your own account.");
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    user.status = status;
    await user.save();

    await AuditLog.create({
      action: "USER_STATUS_UPDATED",
      performedBy: req.user._id,
      targetType: "User",
      targetId: user._id,
      meta: { name: user.name, email: user.email, newStatus: status },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `User ${user.name} is now ${status}.`,
      data: { _id: user._id, status: user.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit?limit=50&page=1&action=
 * Paginated audit log for the Admin Audit Trail view.
 */
const getAuditLog = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, action } = req.query;
    const filter = {};
    if (action) filter.action = action.toUpperCase();

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(filter);
    const logs  = await AuditLog.find(filter)
      .populate("performedBy", "name email globalRole")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) { next(error); }
};

// ── Chapter & ExeCom Scope Helpers ──────────────────────────────────────────

/**
 * Returns authorized Unit IDs for the requesting user.
 * - superadmin: returns null (means universal access to SB + all chapters)
 * - chapteradmin / advisor: returns array of authorized chapter unit ID strings
 */
const getAuthorizedUnitIds = async (user) => {
  if (!user) return [];
  if (user.globalRole === "superadmin") return null; // unconstrained access

  const unitIds = new Set();

  if (Array.isArray(user.chapterMemberships)) {
    user.chapterMemberships.forEach((ch) => {
      const id = typeof ch === "object" ? ch._id || ch : ch;
      if (id) unitIds.add(id.toString());
    });
  }

  const duties = await DutyAssignment.find({ user: user._id, status: "active" })
    .populate("positionTemplate", "unit");

  for (const d of duties) {
    const uId = d.positionTemplate?.unit;
    if (uId) unitIds.add(uId.toString());
  }

  return Array.from(unitIds);
};

/**
 * Synchronizes user's globalRole based on their remaining active duty assignments.
 * Called whenever an officer steps down or is replaced by a new officer.
 */
const syncUserGlobalRole = async (userId) => {
  if (!userId) return;
  const user = await User.findById(userId);
  if (!user || user.globalRole === "superadmin") return; // never demote superadmin

  const activeDuties = await DutyAssignment.find({
    user: userId,
    status: "active",
  }).populate("positionTemplate", "positionName dutyType");

  if (activeDuties.length === 0) {
    // No active leadership duties remaining -> return to student member
    if (user.globalRole !== "member") {
      user.globalRole = "member";
      await user.save();
    }
    return;
  }

  const hasChairOrAdvisor = activeDuties.some((d) => {
    const p = (d.positionTemplate?.positionName || "").toLowerCase();
    return p.includes("chair") || p.includes("advisor");
  });

  if (hasChairOrAdvisor) {
    if (user.globalRole !== "chapteradmin") {
      user.globalRole = "chapteradmin";
      await user.save();
    }
  } else {
    if (user.globalRole !== "execom") {
      user.globalRole = "execom";
      await user.save();
    }
  }
};

// ── Position Templates ────────────────────────────────────────────────────────

/**
 * GET /api/admin/position-templates?unit=&academicYear=&includeArchived=
 */
const getPositionTemplates = async (req, res, next) => {
  try {
    const { unit, academicYear, includeArchived } = req.query;
    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);

    const filter = {};
    if (authorizedUnitIds) {
      if (unit) {
        if (!authorizedUnitIds.includes(unit.toString())) {
          // Constrain gracefully to their authorized unit without 403 error
          filter.unit = { $in: authorizedUnitIds };
        } else {
          filter.unit = unit;
        }
      } else {
        filter.unit = { $in: authorizedUnitIds };
      }
    } else if (unit) {
      filter.unit = unit;
    }

    if (academicYear) filter.academicYear = academicYear;
    if (includeArchived !== "true") filter.isArchived = { $ne: true };

    const templates = await PositionTemplate.find(filter)
      .populate("unit", "name type")
      .populate("createdBy", "name")
      .sort({ unit: 1, positionName: 1 });

    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (error) { next(error); }
};

/**
 * POST /api/admin/position-templates
 */
const createPositionTemplate = async (req, res, next) => {
  try {
    const { unit, positionName, dutyType = "general", academicYear } = req.body;
    if (!unit || !positionName || !academicYear) {
      const err = new Error("Unit, positionName, and academicYear are required.");
      err.statusCode = 400;
      return next(err);
    }

    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);
    if (authorizedUnitIds && !authorizedUnitIds.includes(unit.toString())) {
      const err = new Error("You are only authorized to create positions for your own chapter.");
      err.statusCode = 403;
      return next(err);
    }

    const validDuties = ["oversight", "reporting", "budget", "design", "general"];
    if (!validDuties.includes(dutyType)) {
      const err = new Error(`dutyType must be one of: ${validDuties.join(", ")}`);
      err.statusCode = 400;
      return next(err);
    }

    const template = await PositionTemplate.create({
      unit,
      positionName: positionName.trim(),
      dutyType,
      academicYear: academicYear.trim(),
      createdBy: req.user._id,
    });

    // Also create initial vacant DutyAssignment so it appears on the roster
    await DutyAssignment.create({
      positionTemplate: template._id,
      status: "vacant",
      assignedBy: req.user._id,
    }).catch(() => {});

    await AuditLog.create({
      action: "POSITION_TEMPLATE_CREATED",
      performedBy: req.user._id,
      targetType: "PositionTemplate",
      targetId: template._id,
      meta: { positionName, dutyType, academicYear },
    }).catch(() => {});

    const populated = await PositionTemplate.findById(template._id)
      .populate("unit", "name type")
      .populate("createdBy", "name");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      error.message = "A position with this name already exists for this unit and academic year.";
      error.statusCode = 409;
    }
    next(error);
  }
};

/**
 * PUT /api/admin/position-templates/:id
 */
const updatePositionTemplate = async (req, res, next) => {
  try {
    const { positionName, dutyType, academicYear, isArchived } = req.body;
    const template = await PositionTemplate.findById(req.params.id);
    if (!template) {
      const err = new Error("Position template not found.");
      err.statusCode = 404;
      return next(err);
    }

    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);
    if (authorizedUnitIds && !authorizedUnitIds.includes(template.unit.toString())) {
      const err = new Error("You are only authorized to edit positions for your own chapter.");
      err.statusCode = 403;
      return next(err);
    }

    if (positionName) template.positionName = positionName.trim();
    if (dutyType)     template.dutyType = dutyType;
    if (academicYear) template.academicYear = academicYear.trim();
    if (typeof isArchived === "boolean") template.isArchived = isArchived;

    await template.save();

    await AuditLog.create({
      action: "POSITION_TEMPLATE_EDITED",
      performedBy: req.user._id,
      targetType: "PositionTemplate",
      targetId: template._id,
      meta: { positionName: template.positionName, dutyType: template.dutyType },
    }).catch(() => {});

    const populated = await PositionTemplate.findById(template._id)
      .populate("unit", "name type")
      .populate("createdBy", "name");

    res.status(200).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/admin/position-templates/:id
 * Soft-delete (archive) if referenced by a duty assignment, otherwise hard delete.
 */
const deletePositionTemplate = async (req, res, next) => {
  try {
    const template = await PositionTemplate.findById(req.params.id);
    if (!template) {
      const err = new Error("Position template not found.");
      err.statusCode = 404;
      return next(err);
    }

    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);
    if (authorizedUnitIds && !authorizedUnitIds.includes(template.unit.toString())) {
      const err = new Error("You are only authorized to delete positions for your own chapter.");
      err.statusCode = 403;
      return next(err);
    }

    const hasAssignments = await DutyAssignment.exists({ positionTemplate: template._id, status: "active" });

    template.isArchived = true;
    await template.save();

    // Mark any active duty assignment as vacant and sync users
    const existingAssignments = await DutyAssignment.find({ positionTemplate: template._id });
    for (const a of existingAssignments) {
      if (a.user) {
        const uId = a.user;
        a.status = "vacant";
        a.user = null;
        await a.save();
        await syncUserGlobalRole(uId);
      }
    }

    await AuditLog.create({
      action: "POSITION_TEMPLATE_ARCHIVED",
      performedBy: req.user._id,
      targetType: "PositionTemplate",
      targetId: template._id,
      meta: { positionName: template.positionName, hadActiveAssignments: !!hasAssignments },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Position template archived successfully.",
      data: { _id: template._id, isArchived: true },
    });
  } catch (error) { next(error); }
};

// ── Duty Assignments ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/duty-assignments?unit=&academicYear=
 */
const getDutyAssignments = async (req, res, next) => {
  try {
    const { unit, academicYear } = req.query;
    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);

    // Find templates matching filter
    const templateFilter = { isArchived: { $ne: true } };

    if (authorizedUnitIds) {
      if (unit) {
        if (!authorizedUnitIds.includes(unit.toString())) {
          // Constrain gracefully to their authorized unit without 403 error
          templateFilter.unit = { $in: authorizedUnitIds };
        } else {
          templateFilter.unit = unit;
        }
      } else {
        templateFilter.unit = { $in: authorizedUnitIds };
      }
    } else if (unit) {
      templateFilter.unit = unit;
    }

    if (academicYear) templateFilter.academicYear = academicYear;

    const templates = await PositionTemplate.find(templateFilter).select("_id");
    const templateIds = templates.map((t) => t._id);

    const assignments = await DutyAssignment.find({ positionTemplate: { $in: templateIds } })
      .populate({
        path: "positionTemplate",
        populate: { path: "unit", select: "name type" },
      })
      .populate("user", "name email globalRole")
      .populate("assignedBy", "name")
      .sort({ "positionTemplate.unit": 1, "positionTemplate.positionName": 1 });

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) { next(error); }
};

/**
 * POST /api/admin/duty-assignments
 * Assigns a user to a position template with officer transition support.
 * When a new officer replaces an old officer (e.g. new Chair appointed):
 * - Old officer's assignment is transitioned and their role cleanly synced
 * - New officer is assigned, promoted (chapteradmin for Chair/Advisor, execom for others),
 *   and chapterMemberships is updated.
 */
const createDutyAssignment = async (req, res, next) => {
  try {
    const { positionTemplateId, userId } = req.body;
    if (!positionTemplateId) {
      const err = new Error("positionTemplateId is required.");
      err.statusCode = 400;
      return next(err);
    }

    const template = await PositionTemplate.findById(positionTemplateId).populate("unit", "name type");
    if (!template) {
      const err = new Error("Position template not found.");
      err.statusCode = 404;
      return next(err);
    }

    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);
    if (authorizedUnitIds && !authorizedUnitIds.includes(template.unit._id.toString())) {
      const err = new Error("You are only authorized to assign duties for your own chapter.");
      err.statusCode = 403;
      return next(err);
    }

    let assignment = await DutyAssignment.findOne({ positionTemplate: positionTemplateId });
    if (!assignment) {
      assignment = new DutyAssignment({ positionTemplate: positionTemplateId });
    }

    const previousUserId = assignment.user ? assignment.user.toString() : null;
    const newUserId = userId ? userId.toString() : null;

    if (newUserId) {
      assignment.user = newUserId;
      assignment.status = "active";
      assignment.assignedBy = req.user._id;
      assignment.assignedAt = new Date();
      await assignment.save();

      // Upgrade new user's role and ensure chapter membership
      const newUser = await User.findById(newUserId);
      if (newUser && newUser.globalRole !== "superadmin") {
        const isChairOrAdvisor = /chair|advisor/i.test(template.positionName);
        newUser.globalRole = isChairOrAdvisor ? "chapteradmin" : "execom";

        // Add chapter membership if not present
        const unitIdStr = template.unit._id.toString();
        const hasChapter = (newUser.chapterMemberships || []).some(
          (ch) => (ch._id || ch).toString() === unitIdStr
        );
        if (!hasChapter) {
          newUser.chapterMemberships = newUser.chapterMemberships || [];
          newUser.chapterMemberships.push(template.unit._id);
        }
        await newUser.save();
      }

      // If an existing officer was replaced (e.g. Abinson stepped down for new Chair)
      if (previousUserId && previousUserId !== newUserId) {
        await syncUserGlobalRole(previousUserId);
      }
    } else {
      // Vacating position
      assignment.user = null;
      assignment.status = "vacant";
      await assignment.save();

      if (previousUserId) {
        await syncUserGlobalRole(previousUserId);
      }
    }

    await AuditLog.create({
      action: newUserId ? "DUTY_ASSIGNED" : "DUTY_VACATED",
      performedBy: req.user._id,
      targetType: "DutyAssignment",
      targetId: assignment._id,
      meta: {
        position: template.positionName,
        unit: template.unit?.name,
        userId: newUserId || null,
        replacedUserId: previousUserId && previousUserId !== newUserId ? previousUserId : null,
      },
    }).catch(() => {});

    if (newUserId) {
      await notifyUser(
        newUserId,
        "New Position Assigned",
        `You have been appointed as ${template.positionName} for ${template.unit?.name || "IEEE SB"}.`,
        "duty",
        "/officer"
      );
    }

    const populated = await DutyAssignment.findById(assignment._id)
      .populate({
        path: "positionTemplate",
        populate: { path: "unit", select: "name type" },
      })
      .populate("user", "name email globalRole");

    res.status(200).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/duty-assignments/:id
 * Reassign or vacate an assignment with automatic officer role handover.
 */
const patchDutyAssignment = async (req, res, next) => {
  try {
    const { userId, action } = req.body;
    const assignment = await DutyAssignment.findById(req.params.id)
      .populate({
        path: "positionTemplate",
        populate: { path: "unit", select: "name type" },
      });

    if (!assignment) {
      const err = new Error("Duty assignment not found.");
      err.statusCode = 404;
      return next(err);
    }

    const unitIdStr = assignment.positionTemplate?.unit?._id?.toString() || assignment.positionTemplate?.unit?.toString();
    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);
    if (authorizedUnitIds && !authorizedUnitIds.includes(unitIdStr)) {
      const err = new Error("You are only authorized to manage assignments for your own chapter.");
      err.statusCode = 403;
      return next(err);
    }

    const previousUserId = assignment.user ? assignment.user.toString() : null;
    const newUserId = userId ? userId.toString() : null;

    if (action === "vacate" || userId === null || userId === "") {
      assignment.user = null;
      assignment.status = "vacant";
      await assignment.save();

      if (previousUserId) {
        await syncUserGlobalRole(previousUserId);
      }
    } else if (newUserId) {
      assignment.user = newUserId;
      assignment.status = "active";
      assignment.assignedBy = req.user._id;
      assignment.assignedAt = new Date();
      await assignment.save();

      // Upgrade new user's role
      const newUser = await User.findById(newUserId);
      if (newUser && newUser.globalRole !== "superadmin") {
        const isChairOrAdvisor = /chair|advisor/i.test(assignment.positionTemplate?.positionName || "");
        newUser.globalRole = isChairOrAdvisor ? "chapteradmin" : "execom";

        const hasChapter = (newUser.chapterMemberships || []).some(
          (ch) => (ch._id || ch).toString() === unitIdStr
        );
        if (!hasChapter && unitIdStr) {
          newUser.chapterMemberships = newUser.chapterMemberships || [];
          newUser.chapterMemberships.push(assignment.positionTemplate.unit);
        }
        await newUser.save();
      }

      // Re-sync previous officer's role if replaced
      if (previousUserId && previousUserId !== newUserId) {
        await syncUserGlobalRole(previousUserId);
      }
    }

    await AuditLog.create({
      action: assignment.status === "active" ? "DUTY_ASSIGNED" : "DUTY_VACATED",
      performedBy: req.user._id,
      targetType: "DutyAssignment",
      targetId: assignment._id,
      meta: {
        position: assignment.positionTemplate?.positionName,
        status: assignment.status,
      },
    }).catch(() => {});

    const populated = await DutyAssignment.findById(assignment._id)
      .populate({
        path: "positionTemplate",
        populate: { path: "unit", select: "name type" },
      })
      .populate("user", "name email globalRole");

    res.status(200).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// ── Budget Proposals (Admin Review) ───────────────────────────────────────────

/**
 * GET /api/admin/budget-proposals?status=&unit=
 */
const getBudgetProposals = async (req, res, next) => {
  try {
    const { status, unit } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (unit)   filter.unit = unit;

    const proposals = await BudgetProposal.find(filter)
      .populate("unit", "name type")
      .populate("submittedBy", "name email globalRole")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: proposals.length, data: proposals });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/budget-proposals/:id
 * Approve or reject a budget proposal with a comment
 */
const reviewBudgetProposal = async (req, res, next) => {
  try {
    const { status, reviewComment = "" } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      const err = new Error("Status must be either 'approved' or 'rejected'.");
      err.statusCode = 400;
      return next(err);
    }

    const proposal = await BudgetProposal.findById(req.params.id).populate("unit", "name");
    if (!proposal) {
      const err = new Error("Budget proposal not found.");
      err.statusCode = 404;
      return next(err);
    }

    proposal.status        = status;
    proposal.reviewedBy    = req.user._id;
    proposal.reviewDate    = new Date();
    proposal.reviewComment = reviewComment.trim();

    await proposal.save();

    await AuditLog.create({
      action: status === "approved" ? "BUDGET_APPROVED" : "BUDGET_REJECTED",
      performedBy: req.user._id,
      targetType: "BudgetProposal",
      targetId: proposal._id,
      meta: {
        title: proposal.title,
        amount: proposal.amount,
        unit: proposal.unit?.name,
        reviewComment: proposal.reviewComment,
      },
    }).catch(() => {});

    // Notify Treasurer
    if (proposal.submittedBy) {
      await notifyUser(
        proposal.submittedBy._id || proposal.submittedBy,
        `Budget Proposal ${status === "approved" ? "Approved" : "Rejected"}`,
        `Your proposal "${proposal.title}" for ₹${proposal.amount} was ${status}.${proposal.reviewComment ? ` Note: "${proposal.reviewComment}"` : ""}`,
        "budget",
        "/officer"
      );
    }

    const populated = await BudgetProposal.findById(proposal._id)
      .populate("unit", "name type")
      .populate("submittedBy", "name email")
      .populate("reviewedBy", "name");

    res.status(200).json({
      success: true,
      message: `Proposal marked as ${status}.`,
      data: populated,
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/my-authorized-unit
 * Returns the primary authorized chapter unit document for chapteradmin / advisor.
 */
const getMyAuthorizedUnit = async (req, res, next) => {
  try {
    const authorizedUnitIds = await getAuthorizedUnitIds(req.user);
    if (!authorizedUnitIds || authorizedUnitIds.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }
    const unit = await Unit.findById(authorizedUnitIds[0]);
    res.status(200).json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getUsers,
  updateUserStatus,
  getAuditLog,
  getPositionTemplates,
  createPositionTemplate,
  updatePositionTemplate,
  deletePositionTemplate,
  getDutyAssignments,
  createDutyAssignment,
  patchDutyAssignment,
  getBudgetProposals,
  reviewBudgetProposal,
  getMyAuthorizedUnit,
};
