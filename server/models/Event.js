const mongoose = require("mongoose");
const crypto   = require("crypto");

/**
 * Event Model — Sprint 4 update
 *
 * Key changes:
 *  - registrations: richer sub-doc supports both member (user ref) and guest (name+email)
 *  - attendance:    same pattern — user ref optional for guests
 *  - qrToken:       random 32-char hex, set on first QR generation
 *  - maxAttendees:  optional cap for registration
 */

// ── Registration sub-document ─────────────────────────────────────────────────
const registrationSchema = new mongoose.Schema(
  {
    user:              { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name:              { type: String, required: true, trim: true },
    email:             { type: String, required: true, trim: true, lowercase: true },
    college:           { type: String, default: "", trim: true },
    phone:             { type: String, default: "", trim: true },
    paymentStatus:     { type: String, enum: ["free", "pending", "paid"], default: "free" },
    transactionId:     { type: String, default: "", trim: true },
    paymentScreenshot: { type: String, default: "" }, // base64 data URI of payment proof image
    ticketCode:        { type: String, default: "", trim: true, uppercase: true }, // e.g. "CIS-8492" or "TKT-31F9"
    registeredAt:      { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Attendance sub-document ───────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, trim: true, lowercase: true },
    markedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Event schema ──────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title must be 200 characters or fewer"],
    },
    description: { type: String, default: "", trim: true },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Unit reference is required"],
      index: true,
    },
    date: { type: Date, required: [true, "Event date is required"], index: true },
    venue:        { type: String, default: "", trim: true },
    maxAttendees: { type: Number, default: null }, // null = unlimited

    // Pricing & Payment fields
    isPaid:    { type: Boolean, default: false },
    fee:       { type: Number, default: 0 },       // Non-member / General fee in INR
    memberFee: { type: Number, default: 0 },       // IEEE Member fee in INR (0 = Free for members)
    upiId:     { type: String, default: "", trim: true }, // e.g. "ieee-sngce@upi"

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    // Random token used to validate QR check-in requests
    qrToken: { type: String, default: null, select: false }, // hidden from public responses

    // Custom certificate template image path on disk (e.g. /uploads/certificate-templates/cert-template-xyz.jpg)
    certificateTemplatePath: { type: String, default: null },

    registrations: [registrationSchema],
    attendance:    [attendanceSchema],
  },
  { timestamps: true }
);

// Compound index for efficient officer "my events" query
eventSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model("Event", eventSchema);
