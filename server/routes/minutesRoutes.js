const express = require("express");
const router  = express.Router();

const {
  getMeetingMinutes,
  createMeetingMinute,
  deleteMeetingMinute,
} = require("../controllers/minutesController");

const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");

// All meeting minute endpoints require officer or admin role
router.use(authMiddleware, restrictTo("execom", "chapteradmin", "superadmin"));

router.get("/",     getMeetingMinutes);
router.post("/",    createMeetingMinute);
router.delete("/:id", restrictTo("chapteradmin", "superadmin"), deleteMeetingMinute);

module.exports = router;
