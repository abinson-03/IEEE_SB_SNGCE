const mongoose = require("mongoose");

/**
 * PositionTemplate Model
 * Defines what officer positions exist for a given Unit in a given academic year.
 * This is the "dynamic" part of the duty engine — a Super Admin can create,
 * edit, or remove position templates per unit per year via the CMS (Sprint 3+).
 *
 * Example: CIS might have "Chair", "Vice Chair", "Secretary", "Joint Secretary",
 * "Treasurer", "Webmaster", … (up to 15+ positions). SPS may have fewer.
 * The list is NOT hardcoded — it lives entirely in this collection.
 */
const positionTemplateSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Unit reference is required"],
    },
    positionName: {
      type: String,
      required: [true, "Position name is required"],
      trim: true,
      // e.g. "Chair", "Vice Chair", "Secretary", "Joint Secretary", "Treasurer"
    },
    // Duty type drives position-specific workflows (Sprint 6)
    dutyType: {
      type: String,
      enum: ["oversight", "reporting", "budget", "design", "general"],
      default: "general",
    },
    // Academic year string, e.g. "2025-2026", "2026-2027"
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
    },
    // Soft delete: archived templates are hidden from active rosters
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    // The Super Admin who created this template
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy (Super Admin) is required"],
    },
  },
  { timestamps: true }
);

// Compound index: each position name should be unique per unit per year
positionTemplateSchema.index(
  { unit: 1, positionName: 1, academicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model("PositionTemplate", positionTemplateSchema);
