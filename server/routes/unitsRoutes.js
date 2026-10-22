const express = require("express");
const router = express.Router();
const { getUnits, getUnitById, getUnitOfficers } = require("../controllers/unitsController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createJoinRequest,
  getMyJoinRequestStatus,
} = require("../controllers/joinRequestController");

// @route  GET /api/units
// @access Public
router.get("/", getUnits);

// @route  GET /api/units/:id/my-status
// @access Authenticated
router.get("/:id/my-status", authMiddleware, getMyJoinRequestStatus);

// @route  GET /api/units/:id
// @access Public
router.get("/:id", getUnitById);

// @route  GET /api/units/:id/officers
// @access Public
router.get("/:id/officers", getUnitOfficers);

// @route  POST /api/units/:id/join-request
// @access Authenticated
router.post("/:id/join-request", authMiddleware, createJoinRequest);

module.exports = router;
