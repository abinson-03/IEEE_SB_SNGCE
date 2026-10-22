const mongoose = require("mongoose");

/**
 * AuditLog Model
 * Records every significant state-changing action in the portal.
 * Sprint 4: logs event create / edit / publish / archive.
 * Sprint 6: Admin Audit Trail view will query this collection.
 *
 * action examples: "EVENT_CREATED", "EVENT_PUBLISHED", "EVENT_ARCHIVED",
 *                  "EVENT_EDITED", "CHECKIN_MARKED"
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system-generated entries
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Event", "User", "Unit", "Certificate", "DutyAssignment", "PositionTemplate", "BudgetProposal", "System"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Extra context: e.g. { from: "draft", to: "published" } or { eventTitle: "..." }
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false }, // immutable — no updates
  }
);

// Index for Admin Audit Trail: newest first, filter by action or performer
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
