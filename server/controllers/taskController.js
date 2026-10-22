const OfficerTask     = require("../models/OfficerTask");
const DutyAssignment  = require("../models/DutyAssignment");
const User            = require("../models/User");
const Unit            = require("../models/Unit");

/**
 * POST /api/officer/tasks
 * Oversight officer (Chair, Advisor) or Super Admin creates a task and assigns it
 * to an officer/member in their chapter.
 */
const createTask = async (req, res, next) => {
  try {
    const { unit, title, description, assignedTo, dueDate, priority } = req.body;

    if (!unit || !title || !assignedTo) {
      const err = new Error("unit, title, and assignedTo are required.");
      err.statusCode = 400;
      return next(err);
    }

    // Authorization check: Super Admin OR oversight officer for this unit
    let isAuthorized = req.user.globalRole === "superadmin";

    if (!isAuthorized) {
      // Check if user has an active DutyAssignment with dutyType="oversight" for this unit
      const activeDuties = await DutyAssignment.find({
        user: req.user._id,
        status: "active",
      }).populate("positionTemplate");

      const hasOversight = activeDuties.some(
        (d) =>
          d.positionTemplate &&
          d.positionTemplate.dutyType === "oversight" &&
          d.positionTemplate.unit?.toString() === unit.toString()
      );

      const isChapterAdmin =
        req.user.globalRole === "chapteradmin" &&
        req.user.chapterMemberships?.some((u) => u.toString() === unit.toString());

      isAuthorized = hasOversight || isChapterAdmin;
    }

    if (!isAuthorized) {
      const err = new Error("Only officers with oversight duty (e.g. Chair) or Super Admins can assign tasks for this chapter.");
      err.statusCode = 403;
      return next(err);
    }

    const task = await OfficerTask.create({
      unit,
      title,
      description: description || "",
      assignedTo,
      dueDate: dueDate || null,
      priority: priority || "medium",
      status: "pending",
      createdBy: req.user._id,
    });

    const populated = await OfficerTask.findById(task._id)
      .populate("unit", "name type")
      .populate("assignedTo", "name email profilePhoto")
      .populate("createdBy", "name globalRole");

    res.status(201).json({
      success: true,
      message: "Task created and assigned successfully.",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/officer/tasks
 * Returns tasks assigned to the logged-in officer (own tasks).
 * Supports optional ?scope=chapter&unitId=... for oversight/superadmin officers.
 */
const getOfficerTasks = async (req, res, next) => {
  try {
    const { status, scope, unitId } = req.query;
    const filter = {};

    if (scope === "chapter" && (req.user.globalRole === "superadmin" || req.user.globalRole === "chapteradmin")) {
      if (unitId) filter.unit = unitId;
    } else {
      // Default: own tasks assigned to this user
      filter.assignedTo = req.user._id;
    }

    if (status && ["pending", "done"].includes(status)) {
      filter.status = status;
    }

    const tasks = await OfficerTask.find(filter)
      .populate("unit", "name type")
      .populate("assignedTo", "name email profilePhoto")
      .populate("createdBy", "name globalRole")
      .sort({ status: 1, dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/officer/tasks/:id/status
 * Mark task as 'pending' or 'done'.
 * The assigned officer, task creator, or superadmin can update the status.
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "done"].includes(status)) {
      const err = new Error("Valid status ('pending' or 'done') is required.");
      err.statusCode = 400;
      return next(err);
    }

    const task = await OfficerTask.findById(id);
    if (!task) {
      const err = new Error("Task not found.");
      err.statusCode = 404;
      return next(err);
    }

    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isCreator  = task.createdBy.toString() === req.user._id.toString();
    const isSuper    = req.user.globalRole === "superadmin";

    if (!isAssignee && !isCreator && !isSuper) {
      const err = new Error("You do not have permission to update this task.");
      err.statusCode = 403;
      return next(err);
    }

    task.status = status;
    await task.save();

    const updated = await OfficerTask.findById(task._id)
      .populate("unit", "name type")
      .populate("assignedTo", "name email profilePhoto")
      .populate("createdBy", "name globalRole");

    res.status(200).json({
      success: true,
      message: `Task marked as ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getOfficerTasks,
  updateTaskStatus,
};
