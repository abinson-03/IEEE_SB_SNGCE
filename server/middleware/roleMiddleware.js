/**
 * roleMiddleware
 * Factory function that returns an Express middleware restricting access
 * to routes based on the user's globalRole.
 *
 * Usage:
 *   router.get("/admin", authMiddleware, restrictTo("superadmin"), handler)
 *   router.get("/dashboard", authMiddleware, restrictTo("superadmin", "execom"), handler)
 *
 * Must be used AFTER authMiddleware (req.user must be set).
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Not authenticated. Please log in.");
      err.statusCode = 401;
      return next(err);
    }

    if (!allowedRoles.includes(req.user.globalRole)) {
      const err = new Error(
        `Role '${req.user.globalRole}' is not permitted to access this resource.`
      );
      err.statusCode = 403;
      return next(err);
    }

    next();
  };
};

module.exports = restrictTo;
