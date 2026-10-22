const express = require("express");
const router  = express.Router();

const {
  uploadPhotos,
  getGallery,
  getRecentHighlights,
  getEventPhotos,
  updatePhoto,
  deletePhoto,
} = require("../controllers/photoController");

const authMiddleware    = require("../middleware/authMiddleware");
const restrictTo        = require("../middleware/roleMiddleware");
const { uploadEventPhotos } = require("../middleware/uploadMiddleware");

// Public gallery endpoints
router.get("/",       getGallery);
router.get("/recent", getRecentHighlights);
router.get("/:eventId", getEventPhotos);

// Upload photos for an event (Execom & Chapter Admin)
router.post(
  "/events/:id/photos",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  uploadEventPhotos,
  uploadPhotos
);

// Edit photo caption or cover status
router.patch(
  "/photos/:photoId",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  updatePhoto
);

// Delete photo
router.delete(
  "/photos/:photoId",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  deletePhoto
);

module.exports = router;
