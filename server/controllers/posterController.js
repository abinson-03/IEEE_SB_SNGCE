const PosterLog = require("../models/PosterLog");
const Unit      = require("../models/Unit");
const AuditLog  = require("../models/AuditLog");

// ─── Helper: resolve unit name / ObjectId → ObjectId ─────────────────────────
const resolveUnit = async (unitParam) => {
  if (!unitParam) return null;
  const isObjectId = /^[a-f\d]{24}$/i.test(unitParam);
  if (isObjectId) return unitParam;
  const doc = await Unit.findOne({ name: unitParam.toUpperCase() }).select("_id");
  return doc ? doc._id : null;
};

/**
 * GET /api/posters?unit=&limit=
 */
const getPosters = async (req, res, next) => {
  try {
    const { unit, limit = 50 } = req.query;
    const filter = {};
    if (unit && unit !== "All") {
      const unitId = await resolveUnit(unit);
      if (unitId) filter.unit = unitId;
    }

    const posters = await PosterLog.find(filter)
      .populate("unit", "name type")
      .populate("releasedBy", "name email")
      .sort({ releaseDate: -1 })
      .limit(parseInt(limit) || 50);

    res.status(200).json({ success: true, count: posters.length, data: posters });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posters
 * Only Design Lead, Chapter Chair, or Faculty Advisor of the chapter can release posters.
 * Superadmin can release for all chapters.
 * Files stored on disk at /uploads/posters/...
 */
const createPoster = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("Please select an image file (.jpg, .png, .webp).");
      err.statusCode = 400;
      return next(err);
    }

    const { title, unit, category = "poster", caption = "" } = req.body;
    if (!title || !unit) {
      const err = new Error("Title and unit are required.");
      err.statusCode = 400;
      return next(err);
    }

    const unitId = await resolveUnit(unit);
    if (!unitId) {
      const err = new Error("Invalid unit/chapter specified.");
      err.statusCode = 400;
      return next(err);
    }

    // ── Authorization Check: Only Design Lead, Chair, or Faculty Advisor of this chapter ──
    const User = require("../models/User");
    const DutyAssignment = require("../models/DutyAssignment");

    const isSuperAdmin = req.user.globalRole === "superadmin";

    if (!isSuperAdmin) {
      const user = await User.findById(req.user._id).select("chapterMemberships globalRole");
      const userUnits = (user?.chapterMemberships || []).map((u) => (u._id || u).toString());
      const targetUnitStr = unitId.toString();

      // Check if user is Chapter Admin (Faculty Advisor or Chapter Chair) of this chapter
      const isChapterAdminForUnit = user?.globalRole === "chapteradmin" && userUnits.includes(targetUnitStr);

      // Check active duty assignments for this unit
      const duties = await DutyAssignment.find({
        user: req.user._id,
        status: "active",
      }).populate("positionTemplate", "positionName dutyType unit");

      const matchingDuty = duties.find(
        (d) => d.positionTemplate?.unit?.toString() === targetUnitStr
      );

      let isAuthorizedOfficer = false;
      if (matchingDuty) {
        const posName = (matchingDuty.positionTemplate?.positionName || "").toLowerCase();
        const dutyType = (matchingDuty.positionTemplate?.dutyType || "").toLowerCase();

        // Must be Design Lead, Chair, or Faculty Advisor:
        const isDesignRole =
          posName.includes("design") ||
          posName.includes("creative") ||
          posName.includes("marketing") ||
          posName.includes("webmaster") ||
          dutyType === "design";
        const isChairRole = posName.includes("chair");
        const isFacultyRole = posName.includes("advisor") || posName.includes("counselor");

        if (isDesignRole || isChairRole || isFacultyRole) {
          isAuthorizedOfficer = true;
        }
      }

      if (!isChapterAdminForUnit && !isAuthorizedOfficer) {
        const err = new Error(
          "Permission denied: Only Design Lead, Chapter Chair, or Faculty Advisor of this chapter can release promotional posters."
        );
        err.statusCode = 403;
        return next(err);
      }
    }

    const fileUrl = `/uploads/posters/${req.file.filename}`;

    const poster = await PosterLog.create({
      title: title.trim(),
      unit: unitId,
      fileUrl,
      category,
      caption: caption.trim(),
      releasedBy: req.user._id,
      releaseDate: new Date(),
    });

    await AuditLog.create({
      action: "POSTER_RELEASED",
      performedBy: req.user._id,
      targetType: "Unit",
      targetId: unitId,
      meta: { title: poster.title, category: poster.category },
    }).catch(() => {});

    const populated = await PosterLog.findById(poster._id)
      .populate("unit", "name type")
      .populate("releasedBy", "name email");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/posters/:id
 */
const deletePoster = async (req, res, next) => {
  try {
    const poster = await PosterLog.findById(req.params.id);
    if (!poster) {
      const err = new Error("Poster not found.");
      err.statusCode = 404;
      return next(err);
    }

    const isSuperAdmin = req.user.globalRole === "superadmin";
    const isOwner = poster.releasedBy && poster.releasedBy.toString() === req.user._id.toString();
    const isChapterAdmin = req.user.globalRole === "chapteradmin";

    if (!isSuperAdmin && !isOwner && !isChapterAdmin) {
      const err = new Error("You do not have permission to delete this poster.");
      err.statusCode = 403;
      return next(err);
    }

    // Attempt to unlink file from disk
    const fs = require("fs");
    const path = require("path");
    if (poster.fileUrl) {
      const filePath = path.join(__dirname, "..", poster.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    await PosterLog.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Poster entry removed." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosters,
  createPoster,
  deletePoster,
};
