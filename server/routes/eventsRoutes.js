const express = require("express");
const router  = express.Router();

const {
  getEvents, getEventById, getMyEvents,
  createEvent, updateEvent, publishEvent, archiveEvent,
  registerForEvent, generateQR, checkIn, markAttendance,
} = require("../controllers/eventsController");
const {
  generateCertificates,
  uploadCertificateTemplate,
  deleteCertificateTemplate,
} = require("../controllers/certificateController");
const { uploadPhotos }         = require("../controllers/photoController");
const { generateEventReport }  = require("../controllers/reportController");
const { uploadEventPhotos, uploadCertTemplate } = require("../middleware/uploadMiddleware");

const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");
const ownerOrAdmin   = require("../middleware/ownerOrAdmin");

// ─── Public routes (no auth required) ────────────────────────────────────────

// @route  GET /api/events
router.get("/", getEvents);

// ─── Officer/Admin routes: View own events  ───────────────────────────────────
// execom can VIEW /mine but cannot CREATE. chapteradmin and superadmin can do both.

// @route  GET /api/events/mine — must be defined BEFORE /:id to avoid route clash
router.get(
  "/mine",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  getMyEvents
);

// ─── Auth-optional: GET /api/events/:id ──────────────────────────────────────
// We try to load user but do NOT require it (guests can view event details)
router.get("/:id", (req, res, next) => {
  authMiddleware(req, res, (err) => {
    if (err && err.statusCode === 401) { req.user = null; return next(); }
    next(err);
  });
}, getEventById);

// ─── Public: register + check-in (auth optional for guest flow) ──────────────
// Auth is attempted but not enforced inside controller
router.post("/:id/register", (req, res, next) => {
  authMiddleware(req, res, (err) => {
    if (err && err.statusCode === 401) { req.user = null; return next(); }
    next(err);
  });
}, registerForEvent);

router.post("/:id/checkin", (req, res, next) => {
  authMiddleware(req, res, (err) => {
    if (err && err.statusCode === 401) { req.user = null; return next(); }
    next(err);
  });
}, checkIn);


// ─── Event write routes: superadmin + chapteradmin + execom ──────────────────

// @route  POST /api/events — create
router.post(
  "/",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  createEvent
);

// @route  PUT /api/events/:id — edit (ownerOrAdmin checks ownership)
router.put(
  "/:id",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  ownerOrAdmin,
  updateEvent
);

// @route  PATCH /api/events/:id/publish
router.patch(
  "/:id/publish",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  ownerOrAdmin,
  publishEvent
);

// @route  PATCH /api/events/:id/archive
router.patch(
  "/:id/archive",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  ownerOrAdmin,
  archiveEvent
);

// @route  POST /api/events/:id/qr — generate QR code
router.post(
  "/:id/qr",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  ownerOrAdmin,
  generateQR
);

// @route  POST /api/events/:id/attendance/mark — mark or unmark desk attendance
router.post(
  "/:id/attendance/mark",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  ownerOrAdmin,
  markAttendance
);

// @route  POST /api/events/:id/generate-certificates — generate certificates for checked-in attendees
router.post(
  "/:id/generate-certificates",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  ownerOrAdmin,
  generateCertificates
);

// @route  POST /api/events/:id/photos — upload event photos (stored on disk)
router.post(
  "/:id/photos",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  uploadEventPhotos,
  uploadPhotos
);

// @route  POST /api/events/:id/certificate-template — upload custom certificate template (JPG/PNG, max 5MB)
router.post(
  "/:id/certificate-template",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  uploadCertTemplate,
  uploadCertificateTemplate
);

// @route  DELETE /api/events/:id/certificate-template — remove custom certificate template
router.delete(
  "/:id/certificate-template",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  deleteCertificateTemplate
);

// @route  GET /api/events/:id/report — download AI-assisted event report PDF
router.get(
  "/:id/report",
  authMiddleware,
  restrictTo("execom", "chapteradmin", "superadmin"),
  generateEventReport
);

module.exports = router;
