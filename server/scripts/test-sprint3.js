// Must be set BEFORE requiring server.js
process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http = require("http");
const app  = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");

const results = [];

function record(item, passed, details = "") {
  results.push({ item, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} ${item} ${details ? "- " + details : ""}`);
}

// Helper: login and return a JWT token
async function getToken(base, email, password) {
  const res  = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.token || null;
}

async function runSprint3Tests() {
  console.log("\n==========================================");
  console.log("  IEEE SB Portal - Sprint 3 RBAC & Notification Tests");
  console.log("==========================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5003, resolve));
  const base = "http://127.0.0.1:5003";

  // ── Create temporary test users for this test run ──────────────────────────
  const timestamp = Date.now();
  const testAdmin   = { name: "Test Admin",   email: `t3admin_${timestamp}@test.com`,   password: "Admin@1234",   globalRole: "superadmin" };
  const testOfficer = { name: "Test Officer", email: `t3officer_${timestamp}@test.com`, password: "Officer@1234", globalRole: "execom" };
  const testMember  = { name: "Test Member",  email: `t3member_${timestamp}@test.com`,  password: "Member@1234",  globalRole: "member" };

  let adminToken, officerToken, memberToken, adminId, notifId;

  try {
    // Register test users directly in DB (bypass register route to set roles)
    const admin   = await User.create(testAdmin);
    const officer = await User.create(testOfficer);
    const member  = await User.create(testMember);
    adminId = admin._id;

    // Seed one notification for admin
    const notif = await Notification.create({
      recipient: adminId,
      title: "Test notification",
      message: "This is a test.",
      type: "general",
    });
    notifId = notif._id;

    // Get tokens via login API
    adminToken   = await getToken(base, testAdmin.email,   testAdmin.password);
    officerToken = await getToken(base, testOfficer.email, testOfficer.password);
    memberToken  = await getToken(base, testMember.email,  testMember.password);

    // ── 1. Admin overview — no token → 401 ─────────────────────────────────
    const res1 = await fetch(`${base}/api/admin/overview`);
    record("1. GET /api/admin/overview (no token → 401)", res1.status === 401, `Status: ${res1.status}`);

    // ── 2. Admin overview — member token → 403 ─────────────────────────────
    const res2 = await fetch(`${base}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    record("2. GET /api/admin/overview (member token → 403)", res2.status === 403, `Status: ${res2.status}`);

    // ── 3. Admin overview — admin token → 200 ──────────────────────────────
    const res3 = await fetch(`${base}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data3 = await res3.json();
    record(
      "3. GET /api/admin/overview (superadmin → 200)",
      res3.status === 200 && typeof data3.data.totalUsers === "number",
      `Status: ${res3.status}, users: ${data3.data?.totalUsers}`
    );

    // ── 4. Admin users list — admin → 200 ──────────────────────────────────
    const res4 = await fetch(`${base}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data4 = await res4.json();
    record("4. GET /api/admin/users (superadmin → 200)", res4.status === 200 && Array.isArray(data4.data), `Status: ${res4.status}, total: ${data4.total}`);

    // ── 5. Officer my-duties — member token → 403 ──────────────────────────
    const res5 = await fetch(`${base}/api/officer/my-duties`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    record("5. GET /api/officer/my-duties (member → 403)", res5.status === 403, `Status: ${res5.status}`);

    // ── 6. Officer my-duties — officer token → 200 ─────────────────────────
    const res6 = await fetch(`${base}/api/officer/my-duties`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const data6 = await res6.json();
    record("6. GET /api/officer/my-duties (execom → 200)", res6.status === 200 && Array.isArray(data6.data), `Status: ${res6.status}`);

    // ── 7. Member profile — no token → 401 ────────────────────────────────
    const res7 = await fetch(`${base}/api/member/profile`);
    record("7. GET /api/member/profile (no token → 401)", res7.status === 401, `Status: ${res7.status}`);

    // ── 8. Member profile — member token → 200 ────────────────────────────
    const res8 = await fetch(`${base}/api/member/profile`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const data8 = await res8.json();
    record("8. GET /api/member/profile (member → 200)", res8.status === 200 && data8.data?.name === testMember.name, `Status: ${res8.status}, name: ${data8.data?.name}`);

    // ── 9. Notifications — no token → 401 ────────────────────────────────
    const res9 = await fetch(`${base}/api/notifications`);
    record("9. GET /api/notifications (no token → 401)", res9.status === 401, `Status: ${res9.status}`);

    // ── 10. Notifications — admin token → 200, includes seeded notif ──────
    const res10 = await fetch(`${base}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data10 = await res10.json();
    record(
      "10. GET /api/notifications (admin token → 200, sees own notifs)",
      res10.status === 200 && data10.unreadCount >= 1,
      `Status: ${res10.status}, unread: ${data10.unreadCount}`
    );

    // ── 11. Mark notification read ────────────────────────────────────────
    const res11 = await fetch(`${base}/api/notifications/${notifId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data11 = await res11.json();
    record(
      "11. PATCH /api/notifications/:id/read",
      res11.status === 200 && data11.data?.read === true,
      `Status: ${res11.status}, read: ${data11.data?.read}`
    );

    // ── 12. Mark-all-read ─────────────────────────────────────────────────
    const res12 = await fetch(`${base}/api/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record("12. PATCH /api/notifications/read-all", res12.status === 200, `Status: ${res12.status}`);

    // ── 13. Cross-user notification access blocked ────────────────────────
    const res13 = await fetch(`${base}/api/notifications/${notifId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    record(
      "13. PATCH notification owned by admin — with member token → 404",
      res13.status === 404,
      `Status: ${res13.status} (cross-user access correctly blocked)`
    );

  } catch (err) {
    record("Sprint 3 Test Error", false, err.message);
  } finally {
    // Cleanup
    if (adminId) await Notification.deleteMany({ recipient: adminId });
    await User.deleteMany({ email: { $in: [testAdmin.email, testOfficer.email, testMember.email] } });
    server.close();
    await mongoose.disconnect();
  }

  const total  = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log("\n------------------------------------------");
  console.log(`  Summary: ${passed}/${total} Sprint 3 tests passed`);
  console.log("------------------------------------------\n");

  process.exit(passed === total ? 0 : 1);
}

runSprint3Tests();
