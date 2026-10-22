const express = require("express");
const router = express.Router();
const { getMyNotifications, markOneRead, markAllRead } = require("../controllers/notificationsController");
const authMiddleware = require("../middleware/authMiddleware");

// All notification routes require authentication
router.use(authMiddleware);

// @route  GET  /api/notifications
router.get("/", getMyNotifications);

// @route  PATCH /api/notifications/read-all  (must be before /:id to avoid clash)
router.patch("/read-all", markAllRead);

// @route  PATCH /api/notifications/:id/read
router.patch("/:id/read", markOneRead);

module.exports = router;
