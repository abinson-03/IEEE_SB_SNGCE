const express = require("express");
const router  = express.Router();

const {
  getOverview,
  getUsers,
  updateUserStatus,
  getAuditLog,
  getPositionTemplates,
  createPositionTemplate,
  updatePositionTemplate,
  deletePositionTemplate,
  getDutyAssignments,
  createDutyAssignment,
  patchDutyAssignment,
  getBudgetProposals,
  reviewBudgetProposal,
  getMyAuthorizedUnit,
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");
const { createNotice, updateNotice, deleteNotice } = require("../controllers/noticeController");
const { getOfficerJoinRequests, updateJoinRequestStatus } = require("../controllers/joinRequestController");

// ── Notice Posting & Management (superadmin, execom, chapteradmin) ─────────────
router.post("/notices", authMiddleware, restrictTo("superadmin", "execom", "chapteradmin"), createNotice);
router.patch("/notices/:id", authMiddleware, restrictTo("superadmin", "execom", "chapteradmin"), updateNotice);
router.put("/notices/:id", authMiddleware, restrictTo("superadmin", "execom", "chapteradmin"), updateNotice);
router.delete("/notices/:id", authMiddleware, restrictTo("superadmin", "execom", "chapteradmin"), deleteNotice);

// ── User Selection for ExeCom & Role Assignment (superadmin & chapteradmin) ────
router.get("/users", authMiddleware, restrictTo("superadmin", "chapteradmin"), getUsers);
router.get("/my-authorized-unit", authMiddleware, restrictTo("superadmin", "chapteradmin"), getMyAuthorizedUnit);

// ── Position Templates (superadmin & chapteradmin scoped to their chapter) ─────
router.get("/position-templates",     authMiddleware, restrictTo("superadmin", "chapteradmin"), getPositionTemplates);
router.post("/position-templates",    authMiddleware, restrictTo("superadmin", "chapteradmin"), createPositionTemplate);
router.put("/position-templates/:id", authMiddleware, restrictTo("superadmin", "chapteradmin"), updatePositionTemplate);
router.delete("/position-templates/:id", authMiddleware, restrictTo("superadmin", "chapteradmin"), deletePositionTemplate);

// ── Duty Assignments (superadmin & chapteradmin scoped to their chapter) ───────
router.get("/duty-assignments",     authMiddleware, restrictTo("superadmin", "chapteradmin"), getDutyAssignments);
router.post("/duty-assignments",    authMiddleware, restrictTo("superadmin", "chapteradmin"), createDutyAssignment);
router.patch("/duty-assignments/:id", authMiddleware, restrictTo("superadmin", "chapteradmin"), patchDutyAssignment);

// All other admin routes: superadmin only
router.use(authMiddleware, restrictTo("superadmin"));

// ── Overview & System Management ──────────────────────────────────────────────
router.get("/overview", getOverview);
router.patch("/users/:id/status", updateUserStatus);
router.get("/audit",    getAuditLog);

// ── Budget Proposals (Admin Review) ───────────────────────────────────────────
router.get("/budget-proposals",     getBudgetProposals);
router.patch("/budget-proposals/:id", reviewBudgetProposal);

// ── Chapter Join Requests (Superadmin Oversight) ──────────────────────────────
router.get("/join-requests",         getOfficerJoinRequests);
router.patch("/join-requests/:id",   updateJoinRequestStatus);

module.exports = router;
