const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Returns the current user's 20 most recent notifications (newest first).
 * Requires auth.
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read (only if it belongs to req.user).
 */
const markOneRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      const err = new Error("Notification not found.");
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marks ALL of the current user's notifications as read.
 */
const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper — create a notification programmatically (used by other controllers
 * in Sprint 4+ when events, duties, and posters trigger notifications).
 */
const createNotification = async ({ recipient, title, message, type = "general", link = null }) => {
  return Notification.create({ recipient, title, message, type, link });
};

module.exports = { getMyNotifications, markOneRead, markAllRead, createNotification };
