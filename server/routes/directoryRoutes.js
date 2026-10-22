const express = require("express");
const router = express.Router();
const { getDirectory } = require("../controllers/directoryController");

// @route  GET /api/directory
// @access Public (limited fields — email/password never returned)
router.get("/", getDirectory);

module.exports = router;
