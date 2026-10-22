const mongoose = require("mongoose");

/**
 * Notification Model
 * Base infrastructure for Sprint 3. Triggers (event created, duty assigned,
 * poster published) will be wired in Sprints 4-6.
 *
 * type enum:
 *   "event"   – notification about an event (registration, reminder)
 *   "duty"    – duty/position assignment notification
 *   "general" – system announcements, admin messages
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: 500,
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["event", "duty", "general", "budget", "photo"],
      default: "general",
    },
    // Optional deep-link: e.g. "/events/abc123"
    link: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false } // manual createdAt with index for efficient sorting
);

// Compound index for fast per-user unread queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
