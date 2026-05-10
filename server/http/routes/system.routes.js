/**
 * System routes — mount on Express apps at "/" or "/api" as needed.
 */

const express = require("express");
const { getHealthPayload } = require("../controllers/health.controller");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json(getHealthPayload());
});

router.get("/api/health", (req, res) => {
  res.json(getHealthPayload());
});

module.exports = { systemRoutes: router };
