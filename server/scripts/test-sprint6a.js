/**
 * test-sprint6a.js — Sprint 6A: Position Template Manager & Duty Workflows
 *
 * Tests:
 *  1. Admin Position Template CRUD (create, read, edit, archive)
 *  2. Duty Assignment (assign member to position, vacate)
 *  3. Officer Budget Proposal Submission & List
 *  4. Admin Budget Proposal Review (approve / reject with note)
 *  5. Officer Chapter Oversight overview
 *  6. Admin User status toggle (activate / deactivate)
 *  7. Admin Audit Log querying with filter
 */

process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http     = require("http");
const app      = require("../server");
const mongoose = require("mongoose");
const User     = require("../models/User");
const Unit     = require("../models/Unit");
const Event    = require("../models/Event");
const PositionTemplate = require("../models/PositionTemplate");
const DutyAssignment   = require("../models/DutyAssignment");
const BudgetProposal   = require("../models/BudgetProposal");
const AuditLog         = require("../models/AuditLog");

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
  console.log("  Sprint 6A — Position Manager & Duty Workflows Tests");
  console.log("═══════════════════════════════════════════════════\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5007, resolve));
  const base = "http://127.0.0.1:5007";
  const ts   = Date.now();

  try {
    const unit = await Unit.findOne({ name: "CIS" });
    const unitId = unit._id;

    // Create test accounts
    const admin = await User.create({
      name: "S6 Admin", email: `s6admin_${ts}@t.com`,
      password: "Test@1234", globalRole: "superadmin",
    });
    const treasurer = await User.create({
      name: "S6 Treasurer", email: `s6treasurer_${ts}@t.com`,
      password: "Test@1234", globalRole: "execom",
      chapterMemberships: [unitId],
    });
    const chair = await User.create({
      name: "S6 Chair", email: `s6chair_${ts}@t.com`,
      password: "Test@1234", globalRole: "chapteradmin",
      chapterMemberships: [unitId],
    });
    const testMember = await User.create({
      name: "S6 Member", email: `s6mem_${ts}@t.com`,
      password: "Test@1234", globalRole: "member",
    });

    const adminToken     = await getToken(base, `s6admin_${ts}@t.com`,     "Test@1234");
    const treasurerToken = await getToken(base, `s6treasurer_${ts}@t.com`, "Test@1234");
    const chairToken     = await getToken(base, `s6chair_${ts}@t.com`,     "Test@1234");

    record("Auth — superadmin login", !!adminToken);
    record("Auth — treasurer login",  !!treasurerToken);
    record("Auth — chair login",      !!chairToken);

    // ── 1. Position Template CRUD ─────────────────────────────────────────────
    console.log("\n── 1. Position Template CRUD ─────────────────────────");
    const r1 = await f(base, "/api/admin/position-templates", {
      method: "POST",
      token: adminToken,
      body: {
        unit: unitId,
        positionName: `Finance Officer ${ts}`,
        dutyType: "budget",
        academicYear: "2025-2026",
      },
    });
    const d1 = await r1.json();
    record("1a. POST /position-templates (201)", r1.status === 201, `status=${r1.status}`);
    record("1b. dutyType is budget", d1.data?.dutyType === "budget", `dutyType=${d1.data?.dutyType}`);
    const templateId = d1.data?._id;

    // Read list
    const r1b = await f(base, `/api/admin/position-templates?academicYear=2025-2026&unit=${unitId}`, { token: adminToken });
    const d1b = await r1b.json();
    record("1c. GET /position-templates (200)", r1b.status === 200);
    record("1d. template in list", d1b.data?.some((t) => t._id === templateId));

    // Edit
    const r1c = await f(base, `/api/admin/position-templates/${templateId}`, {
      method: "PUT",
      token: adminToken,
      body: { positionName: `Lead Treasurer ${ts}`, dutyType: "budget" },
    });
    const d1c = await r1c.json();
    record("1e. PUT /position-templates/:id (200)", r1c.status === 200);
    record("1f. name updated", d1c.data?.positionName === `Lead Treasurer ${ts}`);

    // Non-admin blocked
    const r1d = await f(base, "/api/admin/position-templates", {
      method: "POST",
      token: treasurerToken,
      body: { unit: unitId, positionName: "Hacker", academicYear: "2025-2026" },
    });
    record("1g. non-superadmin gets 403", r1d.status === 403);

    // ── 2. Duty Assignment ────────────────────────────────────────────────────
    console.log("\n── 2. Duty Assignment ────────────────────────────────");
    const r2 = await f(base, "/api/admin/duty-assignments", {
      method: "POST",
      token: adminToken,
      body: {
        positionTemplateId: templateId,
        userId: treasurer._id,
      },
    });
    const d2 = await r2.json();
    record("2a. POST /duty-assignments (200)", r2.status === 200, `status=${r2.status}`);
    record("2b. assignment status active", d2.data?.status === "active");
    record("2c. assigned user matches", d2.data?.user?._id === treasurer._id.toString());
    const assignmentId = d2.data?._id;

    // Check officer's /my-duties returns the position with dutyType="budget"
    const r2b = await f(base, "/api/officer/my-duties", { token: treasurerToken });
    const d2b = await r2b.json();
    const myDuty = d2b.data?.find((d) => d.assignmentId === assignmentId);
    record("2d. GET /officer/my-duties includes assignment", !!myDuty);
    record("2e. officer dutyType is budget", myDuty?.dutyType === "budget", `dutyType=${myDuty?.dutyType}`);

    // Vacate duty
    const r2c = await f(base, `/api/admin/duty-assignments/${assignmentId}`, {
      method: "PATCH",
      token: adminToken,
      body: { action: "vacate" },
    });
    const d2c = await r2c.json();
    record("2f. PATCH /duty-assignments/:id vacate (200)", r2c.status === 200);
    record("2g. assignment status vacant", d2c.data?.status === "vacant");

    // Reassign
    await f(base, `/api/admin/duty-assignments/${assignmentId}`, {
      method: "PATCH",
      token: adminToken,
      body: { userId: treasurer._id },
    });

    // ── 3. Officer Budget Proposals (Treasurer Workflow) ──────────────────────
    console.log("\n── 3. Budget Proposals (Officer Workflow) ────────────");
    const r3 = await f(base, "/api/officer/budget-proposals", {
      method: "POST",
      token: treasurerToken,
      body: {
        unit: unitId,
        title: `Hackathon Refreshments ${ts}`,
        amount: 3500,
        description: "Snacks and coffee for 50 participants",
      },
    });
    const d3 = await r3.json();
    record("3a. POST /officer/budget-proposals (201)", r3.status === 201, `status=${r3.status}`);
    record("3b. status is pending", d3.data?.status === "pending");
    record("3c. amount matches", d3.data?.amount === 3500);
    const proposalId = d3.data?._id;

    // Officer views their proposals
    const r3b = await f(base, "/api/officer/budget-proposals", { token: treasurerToken });
    const d3b = await r3b.json();
    record("3d. GET /officer/budget-proposals (200)", r3b.status === 200);
    record("3e. proposal in list", d3b.data?.some((p) => p._id === proposalId));

    // ── 4. Admin Budget Review ────────────────────────────────────────────────
    console.log("\n── 4. Admin Budget Review ────────────────────────────");
    const r4 = await f(base, `/api/admin/budget-proposals?status=pending`, { token: adminToken });
    const d4 = await r4.json();
    record("4a. GET /admin/budget-proposals (200)", r4.status === 200);
    record("4b. proposal in pending list", d4.data?.some((p) => p._id === proposalId));

    // Admin approves proposal
    const r4b = await f(base, `/api/admin/budget-proposals/${proposalId}`, {
      method: "PATCH",
      token: adminToken,
      body: { status: "approved", reviewComment: "Approved within college budget cap." },
    });
    const d4b = await r4b.json();
    record("4c. PATCH /admin/budget-proposals/:id approve (200)", r4b.status === 200);
    record("4d. proposal status approved", d4b.data?.status === "approved");
    record("4e. reviewer note saved", d4b.data?.reviewComment === "Approved within college budget cap.");

    // ── 5. Chapter Oversight Workflow ─────────────────────────────────────────
    console.log("\n── 5. Chapter Oversight Workflow ─────────────────────");
    const r5 = await f(base, `/api/officer/chapter-overview?unitId=${unitId}`, { token: chairToken });
    const d5 = await r5.json();
    record("5a. GET /officer/chapter-overview (200)", r5.status === 200);
    record("5b. returns events array", Array.isArray(d5.data?.events));
    record("5c. returns dutyAssignments array", Array.isArray(d5.data?.dutyAssignments));
    record("5d. returns budgetProposals array", Array.isArray(d5.data?.budgetProposals));

    // ── 6. Admin User Management & Status Toggle ──────────────────────────────
    console.log("\n── 6. Admin User Management & Status Toggle ──────────");
    const r6 = await f(base, `/api/admin/users?search=S6`, { token: adminToken });
    const d6 = await r6.json();
    record("6a. GET /admin/users (200)", r6.status === 200);
    record("6b. returns users array", Array.isArray(d6.data));

    // Deactivate testMember
    const r6b = await f(base, `/api/admin/users/${testMember._id}/status`, {
      method: "PATCH",
      token: adminToken,
      body: { status: "inactive" },
    });
    record("6c. PATCH /admin/users/:id/status to inactive (200)", r6b.status === 200);

    // Deactivated user cannot log in
    const loginR = await f(base, "/api/auth/login", {
      method: "POST",
      body: { email: `s6mem_${ts}@t.com`, password: "Test@1234" },
    });
    record("6d. deactivated user login blocked (403)", loginR.status === 403);

    // Reactivate
    const r6c = await f(base, `/api/admin/users/${testMember._id}/status`, {
      method: "PATCH",
      token: adminToken,
      body: { status: "active" },
    });
    record("6e. reactivate user (200)", r6c.status === 200);

    // ── 7. Soft Delete (Archive) Position Template ────────────────────────────
    console.log("\n── 7. Archive Position Template ──────────────────────");
    const r7 = await f(base, `/api/admin/position-templates/${templateId}`, {
      method: "DELETE",
      token: adminToken,
    });
    const d7 = await r7.json();
    record("7a. DELETE /position-templates/:id archives (200)", r7.status === 200);
    record("7b. isArchived flag true", d7.data?.isArchived === true);

    // Active query excludes archived template
    const r7b = await f(base, `/api/admin/position-templates?academicYear=2025-2026&unit=${unitId}`, { token: adminToken });
    const d7b = await r7b.json();
    record("7c. archived template excluded from active list", !d7b.data?.some((t) => t._id === templateId));

    // ── 8. Admin Audit Log ────────────────────────────────────────────────────
    console.log("\n── 8. Admin Audit Trail ──────────────────────────────");
    const r8 = await f(base, "/api/admin/audit?limit=10", { token: adminToken });
    const d8 = await r8.json();
    record("8a. GET /admin/audit (200)", r8.status === 200);
    record("8b. audit log has entries", (d8.data?.length || 0) > 0);

  } catch (err) {
    console.error("\nTest suite error:", err.message);
    record("Suite — no crash", false, err.message);
  } finally {
    // Cleanup
    await User.deleteMany({ email: { $regex: `s6.*_${ts}@` } });
    await PositionTemplate.deleteMany({ academicYear: `2025-2026_${ts}` });
    await DutyAssignment.deleteMany({ "positionTemplate.academicYear": `2025-2026_${ts}` });
    await BudgetProposal.deleteMany({ title: { $regex: `${ts}` } });

    await mongoose.connection.close();
    server.close();

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log("\n═══════════════════════════════════════════════════");
    console.log(`  Sprint 6A Results: ${passed} passed, ${failed} failed`);
    console.log("═══════════════════════════════════════════════════\n");
    if (failed > 0) process.exit(1);
  }
}

run();
