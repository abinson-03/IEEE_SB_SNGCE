const mongoose = require("mongoose");

/**
 * MeetingMinute Model — Sprint 6B
 * Digital archive for officer and general body meeting minutes.
 * Secretary "Submit Report" shortcut links here.
 */
const meetingMinuteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
      maxlength: 200,
    },
    date: {
      type: Date,
      required: [true, "Meeting date is required"],
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Unit reference is required"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Meeting minutes / discussion points are required"],
      trim: true,
    },
    attendees: {
      type: String,
      default: "",
      trim: true,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

meetingMinuteSchema.index({ unit: 1, date: -1 });

module.exports = mongoose.model("MeetingMinute", meetingMinuteSchema);
