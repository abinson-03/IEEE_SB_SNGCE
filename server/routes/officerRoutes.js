const express = require("express");
const router  = express.Router();

const {
  getMyDuties,
  getChapterOverview,
  createBudgetProposal,
  getMyBudgetProposals,
  getChapterMembers,
} = require("../controllers/officerController");

const {
  createTask,
  getOfficerTasks,
  updateTaskStatus,
} = require("../controllers/taskController");

const {
  getOfficerJoinRequests,
  updateJoinRequestStatus,
} = require("../controllers/joinRequestController");

const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");

// All officer routes: accessible by execom, chapteradmin, and superadmin
router.use(authMiddleware, restrictTo("execom", "chapteradmin", "superadmin"));

// ── Duties & Chapter Overview ─────────────────────────────────────────────────
router.get("/my-duties",        getMyDuties);
router.get("/chapter-overview", getChapterOverview);

// ── Officer Tasks ─────────────────────────────────────────────────────────────
router.post("/tasks",            createTask);
router.get("/tasks",             getOfficerTasks);
router.patch("/tasks/:id/status", updateTaskStatus);

// ── Chapter Join Requests ─────────────────────────────────────────────────────
router.get("/join-requests",     getOfficerJoinRequests);
router.patch("/join-requests/:id", updateJoinRequestStatus);

// ── Budget Proposals (Officer Submission) ─────────────────────────────────────
router.post("/budget-proposals", createBudgetProposal);
router.get("/budget-proposals",  getMyBudgetProposals);

// ── Members ───────────────────────────────────────────────────────────────────
router.get("/members", getChapterMembers);

module.exports = router;
