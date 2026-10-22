const PDFDocument = require("pdfkit");
const nodemailer  = require("nodemailer");
const path        = require("path");
const fs          = require("fs");
const Event       = require("../models/Event");
const Certificate = require("../models/Certificate");
const AuditLog    = require("../models/AuditLog");
const { getTransporter } = require("../utils/emailTransporter");

// ── Audit helper ──────────────────────────────────────────────────────────────
const audit = (action, performedBy, targetId, meta = {}) =>
  AuditLog.create({ action, performedBy, targetType: "Event", targetId, meta }).catch(() => {});

// ── PDF generator ─────────────────────────────────────────────────────────────
/**
 * Generates a branded IEEE SB SNGCE certificate PDF.
 * Returns a Buffer of the complete PDF binary.
 *
 * @param {object} opts
 * @param {string} opts.recipientName
 * @param {string} opts.eventTitle
 * @param {string} opts.chapterName
 * @param {Date}   opts.eventDate
 * @param {string} [opts.certificateId]
 */
const generateCertificatePDF = (opts) =>
  new Promise((resolve, reject) => {
    const { recipientName, eventTitle, chapterName, eventDate, certificateId, templatePath } = opts;

    // A4 landscape (842 × 595 pt)
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 842, H = 595;
    const IEEE_BLUE  = "#00629B";
    const IEEE_GOLD  = "#C8922A";
    const DARK_TEXT  = "#1a2744";
    const LIGHT_GREY = "#f4f7fb";

    // Format date string
    const dateStr = new Intl.DateTimeFormat("en-IN", {
      day:   "numeric",
      month: "long",
      year:  "numeric",
    }).format(new Date(eventDate));

    // Check if custom template image exists on disk
    const hasCustomTemplate = Boolean(templatePath && fs.existsSync(templatePath));

    if (hasCustomTemplate) {
      // ══════════════════════════════════════════════════════════════════════
      // CUSTOM TEMPLATE DESIGN (FULL-PAGE BACKGROUND + DYNAMIC OVERLAY)
      // ══════════════════════════════════════════════════════════════════════
      try {
        doc.image(templatePath, 0, 0, { width: W, height: H });
      } catch (imgErr) {
        console.warn("[generateCertificatePDF] Error rendering template image, falling back to background:", imgErr.message);
        doc.rect(0, 0, W, H).fill(LIGHT_GREY);
      }

      // Check if template has pre-printed event details and underline
      let nameY = 346;
      let hasPreprintedDesign = true;

      try {
        const { execFileSync } = require("child_process");
        const pyScript = `
import sys, json
from PIL import Image
try:
    im = Image.open(sys.argv[1]).convert('RGB')
    w, h = im.size
    found_line_y = None
    min_x, max_x = int(w * 0.25), int(w * 0.75)
    line_len = int((max_x - min_x) * 0.7)
    for y in range(int(h * 0.4), int(h * 0.8)):
        dark = sum(1 for x in range(min_x, max_x) if sum(im.getpixel((x, y))) < 300)
        if dark >= line_len:
            found_line_y = y
            break
    upper_dark = sum(1 for y in range(int(h*0.15), int(h*0.45), 4) for x in range(int(w*0.2), int(w*0.8), 4) if sum(im.getpixel((x,y))) < 360)
    name_y_pdf = (found_line_y - (0.058 * h)) / h * 595.28 if found_line_y else 346.0
    print(json.dumps({'hasPreprintedText': upper_dark > 100, 'nameYPdf': round(name_y_pdf, 1)}))
except Exception as e:
    print(json.dumps({'hasPreprintedText': True, 'nameYPdf': 346.0}))
`;
        const out = execFileSync("python", ["-c", pyScript, templatePath], { encoding: "utf8", timeout: 2000 });
        const parsed = JSON.parse(out.trim());
        if (parsed.nameYPdf) nameY = parsed.nameYPdf;
        if (parsed.hasPreprintedText !== undefined) hasPreprintedDesign = parsed.hasPreprintedText;
      } catch (e) {
        nameY = 346;
        hasPreprintedDesign = true;
      }

      if (hasPreprintedDesign) {
        // Prominently render recipient name right in the designated recipient line
        const nameFontSize = recipientName.length > 25 ? 24 : 28;
        doc
          .fontSize(nameFontSize)
          .fillColor("#092718")
          .font("Helvetica-Bold")
          .text(recipientName, 0, nameY, { align: "center", width: W });

        // Subtle verification note and Certificate ID at the bottom margin
        if (certificateId) {
          doc
            .fontSize(7.5)
            .fillColor("#2d4a3e")
            .font("Helvetica")
            .text(
              `Certificate ID: ${certificateId}  ·  Digitally Verified IEEE SNGCE Certificate  ·  Verify at: /verify-certificate`,
              0,
              H - 22,
              { align: "center", width: W }
            );
        }
      } else {
        // Blank border template without preprinted headings
        doc
          .fontSize(22)
          .fillColor(IEEE_BLUE)
          .font("Helvetica-Bold")
          .text("CERTIFICATE OF PARTICIPATION", 40, 170, { align: "center", width: W - 80 });

        doc
          .fontSize(12)
          .fillColor("#475569")
          .font("Helvetica")
          .text("This is to proudly certify that", 40, 205, { align: "center", width: W - 80 });

        doc
          .fontSize(28)
          .fillColor(DARK_TEXT)
          .font("Helvetica-Bold")
          .text(recipientName, 40, 235, { align: "center", width: W - 80 });

        doc
          .fontSize(12)
          .fillColor("#475569")
          .font("Helvetica")
          .text("has actively participated in the technical event", 40, 280, { align: "center", width: W - 80 });

        doc
          .fontSize(20)
          .fillColor(IEEE_BLUE)
          .font("Helvetica-Bold")
          .text(`"${eventTitle}"`, 40, 305, { align: "center", width: W - 80 });

        const orgLine = chapterName
          ? `Organized by ${chapterName}  ·  ${dateStr}`
          : dateStr;

        doc
          .fontSize(11)
          .fillColor("#334155")
          .font("Helvetica")
          .text(orgLine, 40, 345, { align: "center", width: W - 80 });

        if (certificateId) {
          doc
            .fontSize(8.5)
            .fillColor(IEEE_BLUE)
            .font("Helvetica-Bold")
            .text(`Certificate ID: ${certificateId}`, 40, H - 46, { align: "center", width: W - 80 });
        }

        doc
          .fontSize(8)
          .fillColor("#64748b")
          .font("Helvetica")
          .text(
            `Digitally verified IEEE Certificate issued on ${new Date().toLocaleDateString("en-IN")}. Verify at /verify-certificate`,
            40,
            H - 32,
            { align: "center", width: W - 80 }
          );
      }

      doc.end();
      return;
    }

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(LIGHT_GREY);

    // ── Thick top border bar ──────────────────────────────────────────────────
    doc.rect(0, 0, W, 14).fill(IEEE_BLUE);

    // ── Thick bottom border bar ───────────────────────────────────────────────
    doc.rect(0, H - 14, W, 14).fill(IEEE_BLUE);

    // ── Left accent stripe ────────────────────────────────────────────────────
    doc.rect(0, 14, 8, H - 28).fill(IEEE_GOLD);

    // ── Right accent stripe ───────────────────────────────────────────────────
    doc.rect(W - 8, 14, 8, H - 28).fill(IEEE_GOLD);

    // ── Inner border rectangle ────────────────────────────────────────────────
    doc
      .rect(30, 30, W - 60, H - 60)
      .lineWidth(1.5)
      .strokeColor(IEEE_BLUE)
      .stroke();

    // ── Header: "IEEE" wordmark area ──────────────────────────────────────────
    doc
      .fontSize(38)
      .fillColor(IEEE_BLUE)
      .font("Helvetica-Bold")
      .text("IEEE", 0, 55, { align: "center" });

    doc
      .fontSize(11)
      .fillColor(DARK_TEXT)
      .font("Helvetica")
      .text("Institute of Electrical and Electronics Engineers", 0, 100, { align: "center" });

    doc
      .fontSize(10)
      .fillColor(DARK_TEXT)
      .font("Helvetica")
      .text(
        `Student Branch — Sree Narayana Gurukulam College of Engineering, Kadayiruppu`,
        0,
        116,
        { align: "center" }
      );

    // ── Horizontal rule ───────────────────────────────────────────────────────
    doc
      .moveTo(80, 138)
      .lineTo(W - 80, 138)
      .lineWidth(1)
      .strokeColor(IEEE_BLUE)
      .stroke();

    // ── "Certificate of Participation" heading ────────────────────────────────
    doc
      .fontSize(24)
      .fillColor(DARK_TEXT)
      .font("Helvetica")
      .text("Certificate of Participation", 0, 155, { align: "center" });

    // ── "This is to certify that" ─────────────────────────────────────────────
    doc
      .fontSize(13)
      .fillColor(DARK_TEXT)
      .font("Helvetica")
      .text("This is to certify that", 0, 200, { align: "center" });

    // ── Recipient name ────────────────────────────────────────────────────────
    doc
      .fontSize(30)
      .fillColor(IEEE_BLUE)
      .font("Helvetica-Bold")
      .text(recipientName, 0, 225, { align: "center" });

    // ── Underline below name ──────────────────────────────────────────────────
    const nameWidth = doc.widthOfString(recipientName, { fontSize: 30 });
    const nameX = (W - Math.min(nameWidth, 500)) / 2;
    doc
      .moveTo(nameX, 266)
      .lineTo(W - nameX, 266)
      .lineWidth(0.8)
      .strokeColor(IEEE_GOLD)
      .stroke();

    // ── "participated in" ─────────────────────────────────────────────────────
    doc
      .fontSize(13)
      .fillColor(DARK_TEXT)
      .font("Helvetica")
      .text("has successfully participated in the event", 0, 278, { align: "center" });

    // ── Event title ───────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .fillColor(DARK_TEXT)
      .font("Helvetica-Bold")
      .text(`"${eventTitle}"`, 60, 302, { align: "center", width: W - 120 });

    // ── Chapter + date ────────────────────────────────────────────────────────
    const orgLine = chapterName
      ? `Organized by ${chapterName}  ·  ${dateStr}`
      : dateStr;

    doc
      .fontSize(11)
      .fillColor("#555")
      .font("Helvetica")
      .text(orgLine, 0, 352, { align: "center" });

    // ── Signature block (left) ────────────────────────────────────────────────
    const sigY = 450;

    doc
      .moveTo(100, sigY)
      .lineTo(260, sigY)
      .lineWidth(0.8)
      .strokeColor(DARK_TEXT)
      .stroke();
    doc
      .fontSize(10)
      .fillColor(DARK_TEXT)
      .font("Helvetica-Bold")
      .text("Faculty Counselor", 100, sigY + 6, { width: 160, align: "center" });
    doc
      .fontSize(9)
      .fillColor("#555")
      .font("Helvetica")
      .text("IEEE SB SNGCE", 100, sigY + 20, { width: 160, align: "center" });

    // ── Signature block (right) ───────────────────────────────────────────────
    doc
      .moveTo(582, sigY)
      .lineTo(742, sigY)
      .lineWidth(0.8)
      .strokeColor(DARK_TEXT)
      .stroke();
    doc
      .fontSize(10)
      .fillColor(DARK_TEXT)
      .font("Helvetica-Bold")
      .text("Student Branch Chair", 582, sigY + 6, { width: 160, align: "center" });
    doc
      .fontSize(9)
      .fillColor("#555")
      .font("Helvetica")
      .text("IEEE SB SNGCE", 582, sigY + 20, { width: 160, align: "center" });

    // ── Footer note & Certificate ID ─────────────────────────────────────────
    if (certificateId) {
      doc
        .fontSize(8)
        .fillColor(IEEE_BLUE)
        .font("Helvetica-Bold")
        .text(`Certificate ID: ${certificateId}`, 0, H - 56, { align: "center" });
    }

    doc
      .fontSize(8)
      .fillColor("#999")
      .font("Helvetica")
      .text(
        `This certificate was digitally issued on ${new Date().toLocaleDateString("en-IN")}. Verify authenticity at /verify-certificate`,
        0,
        H - 42,
        { align: "center" }
      );

    doc.end();
  });

// ── Email sender ──────────────────────────────────────────────────────────────
/**
 * Sends a certificate PDF as email attachment.
 * Returns { ok: true } or { ok: false, error: string }.
 */
const sendCertificateEmail = async ({ toEmail, toName, eventTitle, pdfBuffer, filename }) => {
  try {
    const transporter = await getTransporter();
    const fromName  = process.env.SMTP_FROM_NAME  || "IEEE SB SNGCE";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@ieee-sngce.in";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to:   `"${toName}" <${toEmail}>`,
      subject: `Your Certificate of Participation — ${eventTitle}`,
      text: [
        `Dear ${toName},`,
        "",
        `Congratulations! Your Certificate of Participation for "${eventTitle}" is attached.`,
        "",
        "Thank you for participating in our event.",
        "",
        "Best regards,",
        "IEEE Student Branch",
        "Sree Narayana Gurukulam College of Engineering, Kadayiruppu",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:#00629B;padding:20px;text-align:center">
            <h2 style="color:#fff;margin:0">IEEE Student Branch</h2>
            <p style="color:#cce4f7;margin:4px 0 0">Sree Narayana Gurukulam College of Engineering</p>
          </div>
          <div style="padding:28px 24px;background:#fff">
            <p>Dear <strong>${toName}</strong>,</p>
            <p>Congratulations! Your <strong>Certificate of Participation</strong> for the event:</p>
            <blockquote style="border-left:4px solid #00629B;margin:12px 0;padding:8px 16px;background:#f0f7ff">
              <strong style="font-size:1.05em">${eventTitle}</strong>
            </blockquote>
            <p>is attached to this email as a PDF. You can also download it anytime from your <strong>My Certificates</strong> page.</p>
            <p style="margin-top:24px">Thank you for your participation!</p>
            <p>Best regards,<br><strong>IEEE SB SNGCE</strong></p>
          </div>
          <div style="background:#f4f7fb;padding:12px;text-align:center;font-size:12px;color:#888">
            IEEE Student Branch · SNGCE, Kadayiruppu
          </div>
        </div>
      `,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    // Log Ethereal preview URL in dev
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`[Email Preview] ${toEmail}: ${previewUrl}`);

    return { ok: true };
  } catch (err) {
    console.error(`[sendCertificateEmail] Failed for ${toEmail}:`, err.message);
    return { ok: false, error: err.message };
  }
};

// ── GET /api/certificates/eligible ───────────────────────────────────────────
// Officer: list events that are eligible for certificate generation
// Eligible = published OR archived, with checked-in attendees OR date passed
const getEligibleEvents = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const DutyAssignment = require("../models/DutyAssignment");
    let filter = {};

    if (req.user.globalRole !== "superadmin") {
      const u = await User.findById(req.user._id).select("chapterMemberships");
      const userUnits = (u?.chapterMemberships || []).map((id) => (id._id || id).toString());

      const duties = await DutyAssignment.find({ user: req.user._id, status: "active" })
        .populate("positionTemplate", "unit");
      for (const d of duties) {
        if (d.positionTemplate?.unit) {
          userUnits.push((d.positionTemplate.unit._id || d.positionTemplate.unit).toString());
        }
      }

      const uniqueUnits = [...new Set(userUnits)];
      if (uniqueUnits.length > 0) {
        filter.unit = { $in: uniqueUnits };
      }
    }
    // superadmin → no filter (all events)

    // Events that are published/archived AND (have checked-in attendees OR date has passed)
    filter.status = { $in: ["published", "archived"] };
    filter.$or = [
      { "attendance.0": { $exists: true } },
      { date: { $lte: new Date() } },
    ];

    const events = await Event.find(filter)
      .populate("unit", "name type")
      .select("title date venue unit attendance status certificateTemplatePath")
      .sort({ date: -1 });

    // Annotate each event with certificate counts
    const Certificate = require("../models/Certificate");
    const eventIds = events.map((e) => e._id);
    const certCounts = await Certificate.aggregate([
      { $match: { event: { $in: eventIds } } },
      { $group: { _id: "$event", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    certCounts.forEach((c) => { countMap[c._id.toString()] = c.count; });

    const result = events.map((ev) => ({
      _id:                     ev._id,
      title:                   ev.title,
      date:                    ev.date,
      venue:                   ev.venue,
      status:                  ev.status,
      unit:                    ev.unit,
      attendanceCount:         ev.attendance.length,
      certCount:               countMap[ev._id.toString()] || 0,
      certificateTemplatePath: ev.certificateTemplatePath || null,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ── POST /api/certificates/:eventId/generate ──────────────────────────────────
// Also mapped to: POST /api/events/:id/generate-certificates
// Officer-triggered: bulk-generate one Certificate + PDF per checked-in attendee
const generateCertificates = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const event = await Event.findById(eventId).populate("unit", "name type");
    if (!event) {
      const e = new Error("Event not found."); e.statusCode = 404; return next(e);
    }

    if (event.attendance.length === 0) {
      return res.json({ success: true, generated: 0, updated: 0, failed: 0,
        message: "No checked-in attendees found for this event." });
    }

    const chapterName = event.unit?.name
      ? `${event.unit.name} Chapter`
      : "IEEE Student Branch";

    // Check if custom template path is set on event and exists on disk
    let templateFilePath = null;
    if (event.certificateTemplatePath) {
      const resolved = path.join(__dirname, "..", event.certificateTemplatePath);
      if (fs.existsSync(resolved)) {
        templateFilePath = resolved;
      }
    }

    let generated = 0, updated = 0, failed = 0;
    const errors = [];

    for (const attendee of event.attendance) {
      try {
        const cleanEmail = attendee.email.toLowerCase().trim();
        const existing = await Certificate.findOne({
          event: event._id,
          recipientEmail: cleanEmail,
        });

        // Generate unique certificate ID (e.g. IEEE-CIS-2026-X7K2P) or reuse existing
        const unitCode = (event.unit?.name || "SB").toUpperCase();
        const eventYear = new Date(event.date || Date.now()).getFullYear();
        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        const certificateId = existing?.certificateId || `IEEE-${unitCode}-${eventYear}-${randomPart}`;

        // Generate PDF
        const pdfBuffer = await generateCertificatePDF({
          recipientName: attendee.name,
          eventTitle:    event.title,
          chapterName,
          eventDate:     event.date,
          certificateId,
          templatePath:  templateFilePath,
        });

        // Send email (non-fatal)
        const filename = `IEEE_Certificate_${event.title.replace(/[^a-zA-Z0-9]/g, "_")}_${attendee.name.replace(/\s+/g, "_")}.pdf`;
        const emailResult = await sendCertificateEmail({
          toEmail:    attendee.email,
          toName:     attendee.name,
          eventTitle: event.title,
          pdfBuffer,
          filename,
        });

        if (existing) {
          // Update existing certificate PDF with new template overlay
          existing.pdfData        = pdfBuffer;
          existing.recipientName  = attendee.name;
          existing.eventTitle     = event.title;
          existing.eventDate      = event.date;
          existing.chapterName    = chapterName;
          existing.emailSent      = emailResult.ok;
          existing.emailError     = emailResult.ok ? "" : emailResult.error;
          existing.generatedAt    = new Date();
          await existing.save();
          updated++;
        } else {
          // Save new cert to DB
          await Certificate.create({
            event:          event._id,
            user:           attendee.user || null,
            recipientName:  attendee.name,
            recipientEmail: cleanEmail,
            eventTitle:     event.title,
            eventDate:      event.date,
            chapterName,
            certificateId,
            pdfData:        pdfBuffer,
            emailSent:      emailResult.ok,
            emailError:     emailResult.ok ? "" : emailResult.error,
            generatedBy:    req.user._id,
          });
          generated++;
        }
      } catch (err) {
        failed++;
        errors.push({ email: attendee.email, error: err.message });
        console.error(`[generateCertificates] Error for ${attendee.email}:`, err.message);
      }
    }

    await audit("CERTIFICATES_GENERATED", req.user._id, event._id, {
      eventTitle: event.title,
      generated, updated, failed,
    });

    res.json({
      success: true,
      generated,
      updated,
      failed,
      errors: failed > 0 ? errors : undefined,
      message: `Done — ${generated} created, ${updated} updated with template, ${failed} failed.`,
    });
  } catch (err) { next(err); }
};

// ── GET /api/certificates/my ──────────────────────────────────────────────────
// Member: list their own certificates
const getMyCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({
      $or: [
        { user: req.user._id },
        { recipientEmail: req.user.email.toLowerCase().trim() },
      ],
    })
      .select("-pdfData")          // don't return binary in list
      .populate("event", "title date venue")
      .sort({ generatedAt: -1 });

    res.json({ success: true, data: certs });
  } catch (err) { next(err); }
};

// ── GET /api/certificates/:certId/download ────────────────────────────────────
// Member: download their own cert as PDF
const downloadCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.certId);
    if (!cert) {
      const e = new Error("Certificate not found."); e.statusCode = 404; return next(e);
    }

    // Authorization: must be the cert's owner OR an officer/admin
    const role = req.user.globalRole;
    const isOwner =
      (cert.user && cert.user.toString() === req.user._id.toString()) ||
      (cert.recipientEmail && cert.recipientEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim());
    const isOfficer = ["chapteradmin", "superadmin", "execom"].includes(role);

    if (!isOwner && !isOfficer) {
      const e = new Error("You do not have permission to download this certificate.");
      e.statusCode = 403; return next(e);
    }

    const safeTitle = cert.eventTitle.replace(/[^a-zA-Z0-9]/g, "_");
    const safeName  = cert.recipientName.replace(/\s+/g, "_");
    const filename  = `IEEE_Certificate_${safeTitle}_${safeName}.pdf`;

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(cert.pdfData);
  } catch (err) { next(err); }
};

// ── GET /api/certificates/verify/:certId ──────────────────────────────────────
// Public route (no auth required)
// Verifies whether a given certificate ID or ObjectId is authentic.
const verifyCertificate = async (req, res, next) => {
  try {
    const { certId } = req.params;
    if (!certId || !certId.trim()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Certificate ID is required.",
      });
    }

    const cleanId = certId.trim();
    const isObjectId = /^[a-f\d]{24}$/i.test(cleanId);

    const query = {
      $or: [
        { certificateId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
        ...(isObjectId ? [{ _id: cleanId }] : []),
      ],
    };

    const cert = await Certificate.findOne(query);
    if (!cert) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Certificate not found. The ID provided does not match any authentic IEEE certificate.",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        certificateId: cert.certificateId || cert._id.toString(),
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        eventTitle: cert.eventTitle,
        chapterName: cert.chapterName || "IEEE Student Branch",
        eventDate: cert.eventDate,
        issueDate: cert.generatedAt || cert.issuedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/events/:id/certificate-template
 * POST /api/certificates/:eventId/template
 * Upload a custom certificate background image (JPG/PNG, max 5MB).
 * Stored on disk at /uploads/certificate-templates/
 */
const uploadCertificateTemplate = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error("Event not found.");
      err.statusCode = 404;
      return next(err);
    }

    if (!req.file) {
      const err = new Error("Please select an image file (.jpg or .png) for the certificate template.");
      err.statusCode = 400;
      return next(err);
    }

    // Delete previous template file from disk if present
    if (event.certificateTemplatePath) {
      const oldPath = path.join(__dirname, "..", event.certificateTemplatePath);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
    }

    const templatePath = `/uploads/certificate-templates/${req.file.filename}`;
    event.certificateTemplatePath = templatePath;
    await event.save();

    await audit("CERTIFICATE_TEMPLATE_UPLOADED", req.user._id, event._id, {
      eventTitle: event.title,
      templatePath,
    });

    res.status(200).json({
      success: true,
      message: "Certificate template uploaded successfully.",
      certificateTemplatePath: templatePath,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/events/:id/certificate-template
 * DELETE /api/certificates/:eventId/template
 * Remove custom template for an event; reverts to default design.
 */
const deleteCertificateTemplate = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error("Event not found.");
      err.statusCode = 404;
      return next(err);
    }

    if (event.certificateTemplatePath) {
      const oldPath = path.join(__dirname, "..", event.certificateTemplatePath);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
      event.certificateTemplatePath = null;
      await event.save();
    }

    await audit("CERTIFICATE_TEMPLATE_REMOVED", req.user._id, event._id, {
      eventTitle: event.title,
    });

    res.status(200).json({
      success: true,
      message: "Custom certificate template removed. Default design will be used.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEligibleEvents,
  generateCertificates,
  getMyCertificates,
  downloadCertificate,
  verifyCertificate,
  uploadCertificateTemplate,
  deleteCertificateTemplate,
};
