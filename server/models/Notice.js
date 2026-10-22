const mongoose = require("mongoose");

/**
 * Notice Model — Polish Sprint
 * Public notices and announcements posted by Super Admin or Officers.
 */
const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
    },
    body: {
      type: String,
      required: [true, "Notice content is required"],
      trim: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "PostedBy user reference is required"],
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Notice", noticeSchema);
