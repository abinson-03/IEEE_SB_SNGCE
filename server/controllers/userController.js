const User = require("../models/User");

/**
 * POST /api/user/profile-photo
 * Authenticated (any role).
 * Saves uploaded photo to /uploads/profiles/ and updates user.profilePhoto.
 * Never stores image binary/base64 in MongoDB.
 */
const updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("Please select an image file to upload.");
      err.statusCode = 400;
      return next(err);
    }

    // Save relative web path
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    user.profilePhoto = photoUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      profilePhoto: photoUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        profilePhoto: photoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/user/profile
 * Returns the current authenticated user's profile details.
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("name email globalRole profilePhoto chapterMemberships createdAt status")
      .populate("chapterMemberships", "name type description");

    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/user/profile
 * Allows the logged-in user to edit their own basic profile: name, email.
 * Rejects role or chapter membership modifications (kept admin-only).
 * Validates uniqueness of email.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !name.trim()) {
      const err = new Error("Name is required.");
      err.statusCode = 400;
      return next(err);
    }

    if (!email || !email.trim()) {
      const err = new Error("Email is required.");
      err.statusCode = 400;
      return next(err);
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(cleanEmail)) {
      const err = new Error("Please provide a valid email address.");
      err.statusCode = 400;
      return next(err);
    }

    // Check if another user already owns this email
    const existing = await User.findOne({
      email: cleanEmail,
      _id: { $ne: req.user._id },
    });

    if (existing) {
      const err = new Error("This email is already in use by another account.");
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    user.name = name.trim();
    user.email = cleanEmail;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/change-password
 * Authenticated user changes their own password.
 * Body: { currentPassword, newPassword }
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      const err = new Error("Current password is required.");
      err.statusCode = 400;
      return next(err);
    }

    if (!newPassword || newPassword.length < 8) {
      const err = new Error("New password must be at least 8 characters long.");
      err.statusCode = 400;
      return next(err);
    }

    // Explicitly select password field which is excluded by default
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      const err = new Error("Current password is incorrect.");
      err.statusCode = 400;
      return next(err);
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Your account is secured with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfilePhoto,
  getProfile,
  updateProfile,
  changePassword,
};
