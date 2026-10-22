const express = require("express");
const router  = express.Router();

const {
  getPosters,
  createPoster,
  deletePoster,
} = require("../controllers/posterController");

const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");
const { uploadPoster } = require("../middleware/uploadMiddleware");

// Public can view released posters
router.get("/", getPosters);

// Design lead / officer upload poster
router.post(
  "/",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  uploadPoster,
  createPoster
);

router.delete(
  "/:id",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  deletePoster
);

module.exports = router;
