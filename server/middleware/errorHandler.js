/**
 * errorHandler
 * Centralized Express error-handling middleware.
 * Must be registered LAST in server.js (after all routes).
 *
 * Attach statusCode and message to Error objects before calling next(err).
 * In production, mongoose/jwt/validation error details are sanitized to
 * prevent leaking implementation details.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose: bad ObjectId (e.g. /api/users/not-an-id)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: duplicate key violation (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field '${field}'. Please use a different value.`;
  }

  // Mongoose: validation errors (required fields, enum, minlength…)
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(". ");
  }

  // Log full error in development only
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Error ${statusCode}]`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
