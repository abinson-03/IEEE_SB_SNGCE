const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { uploadProfilePhoto } = require("../middleware/uploadMiddleware");
const { updateProfilePhoto, getProfile, updateProfile, changePassword } = require("../controllers/userController");

// All user routes require authentication (any role)
router.use(authMiddleware);

// GET /api/user/profile
router.get("/profile", getProfile);

// PATCH /api/user/profile
router.patch("/profile", updateProfile);

// POST /api/user/change-password
router.post("/change-password", changePassword);

// POST /api/user/profile-photo
router.post("/profile-photo", uploadProfilePhoto, updateProfilePhoto);

module.exports = router;
