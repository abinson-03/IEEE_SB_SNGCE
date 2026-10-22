const mongoose = require("mongoose");

/**
 * Certificate Model — Sprint 5
 *
 * One Certificate document per (event, attendee email) pair.
 * Stores the PDF as a Buffer in the DB so members can download anytime.
 * Supports both IEEE members (user ref) and guests (user = null).
 */
const certificateSchema = new mongoose.Schema(
  {
    // ── References ──────────────────────────────────────────────────────────
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    // User ref — null for guests who don't have an IEEE portal account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ── Snapshot of attendee info at generation time ─────────────────────────
    recipientName:  { type: String, required: true, trim: true },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // ── Snapshot of event info at generation time ────────────────────────────
    eventTitle:  { type: String, required: true, trim: true },
    eventDate:   { type: Date,   required: true },
    chapterName: { type: String, default: "",   trim: true },

    // ── Unique Public Certificate ID (e.g. IEEE-CIS-2026-XXXXX) ──────────────
    certificateId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },

    // ── PDF storage (binary Buffer) ──────────────────────────────────────────
    // Typically 30–80 KB for a plain IEEE-branded PDF
    pdfData: { type: Buffer, required: true },

    // ── Email delivery tracking ──────────────────────────────────────────────
    emailSent:  { type: Boolean, default: false },
    emailError: { type: String,  default: "" }, // last error string if delivery failed

    // ── Audit ────────────────────────────────────────────────────────────────
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    generatedAt: { type: Date, default: Date.now },
    issuedAt:    { type: Date, default: Date.now }, // alias kept for compatibility
  },
  { timestamps: false }
);

// One cert per (event × email) — re-generation overwrites the old doc
certificateSchema.index({ event: 1, recipientEmail: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
