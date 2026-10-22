const express = require("express");
const router  = express.Router();

const {
  getEligibleEvents,
  generateCertificates,
  getMyCertificates,
  downloadCertificate,
  verifyCertificate,
  uploadCertificateTemplate,
  deleteCertificateTemplate,
} = require("../controllers/certificateController");
const { uploadCertTemplate } = require("../middleware/uploadMiddleware");

const authMiddleware = require("../middleware/authMiddleware");
const restrictTo     = require("../middleware/roleMiddleware");

// ── Public verification route (NO AUTH REQUIRED) ──────────────────────────────
// GET /api/certificates/verify/:certId
router.get("/verify/:certId", verifyCertificate);

// ── All following certificate routes require authentication ───────────────────
router.use(authMiddleware);

// ── Officer routes: eligible events list + bulk generation ────────────────────

// GET /api/certificates/eligible
// Returns events the officer can generate certs for
router.get(
  "/eligible",
  restrictTo("execom", "chapteradmin", "superadmin"),
  getEligibleEvents
);

// POST /api/certificates/:eventId/generate
// Bulk-generate certs for all checked-in attendees of an event
router.post(
  "/:eventId/generate",
  restrictTo("execom", "chapteradmin", "superadmin"),
  generateCertificates
);

// POST /api/certificates/:eventId/template
// Upload custom certificate template
router.post(
  "/:eventId/template",
  restrictTo("execom", "chapteradmin", "superadmin"),
  uploadCertTemplate,
  uploadCertificateTemplate
);

// DELETE /api/certificates/:eventId/template
// Revert to default certificate template
router.delete(
  "/:eventId/template",
  restrictTo("execom", "chapteradmin", "superadmin"),
  deleteCertificateTemplate
);

// ── Member routes ─────────────────────────────────────────────────────────────

// GET /api/certificates/my
// Returns the logged-in member's own certificates (metadata only, no PDF binary)
router.get(
  "/my",
  restrictTo("member", "execom", "chapteradmin", "superadmin"),
  getMyCertificates
);

// GET /api/certificates/:certId/download
// Streams the PDF binary back to the browser
router.get(
  "/:certId/download",
  restrictTo("member", "execom", "chapteradmin", "superadmin"),
  downloadCertificate
);

module.exports = router;
