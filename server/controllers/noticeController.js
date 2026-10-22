const Notice = require("../models/Notice");

/**
 * POST /api/admin/notices (also /api/notices)
 * Superadmin or Execom posts a public announcement / notice.
 */
const createNotice = async (req, res, next) => {
  try {
    const { title, body, pinned } = req.body;

    if (!title || !title.trim() || !body || !body.trim()) {
      const err = new Error("Title and body are required for notices.");
      err.statusCode = 400;
      return next(err);
    }

    const notice = await Notice.create({
      title: title.trim(),
      body: body.trim(),
      pinned: !!pinned,
      postedBy: req.user._id,
    });

    const populated = await Notice.findById(notice._id).populate(
      "postedBy",
      "name globalRole profilePhoto"
    );

    res.status(201).json({
      success: true,
      message: "Notice posted successfully.",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notices/public
 * Public route (no auth required).
 * Returns the latest notices (pinned first, newest first).
 */
const getPublicNotices = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const notices = await Notice.find()
      .populate("postedBy", "name globalRole profilePhoto")
      .sort({ pinned: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notices/:id (also PUT)
 * Superadmin, Execom, or Chapteradmin updates an announcement / notice.
 */
const updateNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body, pinned } = req.body;

    if (!title || !title.trim() || !body || !body.trim()) {
      const err = new Error("Title and body are required for notices.");
      err.statusCode = 400;
      return next(err);
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      const err = new Error("Notice not found.");
      err.statusCode = 404;
      return next(err);
    }

    notice.title = title.trim();
    notice.body = body.trim();
    if (pinned !== undefined) {
      notice.pinned = !!pinned;
    }

    await notice.save();

    const populated = await Notice.findById(notice._id).populate(
      "postedBy",
      "name globalRole profilePhoto"
    );

    res.status(200).json({
      success: true,
      message: "Notice updated successfully.",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notices/:id
 * Superadmin, Execom, or Chapteradmin deletes an announcement.
 */
const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      const err = new Error("Notice not found.");
      err.statusCode = 404;
      return next(err);
    }

    await Notice.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotice,
  getPublicNotices,
  updateNotice,
  deleteNotice,
};
