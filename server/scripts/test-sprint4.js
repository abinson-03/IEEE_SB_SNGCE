process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http     = require("http");
const app      = require("../server");
const mongoose = require("mongoose");
const User     = require("../models/User");
const Event    = require("../models/Event");
const AuditLog = require("../models/AuditLog");
const Unit     = require("../models/Unit");

const results = [];
const record = (item, passed, details = "") => {
  results.push({ item, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} ${item}${details ? " - " + details : ""}`);
};

const post = (base, path, body, token) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

const patch = (base, path, token) =>
  fetch(`${base}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

const put = (base, path, body, token) =>
  fetch(`${base}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

const getToken = async (base, email, password) => {
  const r = await post(base, "/api/auth/login", { email, password });
  const d = await r.json();
  return d.token || null;
};

async function run() {
  console.log("\n==========================================");
  console.log("  IEEE SB Portal - Sprint 4 Event Engine Tests");
  console.log("==========================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5004, resolve));
  const base = "http://127.0.0.1:5004";

  const ts = Date.now();
  let officerToken, memberToken, otherOfficerToken;
  let unitId, eventId, qrToken;

  try {
    // Setup: get a unit
    const unit = await Unit.findOne({ name: "CIS" });
    unitId = unit._id.toString();

    // Create test users — officer = chapteradmin (can create events), member = member
    const officer      = await User.create({ name: "T4 Officer",       email: `t4off_${ts}@t.com`,     password: "Test@1234", globalRole: "chapteradmin" });
    const otherOfficer = await User.create({ name: "T4 Other Officer", email: `t4off2_${ts}@t.com`,    password: "Test@1234", globalRole: "chapteradmin" });
    const member       = await User.create({ name: "T4 Member",        email: `t4mem_${ts}@t.com`,     password: "Test@1234", globalRole: "member" });

    officerToken      = await getToken(base, `t4off_${ts}@t.com`,  "Test@1234");
    otherOfficerToken = await getToken(base, `t4off2_${ts}@t.com`, "Test@1234");
    memberToken       = await getToken(base, `t4mem_${ts}@t.com`,  "Test@1234");

    // ── 1. Create event as chapteradmin → 201 ────────────────────────────────────
    const r1 = await post(base, "/api/events", {
      title: `T4 Test Event ${ts}`, description: "Sprint 4 test", unit: unitId,
      date: new Date(Date.now() + 86400000 * 7).toISOString(), venue: "Hall A",
    }, officerToken);
    const d1 = await r1.json();
    eventId = d1.data?._id;
    record("1. POST /api/events (chapteradmin → 201)", r1.status === 201 && !!eventId, `Status: ${r1.status}, id: ${eventId}`);

    // ── 2. Create event as member → 403 ─────────────────────────────────────
    const r2 = await post(base, "/api/events", {
      title: "Should fail", unit: unitId, date: new Date().toISOString(),
    }, memberToken);
    record("2. POST /api/events (member → 403)", r2.status === 403, `Status: ${r2.status}`);

    // ── 3. Edit event as creator → 200 ──────────────────────────────────────
    const r3 = await put(base, `/api/events/${eventId}`, { venue: "Hall B" }, officerToken);
    const d3 = await r3.json();
    record("3. PUT /api/events/:id (creator → 200)", r3.status === 200 && d3.data?.venue === "Hall B", `Status: ${r3.status}, venue: ${d3.data?.venue}`);

    // ── 4. Edit event as different officer → 403 ────────────────────────────
    const r4 = await put(base, `/api/events/${eventId}`, { venue: "Hack" }, otherOfficerToken);
    record("4. PUT /api/events/:id (other officer → 403)", r4.status === 403, `Status: ${r4.status}`);

    // ── 5. Publish event → status: published ────────────────────────────────
    const r5 = await patch(base, `/api/events/${eventId}/publish`, officerToken);
    const d5 = await r5.json();
    record("5. PATCH .../publish → status: published", r5.status === 200 && d5.data?.status === "published", `Status: ${r5.status}, event status: ${d5.data?.status}`);

    // ── 6. Publish again → 400 (already published) ──────────────────────────
    const r6 = await patch(base, `/api/events/${eventId}/publish`, officerToken);
    record("6. PATCH .../publish again → 400", r6.status === 400, `Status: ${r6.status}`);

    // ── 7. Published event visible on GET /api/events ───────────────────────
    const r7 = await fetch(`${base}/api/events`);
    const d7 = await r7.json();
    const found7 = (d7.data || []).some((e) => e._id === eventId);
    record("7. GET /api/events lists published event", r7.status === 200 && found7, `Status: ${r7.status}, found: ${found7}`);

    // ── 8. Register logged-in member → 200 ──────────────────────────────────
    const r8 = await post(base, `/api/events/${eventId}/register`, {}, memberToken);
    const d8 = await r8.json();
    record("8. POST .../register (member → 200)", r8.status === 200 && d8.success, `Status: ${r8.status}, count: ${d8.registrationCount}`);

    // ── 9. Register duplicate → 409 ─────────────────────────────────────────
    const r9 = await post(base, `/api/events/${eventId}/register`, {}, memberToken);
    record("9. POST .../register (duplicate → 409)", r9.status === 409, `Status: ${r9.status}`);

    // ── 10. Register as guest (name+email) → 200 ────────────────────────────
    const r10 = await post(base, `/api/events/${eventId}/register`, { name: "Guest User", email: `guest_${ts}@t.com` });
    const d10 = await r10.json();
    record("10. POST .../register (guest → 200)", r10.status === 200 && d10.success, `Status: ${r10.status}, count: ${d10.registrationCount}`);

    // ── 11. Generate QR → returns base64 PNG + checkInUrl ───────────────────
    const r11 = await post(base, `/api/events/${eventId}/qr`, {}, officerToken);
    const d11 = await r11.json();
    qrToken = d11.checkInUrl?.split("token=")[1];
    record("11. POST .../qr → 200, has dataUrl and checkInUrl",
      r11.status === 200 && d11.qrDataUrl?.startsWith("data:image/png;base64") && !!d11.checkInUrl,
      `Status: ${r11.status}, qrToken: ${qrToken ? qrToken.slice(0,8) + "…" : "MISSING"}`);

    // ── 12. Check-in with valid token (logged-in member) → 200 ──────────────
    const r12 = await post(base, `/api/events/${eventId}/checkin?token=${qrToken}`, {}, memberToken);
    const d12 = await r12.json();
    record("12. POST .../checkin (valid token, member → 200)", r12.status === 200 && d12.success, `Status: ${r12.status}, msg: ${d12.message?.slice(0,30)}`);

    // ── 13. Duplicate check-in → 409 ────────────────────────────────────────
    const r13 = await post(base, `/api/events/${eventId}/checkin?token=${qrToken}`, {}, memberToken);
    record("13. POST .../checkin (duplicate → 409)", r13.status === 409, `Status: ${r13.status}`);

    // ── 14. Check-in with bad token → 400 ───────────────────────────────────
    const r14 = await post(base, `/api/events/${eventId}/checkin?token=badtoken123`, {}, memberToken);
    record("14. POST .../checkin (bad token → 400)", r14.status === 400, `Status: ${r14.status}`);

    // ── 15. Archive event → status: archived ────────────────────────────────
    const r15 = await patch(base, `/api/events/${eventId}/archive`, officerToken);
    const d15 = await r15.json();
    record("15. PATCH .../archive → status: archived", r15.status === 200 && d15.data?.status === "archived", `Status: ${r15.status}, status: ${d15.data?.status}`);

    // ── 16. AuditLog has entries for this event ──────────────────────────────
    const logs = await AuditLog.find({ targetId: eventId });
    const actions = logs.map((l) => l.action);
    const hasCreate  = actions.includes("EVENT_CREATED");
    const hasPublish = actions.includes("EVENT_PUBLISHED");
    const hasArchive = actions.includes("EVENT_ARCHIVED");
    const hasQR      = actions.includes("QR_GENERATED");
    const hasCheckin = actions.includes("CHECKIN_MARKED");
    record("16. AuditLog has all expected event action entries",
      hasCreate && hasPublish && hasArchive && hasQR && hasCheckin,
      `create:${hasCreate} publish:${hasPublish} archive:${hasArchive} qr:${hasQR} checkin:${hasCheckin} (${logs.length} total)`);

  } catch (err) {
    record("Sprint 4 Test Error", false, err.message);
    console.error(err);
  } finally {
    // Cleanup
    if (eventId) { await Event.findByIdAndDelete(eventId); await AuditLog.deleteMany({ targetId: eventId }); }
    await User.deleteMany({ email: { $regex: `t4.*_${ts}@t\\.com` } });
    server.close();
    await mongoose.disconnect();
  }

  const total  = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log("\n------------------------------------------");
  console.log(`  Summary: ${passed}/${total} Sprint 4 tests passed`);
  console.log("------------------------------------------\n");
  process.exit(passed === total ? 0 : 1);
}

run();
