/**
 * CCWEB HTTP layer — middleware, controllers, small route modules.
 * Express sub-apps (platform, auth, …) compose these pieces for a consistent REST surface.
 */

module.exports = {
  ...require("./middleware/errors"),
  auth: require("./middleware/auth"),
  rateLimit: require("./middleware/expressRateLimit"),
  validate: require("./middleware/validate"),
  health: require("./controllers/health.controller"),
  systemRoutes: require("./routes/system.routes").systemRoutes,
};
