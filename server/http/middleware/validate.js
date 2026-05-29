/**
 * Zod validation middleware for JSON bodies (and optional query).
 */

function validateBody(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.body ?? {});
    if (!r.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: r.error.flatten(),
      });
    }
    req.validated = req.validated || {};
    req.validated.body = r.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.query ?? {});
    if (!r.success) {
      return res.status(400).json({
        error: "Invalid query",
        code: "VALIDATION_ERROR",
        details: r.error.flatten(),
      });
    }
    req.validated = req.validated || {};
    req.validated.query = r.data;
    next();
  };
}

module.exports = { validateBody, validateQuery };
