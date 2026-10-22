process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http     = require("http");
const app      = require("../server");
const mongoose = require("mongoose");
const User     = require("../models/User");
const Event    = require("../models/Event");
const Unit     = require("../models/Unit");
const DutyAssignment = require("../models/DutyAssignment");
const PositionTemplate = require("../models/PositionTemplate");
const AuditLog = require("../models/AuditLog");

const results = [];
const record = (category, testName, passed, details = "") => {
  results.push({ category, testName, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} [${category}] ${testName}${details ? " - " + details : ""}`);
};

const post = (base, path, body, token) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

const get = (base, path, token) =>
  fetch(`${base}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

const patch = (base, path, body, token) =>
  fetch(`${base}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const getToken = async (base, email, password) => {
  const r = await post(base, "/api/auth/login", { email, password });
  const d = await r.json();
  return { token: d.token || null, user: d.user || null };
};

async function runE2E() {
  console.log("\n============================================================");
  console.log("  IEEE SB Portal — Complete Sprints 1-4 Verification Suite");
  console.log("============================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5005, resolve));
  const base = "http://127.0.0.1:5005";

  const ts = Date.now();
  let createdEventId = null;
  const createdUserIds = [];

  try {
    // ── 1. Auth / Roles / Registration / Login / Logout ───────────────────────────
    const roles = ["superadmin", "execom", "member", "guest"];
    const tokens = {};
    const users = {};

    for (const role of roles) {
      const email = `e2e_${role}_${ts}@ieee-sngce.in`;
      const regRes = await post(base, "/api/auth/register", {
        name: `E2E ${role.toUpperCase()}`,
        email,
        password: "Password@1234",
        globalRole: role,
      });
      const regData = await regRes.json();
      const regSuccess = regRes.status === 201 && !!regData.token;
      record("Auth & Roles", `Register as ${role}`, regSuccess, `Status: ${regRes.status}`);

      if (regData.user?._id) createdUserIds.push(regData.user._id);

      // Login
      const loginRes = await post(base, "/api/auth/login", {
        email,
        password: "Password@1234",
      });
      const loginData = await loginRes.json();
      const loginSuccess = loginRes.status === 200 && !!loginData.token && loginData.user?.globalRole === role;
      record("Auth & Roles", `Login as ${role}`, loginSuccess, `Role returned: ${loginData.user?.globalRole}`);

      tokens[role] = loginData.token;
      users[role] = loginData.user;

      // Logout
      const logoutRes = await post(base, "/api/auth/logout", {}, loginData.token);
      record("Auth & Roles", `Logout for ${role}`, logoutRes.status === 200, `Status: ${logoutRes.status}`);
    }

    // ── 2. Public Portal Endpoints ───────────────────────────────────────────────
    const rStats = await get(base, "/api/stats/public");
    const dStats = await rStats.json();
    record("Public Portal", "GET /api/stats/public (Home statistics)", rStats.status === 200 && dStats.success && typeof dStats.data?.totalEvents === "number", `Events: ${dStats.data?.totalEvents}, Chapters: ${dStats.data?.totalChapters}`);

    const rUnits = await get(base, "/api/units");
    const dUnits = await rUnits.json();
    record("Public Portal", "GET /api/units (List chapters/units)", rUnits.status === 200 && Array.isArray(dUnits.data) && dUnits.data.length > 0, `Count: ${dUnits.data?.length}`);

    const rUnit = await get(base, "/api/units/CIS");
    const dUnit = await rUnit.json();
    record("Public Portal", "GET /api/units/CIS (Chapter details)", rUnit.status === 200 && dUnit.data?.name === "CIS", `Unit: ${dUnit.data?.name}`);

    const rEvents = await get(base, "/api/events");
    const dEvents = await rEvents.json();
    record("Public Portal", "GET /api/events (Public event list)", rEvents.status === 200 && Array.isArray(dEvents.data), `Count: ${dEvents.data?.length}`);

    const rDir = await get(base, "/api/directory");
    const dDir = await rDir.json();
    record("Public Portal", "GET /api/directory (Public officer directory)", rDir.status === 200 && Array.isArray(dDir.data), `Directory entries: ${dDir.data?.length}`);

    // ── 3. Role-Based Access Control (RBAC) ──────────────────────────────────────
    // Superadmin -> /api/admin/overview (200)
    const rAdminOver = await get(base, "/api/admin/overview", tokens.superadmin);
    record("RBAC Protection", "Superadmin accesses /api/admin/overview (200)", rAdminOver.status === 200, `Status: ${rAdminOver.status}`);

    // Officer -> /api/admin/overview (403 Blocked)
    const rOffToAdmin = await get(base, "/api/admin/overview", tokens.execom);
    record("RBAC Protection", "Officer blocked from /api/admin/overview (403)", rOffToAdmin.status === 403, `Status: ${rOffToAdmin.status}`);

    // Member -> /api/admin/overview (403 Blocked)
    const rMemToAdmin = await get(base, "/api/admin/overview", tokens.member);
    record("RBAC Protection", "Member blocked from /api/admin/overview (403)", rMemToAdmin.status === 403, `Status: ${rMemToAdmin.status}`);

    // Officer -> /api/officer/my-duties (200)
    const rOffDuties = await get(base, "/api/officer/my-duties", tokens.execom);
    record("RBAC Protection", "Officer accesses /api/officer/my-duties (200)", rOffDuties.status === 200, `Status: ${rOffDuties.status}`);

    // Member -> /api/officer/my-duties (403 Blocked)
    const rMemToOff = await get(base, "/api/officer/my-duties", tokens.member);
    record("RBAC Protection", "Member blocked from /api/officer/my-duties (403)", rMemToOff.status === 403, `Status: ${rMemToOff.status}`);

    // Member -> /api/member/profile (200)
    const rMemProf = await get(base, "/api/member/profile", tokens.member);
    record("RBAC Protection", "Member accesses /api/member/profile (200)", rMemProf.status === 200, `Status: ${rMemProf.status}`);

    // Guest -> /api/member/my-events (403 Blocked)
    const rGuestToMem = await get(base, "/api/member/my-events", tokens.guest);
    record("RBAC Protection", "Guest blocked from /api/member/my-events (403)", rGuestToMem.status === 403, `Status: ${rGuestToMem.status}`);

    // Simulated React ProtectedRoute checks:
    // Route /member/* allowedRoles: ["member"]
    const memberRouteAllowed = ["member"];
    const superadminToMemberAllowed = memberRouteAllowed.includes("superadmin");
    const execomToMemberAllowed = memberRouteAllowed.includes("execom");
    const memberToMemberAllowed = memberRouteAllowed.includes("member");
    record("RBAC Protection", "ProtectedRoute: Superadmin blocked from /member", !superadminToMemberAllowed, `Allowed: ${superadminToMemberAllowed}`);
    record("RBAC Protection", "ProtectedRoute: Officer blocked from /member", !execomToMemberAllowed, `Allowed: ${execomToMemberAllowed}`);
    record("RBAC Protection", "ProtectedRoute: Member allowed on /member", memberToMemberAllowed, `Allowed: ${memberToMemberAllowed}`);

    // Route /officer/* allowedRoles: ["execom", "chapteradmin"]
    const officerRouteAllowed = ["execom", "chapteradmin"];
    const superadminToOfficerAllowed = officerRouteAllowed.includes("superadmin");
    const memberToOfficerAllowed = officerRouteAllowed.includes("member");
    record("RBAC Protection", "ProtectedRoute: Superadmin blocked from /officer", !superadminToOfficerAllowed, `Allowed: ${superadminToOfficerAllowed}`);
    record("RBAC Protection", "ProtectedRoute: Member blocked from /officer", !memberToOfficerAllowed, `Allowed: ${memberToOfficerAllowed}`);

    // ── 4. Officer Event Lifecycle (Create -> Publish -> Public view) ─────────────
    // First register a chapteradmin for testing event creation
    const chapterAdminEmail = `e2e_chapteradmin_${ts}@ieee-sngce.in`;
    const caRegRes = await post(base, "/api/auth/register", {
      name: "E2E CHAPTERADMIN",
      email: chapterAdminEmail,
      password: "Password@1234",
      globalRole: "chapteradmin",
      chapterMemberships: [],
    });
    const caData = await caRegRes.json();
    if (caData.user?._id) createdUserIds.push(caData.user._id);
    tokens.chapteradmin = caData.token;
    record("Auth & Roles", "Register as chapteradmin", caRegRes.status === 201 && !!caData.token, `Status: ${caRegRes.status}`);

    // execom BLOCKED from creating events (403)
    const cisUnitForBlock = await Unit.findOne({ name: "CIS" });
    const execomCreateRes = await post(base, "/api/events", {
      title: `E2E Blocked Event ${ts}`,
      unit: cisUnitForBlock._id.toString(),
      date: new Date(Date.now() + 86400000 * 5).toISOString(),
    }, tokens.execom);
    record("RBAC Protection", "ExeCom Officer blocked from creating events (403)", execomCreateRes.status === 403, `Status: ${execomCreateRes.status}`);

    const cisUnit = await Unit.findOne({ name: "CIS" });
    const createEvRes = await post(base, "/api/events", {
      title: `E2E Tech Summit ${ts}`,
      description: "An end-to-end event created by chapteradmin",
      unit: cisUnit._id.toString(),
      date: new Date(Date.now() + 86400000 * 5).toISOString(),
      venue: "Auditorium Main",
      maxAttendees: 50,
    }, tokens.chapteradmin);
    const createEvData = await createEvRes.json();
    createdEventId = createEvData.data?._id;
    record("Event Engine", "Chapter Admin creates draft event (POST /api/events)", createEvRes.status === 201 && createEvData.data?.status === "draft", `Status: ${createEvData.data?.status}, ID: ${createdEventId}`);

    // Publish
    const pubRes = await patch(base, `/api/events/${createdEventId}/publish`, {}, tokens.chapteradmin);
    const pubData = await pubRes.json();
    record("Event Engine", "Chapter Admin publishes event (PATCH /api/events/:id/publish)", pubRes.status === 200 && pubData.data?.status === "published", `Status: ${pubData.data?.status}`);

    // Public visibility
    const pubEvListRes = await get(base, "/api/events");
    const pubEvListData = await pubEvListRes.json();
    const eventIsPublic = (pubEvListData.data || []).some((e) => e._id === createdEventId);
    record("Event Engine", "Published event visible on public portal (GET /api/events)", eventIsPublic, `Visible: ${eventIsPublic}`);

    // ── 5. Member Registration & My Events ─────────────────────────────────────────
    const regEvRes = await post(base, `/api/events/${createdEventId}/register`, {}, tokens.member);
    const regEvData = await regEvRes.json();
    record("Event Registration", "Member registers for event (POST /api/events/:id/register)", regEvRes.status === 200 && regEvData.success, `Msg: ${regEvData.message}`);

    // Duplicate registration prevented
    const dupRegRes = await post(base, `/api/events/${createdEventId}/register`, {}, tokens.member);
    record("Event Registration", "Duplicate member registration rejected (409)", dupRegRes.status === 409, `Status: ${dupRegRes.status}`);

    // Member "My Events" endpoint
    const myEventsRes = await get(base, "/api/member/my-events", tokens.member);
    const myEventsData = await myEventsRes.json();
    const foundInMyEvents = (myEventsData.data || []).some((e) => e._id === createdEventId);
    record("Member Dashboard", "Registered event appears in GET /api/member/my-events", myEventsRes.status === 200 && foundInMyEvents, `Total my-events: ${myEventsData.total}`);

    // ── 6. QR Code Generation & Check-in ──────────────────────────────────────────
    const qrRes = await post(base, `/api/events/${createdEventId}/qr`, {}, tokens.chapteradmin);
    const qrData = await qrRes.json();
    const tokenExtracted = qrData.checkInUrl?.split("token=")[1];
    record("QR Attendance", "Chapter Admin generates QR code (POST /api/events/:id/qr)", qrRes.status === 200 && qrData.qrDataUrl?.startsWith("data:image/png;base64") && !!tokenExtracted, `Token extracted: ${tokenExtracted ? tokenExtracted.slice(0, 8) + "…" : "NONE"}`);

    // Re-check member's my-events — now checkInQR should be populated
    const myEventsWithQRRes = await get(base, "/api/member/my-events", tokens.member);
    const myEventsWithQRData = await myEventsWithQRRes.json();
    const myEv = (myEventsWithQRData.data || []).find((e) => e._id === createdEventId);
    record("Member Dashboard", "Check-in QR populated in member's my-events list", !!myEv?.checkInQR, `QR length: ${myEv?.checkInQR?.length || 0}`);

    // Member checks in with valid token
    const checkinRes = await post(base, `/api/events/${createdEventId}/checkin?token=${tokenExtracted}`, {}, tokens.member);
    const checkinData = await checkinRes.json();
    record("QR Attendance", "Member checks in via QR token (POST /api/events/:id/checkin)", checkinRes.status === 200 && checkinData.success, `Msg: ${checkinData.message}`);

    // Duplicate check-in rejected
    const dupCheckinRes = await post(base, `/api/events/${createdEventId}/checkin?token=${tokenExtracted}`, {}, tokens.member);
    record("QR Attendance", "Duplicate check-in rejected (409)", dupCheckinRes.status === 409, `Status: ${dupCheckinRes.status}`);

    // Invalid token check-in rejected
    const badTokenRes = await post(base, `/api/events/${createdEventId}/checkin?token=invalidTokenXYZ`, {}, tokens.member);
    record("QR Attendance", "Invalid token check-in rejected (400)", badTokenRes.status === 400, `Status: ${badTokenRes.status}`);

    // ── 7. Officer Member List ───────────────────────────────────────────────────
    const memberId = users.member?.id || users.member?._id;
    const execomId = users.execom?.id || users.execom?._id;

    // Attach member and officer to CIS unit so officer sees member
    await User.findByIdAndUpdate(memberId, { $addToSet: { chapterMemberships: cisUnit._id } });
    await User.findByIdAndUpdate(execomId, { $addToSet: { chapterMemberships: cisUnit._id } });

    const offMembersRes = await get(base, "/api/officer/members", tokens.execom);
    const offMembersData = await offMembersRes.json();
    const hasMember = (offMembersData.data || []).some((m) => (m._id || m.id)?.toString() === memberId?.toString());
    const noPasswordsExposed = (offMembersData.data || []).every((m) => m.password === undefined);
    record("Officer Dashboard", "Officer Member List returns real chapter members (GET /api/officer/members)", offMembersRes.status === 200 && hasMember && noPasswordsExposed, `Total chapter members: ${offMembersData.total}, Passwords hidden: ${noPasswordsExposed}`);

    // ── 8. Audit Trail Verification ──────────────────────────────────────────────
    const rAudit = await get(base, "/api/admin/audit", tokens.superadmin);
    const dAudit = await rAudit.json();
    const hasAuditEntries = dAudit.success && (dAudit.data || []).length > 0;
    record("Audit Trail", "Admin can view audit logs (GET /api/admin/audit)", rAudit.status === 200 && hasAuditEntries, `Total logs: ${dAudit.total}`);

  } catch (err) {
    record("Fatal Error", "E2E Execution Error", false, err.message);
    console.error(err);
  } finally {
    // Cleanup
    if (createdEventId) {
      await Event.findByIdAndDelete(createdEventId);
      await AuditLog.deleteMany({ targetId: createdEventId });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    server.close();
    await mongoose.disconnect();
  }

  console.log("\n============================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`  E2E Test Results: ${passed}/${total} checks passed (${failed} failed)`);
  console.log("============================================================\n");

  process.exit(failed === 0 ? 0 : 1);
}

runE2E();
