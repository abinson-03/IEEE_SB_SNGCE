const Notification = require("../models/Notification");
const User         = require("../models/User");

/**
 * Send notification to a specific user
 */
const notifyUser = async (userId, title, message, type = "general", link = null) => {
  try {
    if (!userId) return null;
    return await Notification.create({
      recipient: userId,
      title: title.slice(0, 120),
      message: message.slice(0, 500),
      type,
      link,
    });
  } catch (err) {
    console.error("[notifyUser] Failed:", err.message);
    return null;
  }
};

/**
 * Send notification to all members belonging to a chapter / unit
 */
const notifyChapterMembers = async (unitId, title, message, type = "event", link = null) => {
  try {
    if (!unitId) return;
    const members = await User.find({
      chapterMemberships: unitId,
      status: { $ne: "inactive" },
    }).select("_id");

    if (members.length === 0) return;

    const docs = members.map((m) => ({
      recipient: m._id,
      title: title.slice(0, 120),
      message: message.slice(0, 500),
      type,
      link,
    }));

    await Notification.insertMany(docs);
  } catch (err) {
    console.error("[notifyChapterMembers] Failed:", err.message);
  }
};

/**
 * Send notification to all users holding a specific role
 */
const notifyRole = async (role, title, message, type = "general", link = null) => {
  try {
    const users = await User.find({
      globalRole: role,
      status: { $ne: "inactive" },
    }).select("_id");

    if (users.length === 0) return;

    const docs = users.map((u) => ({
      recipient: u._id,
      title: title.slice(0, 120),
      message: message.slice(0, 500),
      type,
      link,
    }));

    await Notification.insertMany(docs);
  } catch (err) {
    console.error("[notifyRole] Failed:", err.message);
  }
};

module.exports = {
  notifyUser,
  notifyChapterMembers,
  notifyRole,
};
