/**
 * test-sprint5.js — Certificate Automation Tests
 *
 * Tests all Sprint 5 endpoints:
 *  1. GET  /api/certificates/eligible — chapteradmin can see eligible events
 *  2. GET  /api/certificates/eligible — execom gets 403
 *  3. POST /api/certificates/:eventId/generate — generates certs for attendees
 *  4. POST /api/certificates/:eventId/generate — idempotent re-run
 *  5. GET  /api/certificates/my — member sees their certificates
 *  6. GET  /api/certificates/:certId/download — returns PDF binary
 *  7. GET  /api/certificates/:certId/download — execom (officer) can also download
 */

// Must be FIRST — prevents server.js from auto-binding port
process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http     = require("http");
const app      = require("../server");
const mongoose = require("mongoose");
const User     = require("../models/User");
const Event    = require("../models/Event");
const Unit     = require("../models/Unit");
const Certificate = require("../models/Certificate");

const results = [];
const record = (item, passed, details = "") => {
  results.push({ item, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} ${item}${details ? " — " + details : ""}`);
};

const f = (base, path, opts = {}) =>
  fetch(`${base}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
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
  console.log("  Sprint 5 — Certificate Automation Tests");
  console.log("═══════════════════════════════════════════════════\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5006, resolve));
  const base = "http://127.0.0.1:5006";
  const ts   = Date.now();

  try {
    // ── Setup test data ───────────────────────────────────────────────────────
    const unit = await Unit.findOne({ name: "CIS" });
    const unitId = unit._id;

    // Create test users
    const chAdmin = await User.create({
      name: "S5 ChAdmin", email: `s5admin_${ts}@t.com`,
      password: "Test@1234", globalRole: "chapteradmin",
      chapterMemberships: [unitId],
    });
    const member = await User.create({
      name: "S5 Member", email: `s5mem_${ts}@t.com`,
      password: "Test@1234", globalRole: "member",
      chapterMemberships: [unitId],
    });
    const execom = await User.create({
      name: "S5 Execom", email: `s5exec_${ts}@t.com`,
      password: "Test@1234", globalRole: "execom",
      chapterMemberships: [unitId],
    });

    const chAdminToken = await getToken(base, `s5admin_${ts}@t.com`, "Test@1234");
    const memberToken  = await getToken(base, `s5mem_${ts}@t.com`,   "Test@1234");
    const execomToken  = await getToken(base, `s5exec_${ts}@t.com`,  "Test@1234");

    record("Auth — chapteradmin token", !!chAdminToken);
    record("Auth — member token",       !!memberToken);
    record("Auth — execom token",       !!execomToken);

    // Create a PAST event (date yesterday) with attendance
    const yesterday = new Date(Date.now() - 86400000);
    const ev = await Event.create({
      title:     `S5 Test Event ${ts}`,
      description: "Sprint 5 test",
      unit:      unitId,
      date:      yesterday,
      venue:     "Test Hall",
      status:    "published",
      createdBy: chAdmin._id,
      attendance: [
        { user: member._id, name: member.name, email: member.email },
        { user: null, name: "Guest Attendee", email: `s5guest_${ts}@ext.com` },
      ],
    });

    // ── Test 1: GET eligible (chapteradmin) ───────────────────────────────────
    console.log("\n── Test 1: GET /api/certificates/eligible ────────────");
    const r1 = await f(base, "/api/certificates/eligible", { token: chAdminToken });
    const d1 = await r1.json();
    record("1a. status 200",        r1.status === 200, `got ${r1.status}`);
    record("1b. returns array",     Array.isArray(d1.data), JSON.stringify(d1).slice(0,80));
    const found = d1.data?.find((e) => e._id === ev._id.toString());
    record("1c. test event in list", !!found, `events returned: ${d1.data?.length}`);
    if (found) {
      record("1d. attendanceCount=2", found.attendanceCount === 2, `got ${found.attendanceCount}`);
      record("1e. certCount=0 initially", found.certCount === 0, `got ${found.certCount}`);
    }

    // ── Test 2: execom 403 ────────────────────────────────────────────────────
    console.log("\n── Test 2: execom blocked from /eligible ─────────────");
    const r2 = await f(base, "/api/certificates/eligible", { token: execomToken });
    record("2. execom gets 403", r2.status === 403, `got ${r2.status}`);

    // ── Test 3: Generate certs ────────────────────────────────────────────────
    console.log("\n── Test 3: POST /:eventId/generate ───────────────────");
    const r3 = await f(base, `/api/certificates/${ev._id}/generate`, {
      method: "POST", token: chAdminToken,
    });
    const d3 = await r3.json();
    record("3a. status 200",          r3.status === 200, `got ${r3.status}`);
    record("3b. generated=2",         d3.generated === 2, `got ${d3.generated}`);
    record("3c. skipped=0",           d3.skipped === 0,   `got ${d3.skipped}`);
    record("3d. failed=0",            d3.failed === 0,    `got ${d3.failed}`);
    record("3e. has message string",  typeof d3.message === "string");
    console.log(`     ↳ ${d3.message}`);

    // Verify certs in DB
    const certCount = await Certificate.countDocuments({ event: ev._id });
    record("3f. 2 certs in DB", certCount === 2, `found ${certCount}`);

    // ── Test 4: Idempotent re-run & POST /api/events/:id/generate-certificates ───
    console.log("\n── Test 4: Idempotent re-generation via /api/events/:id/generate-certificates ──");
    const r4 = await f(base, `/api/events/${ev._id}/generate-certificates`, {
      method: "POST", token: chAdminToken,
    });
    const d4 = await r4.json();
    record("4a. status 200 on re-run", r4.status === 200, `got ${r4.status}`);
    record("4b. generated=0 on re-run", d4.generated === 0, `got ${d4.generated}`);
    record("4c. skipped=2 on re-run",   d4.skipped === 2,   `got ${d4.skipped}`);

    // ── Test 5: Member "My Certificates" ─────────────────────────────────────
    console.log("\n── Test 5: GET /api/certificates/my ──────────────────");
    const r5 = await f(base, "/api/certificates/my", { token: memberToken });
    const d5 = await r5.json();
    record("5a. status 200",    r5.status === 200, `got ${r5.status}`);
    record("5b. returns array", Array.isArray(d5.data));
    record("5c. 1 cert for member", d5.data?.length === 1, `got ${d5.data?.length}`);
    if (d5.data?.length > 0) {
      const c = d5.data[0];
      record("5d. eventTitle set",      !!c.eventTitle);
      record("5e. eventDate set",       !!c.eventDate);
      record("5f. chapterName set",     !!c.chapterName);
      record("5g. pdfData NOT in list", c.pdfData === undefined, "pdfData should be excluded from list");
    }

    // ── Test 6: Download PDF ──────────────────────────────────────────────────
    console.log("\n── Test 6: Download certificate PDF ──────────────────");
    const myCert = d5.data?.[0];
    if (myCert) {
      const r6 = await fetch(`${base}/api/certificates/${myCert._id}/download`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      record("6a. status 200",           r6.status === 200, `got ${r6.status}`);
      record("6b. content-type PDF",     r6.headers.get("content-type")?.includes("application/pdf"),
        `got ${r6.headers.get("content-type")}`);
      record("6c. content-disposition",  r6.headers.get("content-disposition")?.includes("attachment"),
        `got ${r6.headers.get("content-disposition")}`);
      const buf = await r6.arrayBuffer();
      record("6d. PDF starts with %PDF", Buffer.from(buf).slice(0,4).toString() === "%PDF",
        `first 4 bytes: ${Buffer.from(buf).slice(0,4).toString()}`);
    } else {
      record("6. download (no cert to test)", false, "myCert was undefined");
    }

    // ── Test 7: Officer can also download ─────────────────────────────────────
    console.log("\n── Test 7: Officer (execom) can download any cert ────");
    if (myCert) {
      const r7 = await fetch(`${base}/api/certificates/${myCert._id}/download`, {
        headers: { Authorization: `Bearer ${execomToken}` },
      });
      record("7. execom can download member cert", r7.status === 200, `got ${r7.status}`);
    } else {
      record("7. (skip — no cert)", true);
    }

    // ── Test 8: Unauthenticated download blocked ───────────────────────────────
    console.log("\n── Test 8: Unauthenticated download blocked ──────────");
    if (myCert) {
      const r8 = await fetch(`${base}/api/certificates/${myCert._id}/download`);
      record("8. 401 without token", r8.status === 401, `got ${r8.status}`);
    } else {
      record("8. (skip — no cert)", true);
    }

  } catch (err) {
    console.error("\nTest suite error:", err.message);
    record("Suite — no crash", false, err.message);
  } finally {
    // ── Cleanup ───────────────────────────────────────────────────────────────
    const ts2 = ts;
    await User.deleteMany({ email: { $regex: `s5.*_${ts2}@` } });
    await Event.deleteMany({ title: { $regex: `S5 Test Event ${ts2}` } });
    await Certificate.deleteMany({ recipientEmail: { $regex: `s5.*_${ts2}@` } });

    await mongoose.connection.close();
    server.close();

    // ── Summary ───────────────────────────────────────────────────────────────
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log("\n═══════════════════════════════════════════════════");
    console.log(`  Sprint 5 Results: ${passed} passed, ${failed} failed`);
    console.log("═══════════════════════════════════════════════════\n");
    if (failed > 0) process.exit(1);
  }
}

run();
