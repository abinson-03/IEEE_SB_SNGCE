const mongoose = require("mongoose");

/**
 * BudgetProposal Model — Sprint 6
 * Submitted by chapter officers (Treasurer / ExeCom) to request funds for an event or chapter initiative.
 * Super Admin reviews, approves, or rejects with an audit note.
 */
const budgetProposalSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Unit reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Proposal title is required"],
      trim: true,
      maxlength: 200,
    },
    amount: {
      type: Number,
      required: [true, "Requested amount in INR is required"],
      min: [1, "Amount must be at least 1 INR"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "submittedBy is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewDate: {
      type: Date,
      default: null,
    },
    reviewComment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

budgetProposalSchema.index({ unit: 1, status: 1 });

module.exports = mongoose.model("BudgetProposal", budgetProposalSchema);
