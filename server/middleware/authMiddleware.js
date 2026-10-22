const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * authMiddleware
 * Verifies the JWT from the Authorization header (Bearer <token>).
 * On success, attaches the decoded user document to req.user.
 * On failure, passes a structured error to the centralized error handler.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("No token provided. Authorization denied.");
      err.statusCode = 401;
      return next(err);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch a fresh user record (so revoked/deleted users are rejected)
    // Password is excluded via select:false on the schema
    const user = await User.findById(decoded.id);

    if (!user) {
      const err = new Error("User belonging to this token no longer exists.");
      err.statusCode = 401;
      return next(err);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      error.message = "Invalid token. Authorization denied.";
      error.statusCode = 401;
    } else if (error.name === "TokenExpiredError") {
      error.message = "Token expired. Please log in again.";
      error.statusCode = 401;
    }
    next(error);
  }
};

module.exports = authMiddleware;
