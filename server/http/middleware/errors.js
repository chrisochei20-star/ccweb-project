/**
 * Centralized Express error handling + typed HTTP errors.
 */

const { logger } = require("../../../logging/logger");

class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode]
   * @param {string} [code]
   */
  constructor(message, statusCode = 400, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.status = statusCode;
    Error.captureStackTrace?.(this, AppError);
  }
}

/**
 * Express 5-style error middleware — mount last on each Express app.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error({
      msg: "express_route_error",
      path: req.originalUrl || req.url,
      method: req.method,
      err: err.message,
      stack: err.stack,
    });
  }
  res.status(status).json({
    error: err.message || "Internal server error",
    code: err.code || (status >= 500 ? "SERVER_ERROR" : "REQUEST_ERROR"),
  });
}

/** Wrap async route handlers so rejections reach errorHandler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { AppError, errorHandler, asyncHandler };
