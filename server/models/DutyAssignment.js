const mongoose = require("mongoose");

/**
 * DutyAssignment Model
 * Links a User to a PositionTemplate for a specific unit and academic year.
 * A user can hold at most one position per unit per year — enforced by the
 * compound index below. (Sprint 3+ will add CMS UI to manage this.)
 *
 * Status values:
 *   active   – currently holding the position
 *   completed – term finished (e.g. academic year ended)
 *   vacant    – position exists but no one is assigned yet
 */
const dutyAssignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // NOTE: can be null/undefined when status is "vacant"
    },
    positionTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PositionTemplate",
      required: [true, "PositionTemplate reference is required"],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    // The Super Admin (or ExeCom lead) who made this assignment
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "completed", "vacant"],
      default: "vacant",
    },
  },
  { timestamps: true }
);

// A user can only hold one assignment per position template
dutyAssignmentSchema.index(
  { user: 1, positionTemplate: 1 },
  { unique: true, sparse: true } // sparse: true allows multiple vacant (user=null) entries
);

module.exports = mongoose.model("DutyAssignment", dutyAssignmentSchema);
