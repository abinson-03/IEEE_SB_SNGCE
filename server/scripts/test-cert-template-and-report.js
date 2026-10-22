const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Event = require("../models/Event");
const Certificate = require("../models/Certificate");
const EventPhoto = require("../models/EventPhoto");
const User = require("../models/User");

const BASE_URL = "http://localhost:5000/api";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { status: res.status, token: data.token, user: data.user };
}

async function runTests() {
  console.log("=== Testing Custom Certificate Template & Event Report Generation ===\n");
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ieee_sb_portal");
  console.log("Connected to MongoDB");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  try {
    // Authenticate as Super Admin / Advisor
    const auth = await login("archana.sb@ieee-sngce.in", "Advisor@1234");
    assert(auth.status === 200 && !!auth.token, "Logged in as Admin (Archana)");
    const token = auth.token;

    // Find an event for testing
    let testEvent = await Event.findOne({ status: "published" });
    if (!testEvent) {
      testEvent = await Event.findOne();
    }
    assert(testEvent !== null, `Found test event: "${testEvent?.title}" (${testEvent?._id})`);

    // Ensure event has at least 1 attendee in attendance
    if (!testEvent.attendance || testEvent.attendance.length === 0) {
      testEvent.attendance = [
        {
          name: "Test Attendee",
          email: "test.attendee@ieee-sngce.in",
          markedAt: new Date(),
        },
      ];
      await testEvent.save();
      console.log("Added test attendee to event attendance");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: Custom Certificate Template Upload
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Test 1] Certificate Template Upload (Multipart)");

    // Create a dummy 100x100 PNG image
    // Minimal 1x1 valid PNG
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const testTemplateFile = path.join(__dirname, "temp-test-template.png");
    fs.writeFileSync(testTemplateFile, Buffer.from(pngBase64, "base64"));

    // Upload using FormData
    const formData = new FormData();
    const fileBytes = fs.readFileSync(testTemplateFile);
    formData.append("template", new Blob([fileBytes], { type: "image/png" }), "template.png");

    const uploadRes = await fetch(`${BASE_URL}/events/${testEvent._id}/certificate-template`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 200, "POST /api/events/:id/certificate-template returned 200");
    assert(uploadData.success === true, "Upload response marked success: true");
    assert(!!uploadData.certificateTemplatePath, `Template path returned: ${uploadData.certificateTemplatePath}`);

    // Verify on disk
    const diskPath = path.join(__dirname, "..", uploadData.certificateTemplatePath);
    assert(fs.existsSync(diskPath), `Uploaded template file exists on disk at: ${diskPath}`);

    // Verify updated on Event document in DB
    const refreshedEvent = await Event.findById(testEvent._id);
    assert(refreshedEvent.certificateTemplatePath === uploadData.certificateTemplatePath, "Event model in MongoDB has certificateTemplatePath updated");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: Certificate Generation using Custom Template
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Test 2] Certificate Generation with Custom Template");

    // Delete any existing certificates for this event & test attendee so generation runs
    await Certificate.deleteMany({ event: testEvent._id });

    const genRes = await fetch(`${BASE_URL}/events/${testEvent._id}/generate-certificates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const genData = await genRes.json();
    assert(genRes.status === 200, "POST /api/events/:id/generate-certificates returned 200");
    assert(genData.generated >= 1, `Generated ${genData.generated} certificate(s) using custom template`);

    // Fetch generated certificate and verify PDF data
    const cert = await Certificate.findOne({ event: testEvent._id });
    assert(cert !== null, "Found generated Certificate document in DB");
    assert(cert?.pdfData && cert.pdfData.length > 500, `Certificate PDF Buffer generated (${cert?.pdfData?.length} bytes)`);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: Template Removal & Revert to Default Branded Design
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Test 3] Template Removal & Default Design Fallback");

    const deleteRes = await fetch(`${BASE_URL}/events/${testEvent._id}/certificate-template`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200, "DELETE /api/events/:id/certificate-template returned 200");
    assert(deleteData.success === true, "Delete response marked success: true");

    const eventNoTemplate = await Event.findById(testEvent._id);
    assert(eventNoTemplate.certificateTemplatePath === null, "Event.certificateTemplatePath is null in DB");

    // Generate certificates again without custom template (fallback)
    await Certificate.deleteMany({ event: testEvent._id });
    const genFallbackRes = await fetch(`${BASE_URL}/events/${testEvent._id}/generate-certificates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const genFallbackData = await genFallbackRes.json();
    assert(genFallbackRes.status === 200, "Generate certificates without custom template returned 200");
    assert(genFallbackData.generated >= 1, `Generated ${genFallbackData.generated} certificate(s) using default fallback design`);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: Event Report Generation
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Test 4] Event Report Generation (GET /api/events/:id/report)");

    // Test with an uploaded photo
    const testPhotoPath = path.join(__dirname, "../uploads/events/report-test-img.png");
    fs.writeFileSync(testPhotoPath, Buffer.from(pngBase64, "base64"));
    const photoDoc = await EventPhoto.create({
      event: testEvent._id,
      uploadedBy: testEvent.createdBy,
      filename: "report-test-img.png",
      url: "/uploads/events/report-test-img.png",
      caption: "Test Event Photo",
      geoLocation: { lat: 9.9816, lng: 76.2999 },
    });

    const reportRes = await fetch(`${BASE_URL}/events/${testEvent._id}/report`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert(reportRes.status === 200, "GET /api/events/:id/report returned HTTP 200");
    assert(reportRes.headers.get("content-type") === "application/pdf", "Response Content-Type is application/pdf");
    assert(reportRes.headers.get("content-disposition")?.includes("attachment"), "Response Content-Disposition includes attachment");

    const reportBuffer = await reportRes.arrayBuffer();
    assert(reportBuffer.byteLength > 1000, `Report PDF received (${reportBuffer.byteLength} bytes)`);

    // Verify PDF was saved to disk
    const reportDiskPath = path.join(__dirname, `../uploads/docs/event-report-${testEvent._id}.pdf`);
    assert(fs.existsSync(reportDiskPath), `Report PDF saved to disk at: ${reportDiskPath}`);

    // Verify static serving of the saved report
    const staticRes = await fetch(`http://localhost:5000/uploads/docs/event-report-${testEvent._id}.pdf`);
    assert(staticRes.status === 200, "Static route /uploads/docs/event-report-:id.pdf serves 200");

    // Clean up temporary test files
    if (fs.existsSync(testTemplateFile)) fs.unlinkSync(testTemplateFile);
    if (fs.existsSync(testPhotoPath)) fs.unlinkSync(testPhotoPath);
    await EventPhoto.deleteOne({ _id: photoDoc._id });
    console.log("Cleaned up test artifacts.");

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log(`\n================================`);
    console.log(`Tests completed: ${passed}/${total} passed`);
    console.log(`================================`);
  }
}

runTests();
