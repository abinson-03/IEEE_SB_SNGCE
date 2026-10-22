const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User   = require("../models/User");
const { getTransporter: getAuthTransporter } = require("../utils/emailTransporter");

/**
 * Generates a signed JWT for the given user.
 * Payload includes id and globalRole for quick role-checks without DB lookups.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, globalRole: user.globalRole },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * POST /api/auth/register
 * Body: { name, email, password, globalRole? }
 *
 * Design choice: globalRole defaults to "guest" unless explicitly provided.
 * In production a later sprint will restrict who can assign "superadmin".
 * Password hashing is handled in the User pre-save hook.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, globalRole, chapterMemberships } = req.body;

    // Minimal field validation (Mongoose handles deeper validation)
    if (!name || !email || !password) {
      const err = new Error("Name, email, and password are required.");
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.create({
      name,
      email,
      password,
      globalRole: globalRole || "member",
      chapterMemberships: Array.isArray(chapterMemberships) ? chapterMemberships : (chapterMemberships ? [chapterMemberships] : []),
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        chapterMemberships: user.chapterMemberships || [],
        profilePhoto: user.profilePhoto || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Fetches user with password (select("+password") overrides schema select:false),
 * verifies with bcrypt, then issues a JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required.");
      err.statusCode = 400;
      return next(err);
    }

    // Re-include password field that's excluded by default
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      return next(err);
    }

    if (user.status === "inactive") {
      const err = new Error("Your account has been deactivated. Please contact an administrator.");
      err.statusCode = 403;
      return next(err);
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        chapterMemberships: user.chapterMemberships || [],
        profilePhoto: user.profilePhoto || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * JWT is stateless — actual invalidation requires a token blacklist (Sprint 3+).
 * For Sprint 1 the client simply discards the token; this endpoint confirms that.
 */
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully. Please discard your token on the client.",
  });
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Generates a secure, time-limited reset token and emails the reset link.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      const err = new Error("Please provide your email address.");
      err.statusCode = 400;
      return next(err);
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const err = new Error("No account found with that email address.");
      err.statusCode = 404;
      return next(err);
    }

    // Generate random 32-byte hex token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token to store in database
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Build reset link
    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;

    // Send email via Nodemailer
    try {
      const transporter = await getAuthTransporter();
      const fromName  = process.env.SMTP_FROM_NAME  || "IEEE SB SNGCE";
      const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@ieee-sngce.in";

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to:   `"${user.name}" <${user.email}>`,
        subject: "Password Reset Request — IEEE SB SNGCE",
        text: [
          `Hello ${user.name},`,
          "",
          "You are receiving this email because a password reset was requested for your account.",
          `Please reset your password by opening the following link:`,
          resetUrl,
          "",
          "This link will expire in 1 hour.",
          "If you did not request this, please ignore this email and your password will remain unchanged.",
          "",
          "Best regards,",
          "IEEE Student Branch SNGCE",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <div style="background:#00629B;padding:20px;text-align:center">
              <h2 style="color:#fff;margin:0">IEEE Student Branch</h2>
              <p style="color:#cce4f7;margin:4px 0 0">Sree Narayana Gurukulam College of Engineering</p>
            </div>
            <div style="padding:28px 24px;background:#fff;border:1px solid #e2e8f0">
              <h3 style="color:#1a2744;margin-top:0">Password Reset Request</h3>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>You recently requested to reset your password for your IEEE SB SNGCE portal account. Click the button below to set a new password:</p>
              <div style="text-align:center;margin:28px 0">
                <a href="${resetUrl}" style="background:#00629B;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">
                  Reset Password
                </a>
              </div>
              <p style="font-size:0.88rem;color:#666">Or copy and paste this link into your browser:</p>
              <p style="font-size:0.82rem;word-break:break-all;color:#00629B">${resetUrl}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
              <p style="font-size:0.82rem;color:#888;margin:0">This link is valid for 1 hour. If you did not make this request, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`[Password Reset Email Preview] ${user.email}: ${previewUrl}`);
    } catch (mailErr) {
      console.error("[forgotPassword] Email send error:", mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email. Please check your inbox.",
      resetToken: process.env.NODE_ENV === "test" ? resetToken : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 * Validates token and expiry, hashes and saves the new password, invalidates token.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !token.trim()) {
      const err = new Error("Reset token is required.");
      err.statusCode = 400;
      return next(err);
    }

    if (!password || password.length < 8) {
      const err = new Error("Password must be at least 8 characters long.");
      err.statusCode = 400;
      return next(err);
    }

    // Hash the token received from the client to compare with the stored hash
    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      const err = new Error("Password reset link is invalid or has expired. Please request a new one.");
      err.statusCode = 400;
      return next(err);
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, forgotPassword, resetPassword };
