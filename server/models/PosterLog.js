const mongoose = require("mongoose");

/**
 * PosterLog Model — Sprint 6B
 * Stores uploaded promotional posters, social media banners, and flyers.
 * Design Lead "Upload Poster" shortcut links here.
 * Files stored on disk at /uploads/posters/...
 */
const posterLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Poster title is required"],
      trim: true,
      maxlength: 200,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Unit reference is required"],
      index: true,
    },
    fileUrl: {
      type: String,
      required: [true, "Poster file URL is required"],
    },
    category: {
      type: String,
      enum: ["poster", "banner", "social", "brochure"],
      default: "poster",
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

posterLogSchema.index({ unit: 1, releaseDate: -1 });

module.exports = mongoose.model("PosterLog", posterLogSchema);
