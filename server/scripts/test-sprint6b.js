/**
 * test-sprint6b.js — Sprint 6B: Analytics, Photo Album, Report Generator, Minutes, Posters, Notifications
 */

process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http     = require("http");
const app      = require("../server");
const mongoose = require("mongoose");
const fs       = require("fs");
const path     = require("path");
const User     = require("../models/User");
const Unit     = require("../models/Unit");
const Event    = require("../models/Event");
const EventPhoto    = require("../models/EventPhoto");
const MeetingMinute = require("../models/MeetingMinute");
const PosterLog     = require("../models/PosterLog");
const Notification  = require("../models/Notification");
const DutyAssignment= require("../models/DutyAssignment");

const results = [];
const record = (item, passed, details = "") => {
  results.push({ item, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} ${item}${details ? " — " + details : ""}`);
};

const f = (base, urlPath, opts = {}) =>
  fetch(`${base}${urlPath}`, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers || {}),
    },
    method: opts.method || "GET",
    body:   opts.body ? JSON.stringify(opts.body) : undefined,
  });

const getToken = async (base, email, password) => {
  const r = await f(base, "/api/auth/login", { method: "POST", body: { email, password } });
  const d = await r.json();
  return d.token || d.data?.token || null;
};

async function run() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Sprint 6B — Analytics, Gallery, Minutes, Reports");
  console.log("═══════════════════════════════════════════════════\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5008, resolve));
  const base = "http://127.0.0.1:5008";
  const ts   = Date.now();

  try {
    const unit = await Unit.findOne({ name: "CIS" });
    const unitId = unit._id;

    // Accounts
    const admin = await User.create({
      name: "S6B Admin", email: `s6badmin_${ts}@t.com`,
      password: "Test@1234", globalRole: "superadmin",
    });
    const officer = await User.create({
      name: "S6B Officer", email: `s6bofficer_${ts}@t.com`,
      password: "Test@1234", globalRole: "chapteradmin",
      chapterMemberships: [unitId],
    });

    const adminToken   = await getToken(base, `s6badmin_${ts}@t.com`,   "Test@1234");
    const officerToken = await getToken(base, `s6bofficer_${ts}@t.com`, "Test@1234");

    record("Auth — superadmin login", !!adminToken);
    record("Auth — officer login",    !!officerToken);

    // Create a test event with attendance
    const ev = await Event.create({
      title: `S6B Analytics Summit ${ts}`,
      unit: unitId,
      date: new Date(Date.now() - 86400000),
      venue: "Tech Auditorium",
      status: "published",
      createdBy: officer._id,
      registrations: [
        { name: "Att1", email: `att1_${ts}@t.com` },
        { name: "Att2", email: `att2_${ts}@t.com` },
        { name: "Att3", email: `att3_${ts}@t.com` },
        { name: "Att4", email: `att4_${ts}@t.com` },
        { name: "Att5", email: `att5_${ts}@t.com` },
      ],
      attendance: [
        { name: "Att1", email: `att1_${ts}@t.com` },
        { name: "Att2", email: `att2_${ts}@t.com` },
      ],
    });

    // ── 1. Event Analytics & Insights ─────────────────────────────────────────
    console.log("\n── 1. Event Analytics & Insights ─────────────────────");
    const r1 = await f(base, "/api/analytics/events", { token: officerToken });
    const d1 = await r1.json();
    record("1a. GET /api/analytics/events (200)", r1.status === 200, `status=${r1.status}`);
    record("1b. overallAttendanceRate calculated", typeof d1.data?.overallAttendanceRate === "number");
    record("1c. chapterComparison returned", Array.isArray(d1.data?.chapterComparison));
    record("1d. timeTrend returned", Array.isArray(d1.data?.timeTrend));
    const targetEv = d1.data?.events?.find((e) => e._id === ev._id.toString());
    record("1e. event attendanceRate is 40%", targetEv?.attendanceRate === 40, `rate=${targetEv?.attendanceRate}`);

    // ── 2. Duty Completion Leaderboard & Badges ───────────────────────────────
    console.log("\n── 2. Leaderboard & Badges ───────────────────────────");
    const r2 = await f(base, "/api/analytics/leaderboard");
    const d2 = await r2.json();
    record("2a. GET /api/analytics/leaderboard (200)", r2.status === 200);
    record("2b. returns array of officers", Array.isArray(d2.data));
    if (d2.data?.length > 0) {
      record("2c. officer has completionScore", typeof d2.data[0].completionScore === "number");
      record("2d. officer has badge object", d2.data[0].badge !== undefined);
    }

    // ── 3. Advisor Digest Email ───────────────────────────────────────────────
    console.log("\n── 3. Advisor Digest Email ───────────────────────────");
    const r3 = await f(base, `/api/analytics/advisor-digest/${unitId}`, {
      method: "POST", token: officerToken,
    });
    const d3 = await r3.json();
    record("3a. POST /advisor-digest/:unitId (200)", r3.status === 200, `status=${r3.status}`);
    record("3b. digest summary generated", !!d3.data?.advisorName);

    // ── 4. Event Photo Album (Disk Storage & URL Reference) ───────────────────
    console.log("\n── 4. Event Photo Album ──────────────────────────────");
    // Create dummy image on disk for multer upload test
    const dummyImg = path.join(__dirname, `dummy_${ts}.png`);
    fs.writeFileSync(dummyImg, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));

    const formData = new FormData();
    const fileBytes = fs.readFileSync(dummyImg);
    formData.append("photos", new Blob([fileBytes], { type: "image/png" }), `test_${ts}.png`);
    formData.append("caption", "Official opening session");
    formData.append("lat", "10.0261");
    formData.append("lng", "76.4950");

    const r4 = await fetch(`${base}/api/events/${ev._id}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${officerToken}` },
      body: formData,
    });
    const d4 = await r4.json();
    record("4a. POST /api/events/:id/photos (201)", r4.status === 201, `status=${r4.status}`);
    record("4b. 1 photo stored", d4.count === 1);

    // Verify DB does NOT store binary
    const photoDoc = await EventPhoto.findOne({ event: ev._id });
    record("4c. DB stores relative URL only", photoDoc?.url?.startsWith("/uploads/events/"));
    record("4d. No binary/buffer in DB", photoDoc?.pdfData === undefined && photoDoc?.data === undefined);
    record("4e. Geo-coordinates stored", photoDoc?.geoLocation?.lat === 10.0261);

    // Clean up dummy temp file
    fs.unlinkSync(dummyImg);

    // ── 5. Public Gallery & Recent Highlights ─────────────────────────────────
    console.log("\n── 5. Public Gallery Endpoints ───────────────────────");
    const r5 = await f(base, "/api/gallery");
    const d5 = await r5.json();
    record("5a. GET /api/gallery (200)", r5.status === 200);
    record("5b. returns album for event", d5.data?.some((a) => a.eventId === ev._id.toString()));

    const r5b = await f(base, "/api/gallery/recent?limit=3");
    const d5b = await r5b.json();
    record("5c. GET /api/gallery/recent (200)", r5b.status === 200);
    record("5d. recent highlights has coverPhoto", d5b.data?.[0]?.coverPhoto?.length > 0);

    const r5c = await f(base, `/api/gallery/${ev._id}`);
    const d5c = await r5c.json();
    record("5e. GET /api/gallery/:eventId (200)", r5c.status === 200);
    record("5f. returns photos list", d5c.data?.length > 0);

    // ── 6. AI-Assisted Event Report PDF ───────────────────────────────────────
    console.log("\n── 6. AI Event Report Generator ──────────────────────");
    const r6 = await fetch(`${base}/api/events/${ev._id}/report`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    record("6a. GET /events/:id/report (200)", r6.status === 200);
    record("6b. Content-Type is PDF", r6.headers.get("content-type")?.includes("application/pdf"));
    const reportBuf = await r6.arrayBuffer();
    record("6c. PDF starts with %PDF", Buffer.from(reportBuf).slice(0, 4).toString() === "%PDF");

    // ── 7. Digital Meeting Minutes Archive ────────────────────────────────────
    console.log("\n── 7. Meeting Minutes Archive ────────────────────────");
    const r7 = await f(base, "/api/minutes", {
      method: "POST",
      token: officerToken,
      body: {
        title: `CIS ExeCom Meeting ${ts}`,
        date: new Date(),
        unit: unitId,
        content: "Discussed upcoming machine learning symposium and lab kits.",
        attendees: "Chair, Secretary, Vice Chair",
      },
    });
    const d7 = await r7.json();
    record("7a. POST /api/minutes (201)", r7.status === 201);
    const minuteId = d7.data?._id;

    const r7b = await f(base, `/api/minutes?unit=${unitId}`, { token: officerToken });
    const d7b = await r7b.json();
    record("7b. GET /api/minutes (200)", r7b.status === 200);
    record("7c. minute in list", d7b.data?.some((m) => m._id === minuteId));

    // Delete minute
    const r7c = await f(base, `/api/minutes/${minuteId}`, { method: "DELETE", token: adminToken });
    record("7d. DELETE /api/minutes/:id (200)", r7c.status === 200);

    // ── 8. Poster / Content Release Log ───────────────────────────────────────
    console.log("\n── 8. Poster Release Log ─────────────────────────────");
    const r8 = await f(base, "/api/posters");
    record("8. GET /api/posters (200)", r8.status === 200);

    // ── 9. Notifications Verification ─────────────────────────────────────────
    console.log("\n── 9. Notification Triggers ──────────────────────────");
    // Verify notifications were fired into DB
    const notifCount = await Notification.countDocuments();
    record("9. Notifications fired in DB", notifCount > 0, `count=${notifCount}`);

  } catch (err) {
    console.error("\nTest suite error:", err.message);
    record("Suite — no crash", false, err.message);
  } finally {
    // Cleanup
    await User.deleteMany({ email: { $regex: `s6b.*_${ts}@` } });
    await Event.deleteMany({ title: { $regex: `S6B Analytics Summit ${ts}` } });
    await EventPhoto.deleteMany({ caption: "Official opening session" });
    await MeetingMinute.deleteMany({ title: { $regex: `${ts}` } });

    await mongoose.connection.close();
    server.close();

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log("\n═══════════════════════════════════════════════════");
    console.log(`  Sprint 6B Results: ${passed} passed, ${failed} failed`);
    console.log("═══════════════════════════════════════════════════\n");
    if (failed > 0) process.exit(1);
  }
}

run();
