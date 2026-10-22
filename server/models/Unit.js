const mongoose = require("mongoose");

/**
 * Unit Model
 * Represents either the main Student Branch (SB) or a technical chapter
 * (CIS, CS, SPS, WIE). A Unit is the organisational container for events,
 * duty assignments, and position templates.
 */
const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Unit name is required"],
      unique: true,
      trim: true,
      // Expected values: "SB", "CIS", "CS", "SPS", "WIE"
    },
    type: {
      type: String,
      enum: ["branch", "chapter"],
      required: [true, "Unit type is required"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // URL or path to a cover/banner image – populated in a later sprint
    coverImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Unit", unitSchema);
