const express = require("express");
const router  = express.Router();

const {
  getEventAnalytics,
  getLeaderboard,
  sendAdvisorDigest,
} = require("../controllers/analyticsController");

const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");

// Public or member leaderboard
router.get("/leaderboard", getLeaderboard);

// Event analytics: accessible to officers and admin
router.get("/events", authMiddleware, restrictTo("execom", "chapteradmin", "superadmin"), getEventAnalytics);

// Manual Advisor Digest trigger
router.post("/advisor-digest/:unitId", authMiddleware, restrictTo("chapteradmin", "superadmin"), sendAdvisorDigest);

module.exports = router;
