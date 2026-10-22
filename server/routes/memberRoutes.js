const express = require("express");
const router = express.Router();
const { getMyProfile, getMyEvents } = require("../controllers/memberController");
const { getMyJoinRequests } = require("../controllers/joinRequestController");
const authMiddleware = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");

// All member routes: must be logged in (any authenticated role can access)
router.use(authMiddleware, restrictTo("member", "execom", "chapteradmin", "superadmin"));

// @route  GET /api/member/profile
router.get("/profile", getMyProfile);

// @route  GET /api/member/my-events
router.get("/my-events", getMyEvents);

// @route  GET /api/member/join-requests
router.get("/join-requests", getMyJoinRequests);

module.exports = router;
