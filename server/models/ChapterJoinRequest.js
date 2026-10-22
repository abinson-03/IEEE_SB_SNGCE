const mongoose = require("mongoose");

/**
 * ChapterJoinRequest Model — Polish Sprint
 * Tracks requests from members to join specific IEEE chapters.
 */
const chapterJoinRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Unit reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

// Prevent duplicate pending requests for the same user + chapter
chapterJoinRequestSchema.index({ user: 1, unit: 1, status: 1 });

module.exports = mongoose.model("ChapterJoinRequest", chapterJoinRequestSchema);
