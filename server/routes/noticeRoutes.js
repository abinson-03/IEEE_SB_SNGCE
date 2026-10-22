const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");
const {
  createNotice,
  getPublicNotices,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeController");

// ── Public route: GET /api/notices/public (no auth required) ──────────────────
router.get("/public", getPublicNotices);
router.get("/",       getPublicNotices);

// ── Admin / Execom notice creation: POST /api/notices ─────────────────────────
router.post(
  "/",
  authMiddleware,
  restrictTo("superadmin", "execom", "chapteradmin"),
  createNotice
);

// ── Admin / Execom notice update: PATCH & PUT /api/notices/:id ────────────────
router.patch(
  "/:id",
  authMiddleware,
  restrictTo("superadmin", "execom", "chapteradmin"),
  updateNotice
);

router.put(
  "/:id",
  authMiddleware,
  restrictTo("superadmin", "execom", "chapteradmin"),
  updateNotice
);

// ── Admin / Execom notice deletion: DELETE /api/notices/:id ───────────────────
router.delete(
  "/:id",
  authMiddleware,
  restrictTo("superadmin", "execom", "chapteradmin"),
  deleteNotice
);

module.exports = router;
