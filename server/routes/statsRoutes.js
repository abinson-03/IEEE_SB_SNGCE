const express = require("express");
const router = express.Router();
const { getPublicStats } = require("../controllers/statsController");

// @route  GET /api/stats/public
// @access Public
router.get("/public", getPublicStats);

module.exports = router;
