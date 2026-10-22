const mongoose = require("mongoose");

/**
 * EventPhoto Model — Sprint 6B
 * STORES ONLY FILE PATH / URL AND METADATA — NEVER BINARY/BASE64 IN MONGO!
 * Files reside on disk at /uploads/events/...
 */
const eventPhotoSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "uploadedBy user reference is required"],
    },
    filename: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true, // e.g. "/uploads/events/photo-1729512345.jpg"
    },
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    geoLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    isCover: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("EventPhoto", eventPhotoSchema);
