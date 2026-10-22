const express = require("express");
const router = express.Router();
const { register, login, logout, forgotPassword, resetPassword } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * Auth Routes
 * Base path: /api/auth  (mounted in server.js)
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login and receive JWT
// @access  Public
router.post("/login", login);

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset link by email
// @access  Public
router.post("/forgot-password", forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using valid reset token
// @access  Public
router.post("/reset-password", resetPassword);

// @route   POST /api/auth/logout
// @desc    Logout (client-side token discard; stateless JWT)
// @access  Private (authMiddleware ensures a valid token is present)
router.post("/logout", authMiddleware, logout);

// @route   GET /api/auth/me
// @desc    Get currently authenticated user (useful for client bootstrap)
// @access  Private
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      globalRole: req.user.globalRole,
      chapterMemberships: req.user.chapterMemberships,
    },
  });
});

module.exports = router;
