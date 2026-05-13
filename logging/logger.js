const pino = require("pino");

const level = (process.env.LOG_LEVEL || "info").toLowerCase();

const logger = pino({
  level,
  base: { service: "ccweb-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

function requestLogger() {
  return function requestLogMw(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      logger.info({
        msg: "http_request",
        method: req.method,
        path: req.url?.split("?")[0],
        status: res.statusCode,
        durationMs: ms,
      });
    });
    next();
  };
}

module.exports = { logger, requestLogger };
