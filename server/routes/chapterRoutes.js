const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createJoinRequest,
  getMyJoinRequestStatus,
} = require("../controllers/joinRequestController");

// POST /api/chapters/:id/join-request — authenticated (any logged-in member/user)
router.post("/:id/join-request", authMiddleware, createJoinRequest);

// GET /api/chapters/:id/my-status — authenticated (check pending status & membership)
router.get("/:id/my-status", authMiddleware, getMyJoinRequestStatus);

module.exports = router;
