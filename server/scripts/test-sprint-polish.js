/**
 * test-sprint-polish.js — Sprint Polish: Profile Photo, Officer Tasks, Join Requests, Notices, Certificate Verification
 */

process.env.NODE_ENV = "test";
process.env.PORT = "5010";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http     = require("http");
const app      = require("../server");
const mongoose = require("mongoose");
const fs       = require("fs");
const path     = require("path");

const User               = require("../models/User");
const Unit               = require("../models/Unit");
const Event              = require("../models/Event");
const Certificate        = require("../models/Certificate");
const OfficerTask        = require("../models/OfficerTask");
const ChapterJoinRequest = require("../models/ChapterJoinRequest");
const Notice             = require("../models/Notice");
const PositionTemplate   = require("../models/PositionTemplate");
const DutyAssignment     = require("../models/DutyAssignment");

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
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("  IEEE SB Portal — Polish Sprint Verification");
  console.log("════════════════════════════════════════════════════════════════\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5010, resolve));
  const base = "http://localhost:5010";

  try {
    // ── Setup Users & Units ──────────────────────────────────────────────────
    const superEmail  = "polish_super@ieee.org";
    const officerEmail = "polish_officer@ieee.org";
    const memberEmail  = "polish_member@ieee.org";
    const generalEmail = "polish_general@ieee.org";

    await User.deleteMany({ email: { $in: [superEmail, officerEmail, memberEmail, generalEmail] } });
    await OfficerTask.deleteMany({});
    await ChapterJoinRequest.deleteMany({});
    await Notice.deleteMany({});

    // Find Units
    const cisUnit = await Unit.findOne({ name: "CIS" });
    const csUnit  = await Unit.findOne({ name: "CS" });
    const sbUnit  = await Unit.findOne({ name: "SB" }) || cisUnit;

    // Create users
    const superUser = await User.create({
      name: "Super Counselor",
      email: superEmail,
      password: "password123",
      globalRole: "superadmin",
      chapterMemberships: [cisUnit._id, csUnit._id],
    });

    const officerUser = await User.create({
      name: "CIS Chair",
      email: officerEmail,
      password: "password123",
      globalRole: "execom",
      chapterMemberships: [cisUnit._id],
    });

    const generalOfficer = await User.create({
      name: "General Officer",
      email: generalEmail,
      password: "password123",
      globalRole: "execom",
      chapterMemberships: [cisUnit._id],
    });

    const memberUser = await User.create({
      name: "Regular Member",
      email: memberEmail,
      password: "password123",
      globalRole: "member",
      chapterMemberships: [sbUnit._id], // NOT in CS or CIS yet
    });

    // Clean up test PositionTemplates and DutyAssignments
    const existingTemplates = await PositionTemplate.find({
      unit: cisUnit._id,
      positionName: { $in: ["Chapter Chair", "Student Representative"] },
    }).select("_id");
    await DutyAssignment.deleteMany({ positionTemplate: { $in: existingTemplates.map((t) => t._id) } });
    await PositionTemplate.deleteMany({
      unit: cisUnit._id,
      positionName: { $in: ["Chapter Chair", "Student Representative"] },
    });

    // Create PositionTemplates and DutyAssignments
    const chairTemplate = await PositionTemplate.create({
      unit: cisUnit._id,
      positionName: "Chapter Chair",
      dutyType: "oversight",
      academicYear: "2026-2027",
      createdBy: superUser._id,
    });

    const generalTemplate = await PositionTemplate.create({
      unit: cisUnit._id,
      positionName: "Student Representative",
      dutyType: "general",
      academicYear: "2026-2027",
      createdBy: superUser._id,
    });

    await DutyAssignment.create({
      user: officerUser._id,
      positionTemplate: chairTemplate._id,
      assignedBy: superUser._id,
      status: "active",
    });

    await DutyAssignment.create({
      user: generalOfficer._id,
      positionTemplate: generalTemplate._id,
      assignedBy: superUser._id,
      status: "active",
    });

    // Get Auth Tokens
    const superToken   = await getToken(base, superEmail, "password123");
    const officerToken = await getToken(base, officerEmail, "password123");
    const memberToken  = await getToken(base, memberEmail, "password123");
    const generalToken = await getToken(base, generalEmail, "password123");

    record("Auth Tokens Acquired for Test Roles", !!(superToken && officerToken && memberToken && generalToken));

    // ──────────────────────────────────────────────────────────────────────────
    // 1. PROFILE PICTURE UPLOAD
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n── 1. Profile Picture Upload ──");

    // 1.1 Reject without file
    const rNoFile = await fetch(`${base}/api/user/profile-photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    record("1.1 POST /api/user/profile-photo rejects request without file", rNoFile.status === 400);

    // 1.2 Upload valid image using multipart FormData
    const dummyImg = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const form = new FormData();
    form.append("photo", new Blob([dummyImg], { type: "image/png" }), "avatar.png");

    const rUpload = await fetch(`${base}/api/user/profile-photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
      body: form,
    });
    const dUpload = await rUpload.json();

    const uploadOk = rUpload.status === 200 && dUpload.success && dUpload.profilePhoto.startsWith("/uploads/profiles/");
    record("1.2 POST /api/user/profile-photo saves image to disk and returns path", uploadOk, dUpload.profilePhoto);

    // 1.3 Check DB document contains file path only (NEVER image binary/base64)
    const dbMember = await User.findById(memberUser._id);
    const pathOnly = dbMember.profilePhoto && dbMember.profilePhoto.startsWith("/uploads/profiles/") && !dbMember.profilePhoto.includes("base64");
    record("1.3 User model stores file path only (not base64/binary)", !!pathOnly, dbMember.profilePhoto);

    // 1.4 Check physical file exists on disk
    const diskPath = path.join(__dirname, "..", dbMember.profilePhoto);
    const fileExistsOnDisk = fs.existsSync(diskPath);
    record("1.4 Profile photo file actually exists in server/uploads/profiles/", fileExistsOnDisk);

    // 1.5 GET /api/user/profile returns the profilePhoto
    const rProfile = await f(base, "/api/user/profile", { token: memberToken });
    const dProfile = await rProfile.json();
    record("1.5 GET /api/user/profile returns profilePhoto", dProfile.data?.profilePhoto === dbMember.profilePhoto);

    // 1.6 Upload for officer and check /api/units/:id/officers returns profilePhoto
    const officerForm = new FormData();
    officerForm.append("photo", new Blob([dummyImg], { type: "image/png" }), "chair.png");
    await fetch(`${base}/api/user/profile-photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${officerToken}` },
      body: officerForm,
    });

    const rOfficers = await f(base, `/api/units/${cisUnit._id}/officers`);
    const dOfficers = await rOfficers.json();
    const chairInApi = dOfficers.data?.find((o) => o.name === "CIS Chair");
    record("1.6 Chapter officer cards (/api/units/:id/officers) return profilePhoto", !!chairInApi?.profilePhoto);

    // 1.7 Check /api/directory returns profilePhoto
    const rDir = await f(base, "/api/directory?search=" + encodeURIComponent("CIS Chair"));
    const dDir = await rDir.json();
    const foundInDir = dDir.data?.find((u) => u.id === officerUser._id.toString() || u.name === "CIS Chair");
    record("1.7 Member directory (/api/directory) returns profilePhoto", !!foundInDir?.profilePhoto, foundInDir?.profilePhoto);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. OFFICER TASK LIST (/officer/tasks)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n── 2. Officer Task List ──");

    // 2.1 General officer (no oversight) cannot assign tasks -> 403
    const rGenTask = await f(base, "/api/officer/tasks", {
      method: "POST",
      token: generalToken,
      body: {
        unit: cisUnit._id,
        title: "Unauthorized task attempt",
        assignedTo: memberUser._id,
      },
    });
    record("2.1 General officer cannot create/assign tasks (403)", rGenTask.status === 403);

    // 2.2 Oversight officer (Chair) creates a task -> 201
    const rCreateTask = await f(base, "/api/officer/tasks", {
      method: "POST",
      token: officerToken,
      body: {
        unit: cisUnit._id,
        title: "Prepare CIS Workshop Presentation",
        description: "Draft slides for the intro to AI talk next Tuesday",
        assignedTo: generalOfficer._id,
        dueDate: new Date(Date.now() + 86400000 * 3),
        priority: "high",
      },
    });
    const dCreateTask = await rCreateTask.json();
    const taskOk = rCreateTask.status === 201 && dCreateTask.success && dCreateTask.data?.status === "pending";
    record("2.2 Oversight officer assigns task successfully (201)", taskOk, dCreateTask.data?.title);

    const taskId = dCreateTask.data?._id;

    // 2.3 Superadmin can also create a task
    const rSuperTask = await f(base, "/api/officer/tasks", {
      method: "POST",
      token: superToken,
      body: {
        unit: csUnit._id,
        title: "Annual Branch Audit Preparation",
        assignedTo: officerUser._id,
        priority: "medium",
      },
    });
    record("2.3 Super Admin creates task across chapters (201)", rSuperTask.status === 201);

    // 2.4 Assigned officer views own tasks (GET /api/officer/tasks)
    const rMyTasks = await f(base, "/api/officer/tasks", { token: generalToken });
    const dMyTasks = await rMyTasks.json();
    const hasAssignedTask = dMyTasks.data?.some((t) => t._id === taskId && t.priority === "high");
    record("2.4 Officer views own pending tasks (GET /api/officer/tasks)", hasAssignedTask, `Found ${dMyTasks.count} tasks`);

    // 2.5 Officer marks task as done (PATCH /api/officer/tasks/:id/status)
    const rPatchTask = await f(base, `/api/officer/tasks/${taskId}/status`, {
      method: "PATCH",
      token: generalToken,
      body: { status: "done" },
    });
    const dPatchTask = await rPatchTask.json();
    record("2.5 Officer marks task as Done (PATCH status: done)", rPatchTask.status === 200 && dPatchTask.data?.status === "done");

    // 2.6 Unauthorized user cannot patch task status -> 403
    const rUnauthTask = await f(base, `/api/officer/tasks/${taskId}/status`, {
      method: "PATCH",
      token: memberToken,
      body: { status: "pending" },
    });
    record("2.6 Unrelated member cannot patch task status (403)", rUnauthTask.status === 403);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CHAPTER JOIN REQUEST FLOW
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n── 3. Chapter Join Request Flow ──");

    // 3.1 Member submits join request for CIS Chapter
    const rJoinReq = await f(base, `/api/chapters/${cisUnit.name}/join-request`, {
      method: "POST",
      token: memberToken,
    });
    const dJoinReq = await rJoinReq.json();
    record("3.1 POST /api/chapters/:id/join-request creates pending request (201)", rJoinReq.status === 201 && dJoinReq.data?.status === "pending");

    const joinReqId = dJoinReq.data?._id;

    // 3.2 Duplicate request rejected -> 400
    const rDupReq = await f(base, `/api/chapters/${cisUnit.name}/join-request`, {
      method: "POST",
      token: memberToken,
    });
    record("3.2 Duplicate pending join request rejected (400)", rDupReq.status === 400);

    // 3.3 Officer sees pending requests (GET /api/officer/join-requests)
    const rOfficerReqs = await f(base, "/api/officer/join-requests", { token: officerToken });
    const dOfficerReqs = await rOfficerReqs.json();
    const foundReq = dOfficerReqs.data?.find((r) => r._id === joinReqId);
    record("3.3 Chapter officer views pending join requests", !!foundReq, `Count: ${dOfficerReqs.count}`);

    // 3.4 Officer approves request -> adds unit to user.chapterMemberships
    const rApprove = await f(base, `/api/officer/join-requests/${joinReqId}`, {
      method: "PATCH",
      token: officerToken,
      body: { status: "approved" },
    });
    const dApprove = await rApprove.json();
    record("3.4 Officer approves join request (PATCH status: approved)", rApprove.status === 200 && dApprove.data?.status === "approved");

    // Verify user is now a member of CIS
    const updatedUser = await User.findById(memberUser._id);
    const nowMember = updatedUser.chapterMemberships.some((ch) => ch.toString() === cisUnit._id.toString());
    record("3.5 Approved unit added to user.chapterMemberships", nowMember);

    // 3.6 Member trying to request join again gets 400 (already member)
    const rAlreadyMember = await f(base, `/api/chapters/${cisUnit.name}/join-request`, {
      method: "POST",
      token: memberToken,
    });
    record("3.6 Existing chapter member cannot re-request join (400)", rAlreadyMember.status === 400);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. PUBLIC NOTICE BOARD
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n── 4. Public Notice Board ──");

    // 4.1 Regular member cannot post notices -> 403
    const rMemNotice = await f(base, "/api/admin/notices", {
      method: "POST",
      token: memberToken,
      body: { title: "Spam notice", body: "Hello" },
    });
    record("4.1 Member cannot post notice (403)", rMemNotice.status === 403);

    // 4.2 Super Admin posts pinned notice -> 201
    const rPost1 = await f(base, "/api/admin/notices", {
      method: "POST",
      token: superToken,
      body: {
        title: "Call for IEEE ExeCom Nominations 2026",
        body: "Nominations are now open for student branch officer positions.",
        pinned: true,
      },
    });
    record("4.2 Super Admin posts pinned notice (201)", rPost1.status === 201);

    // 4.3 Execom officer posts normal notice -> 201
    const rPost2 = await f(base, "/api/admin/notices", {
      method: "POST",
      token: officerToken,
      body: {
        title: "CIS Technical Seminar Rescheduled",
        body: "The upcoming Neural Networks seminar is moved to Friday 3 PM.",
        pinned: false,
      },
    });
    record("4.3 Officer posts normal notice (201)", rPost2.status === 201);

    // 4.4 Public user (unauthenticated) views notices (GET /api/notices/public)
    const rPublicNotices = await f(base, "/api/notices/public");
    const dPublicNotices = await rPublicNotices.json();
    const noticesOk = rPublicNotices.status === 200 && dPublicNotices.data?.length >= 2;
    // Pinned notice must be first
    const firstIsPinned = dPublicNotices.data?.[0]?.pinned === true;
    record("4.4 Public user views notices (pinned first, unauthenticated)", noticesOk && firstIsPinned, `Count: ${dPublicNotices.count}`);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. PUBLIC CERTIFICATE VERIFICATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n── 5. Public Certificate Verification ──");

    // 5.1 Create completed event with attendee and generate cert with unique ID
    const completedEvent = await Event.create({
      title: "Polish Sprint AI Hands-on Workshop",
      description: "Hands-on machine learning session",
      date: new Date(Date.now() - 86400000 * 2),
      venue: "Computer Lab 3",
      unit: cisUnit._id,
      createdBy: superUser._id,
      status: "published",
      attendance: [
        {
          name: memberUser.name,
          email: memberUser.email,
          user: memberUser._id,
          checkedInAt: new Date(),
        },
      ],
    });

    // Generate certificates via officer API
    const rGenCert = await f(base, `/api/certificates/${completedEvent._id}/generate`, {
      method: "POST",
      token: superToken,
    });
    const dGenCert = await rGenCert.json();
    record("5.1 Officer generates certificate for completed event", dGenCert.generated >= 1);

    // Retrieve generated cert from DB
    const issuedCert = await Certificate.findOne({ event: completedEvent._id });
    const hasCertId = issuedCert && issuedCert.certificateId && issuedCert.certificateId.startsWith("IEEE-CIS-");
    record("5.2 Certificate has unique certificateId (e.g. IEEE-CIS-2026-XXXXX)", !!hasCertId, issuedCert?.certificateId);

    // 5.3 Public verification with valid ID (no auth header)
    const rVerifyValid = await f(base, `/api/certificates/verify/${issuedCert.certificateId}`);
    const dVerifyValid = await rVerifyValid.json();
    const verifyValidOk =
      rVerifyValid.status === 200 &&
      dVerifyValid.valid === true &&
      dVerifyValid.data?.recipientName === memberUser.name &&
      dVerifyValid.data?.eventTitle === completedEvent.title;
    record("5.3 GET /api/certificates/verify/:certId returns valid: true and metadata (public)", verifyValidOk, dVerifyValid.data?.recipientName);

    // 5.4 Verification by MongoDB _id also works (backwards compatibility)
    const rVerifyMongoId = await f(base, `/api/certificates/verify/${issuedCert._id}`);
    const dVerifyMongoId = await rVerifyMongoId.json();
    record("5.4 Verification by MongoDB ObjectId works for legacy certs", dVerifyMongoId.valid === true);

    // 5.5 Verification with non-existent ID returns 404 and valid: false
    const rVerifyInvalid = await f(base, "/api/certificates/verify/IEEE-FAKE-9999-XXXXX");
    const dVerifyInvalid = await rVerifyInvalid.json();
    record("5.5 GET /api/certificates/verify/:certId returns 404 for invalid ID", rVerifyInvalid.status === 404 && dVerifyInvalid.valid === false);

    // ──────────────────────────────────────────────────────────────────────────
    // 6. ZERO REGRESSION ON EXISTING ENDPOINTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n── 6. Zero Regression Check ──");

    // 6.1 Stats
    const rStats = await f(base, "/api/stats/public");
    record("6.1 GET /api/stats/public intact", rStats.status === 200);

    // 6.2 Units
    const rUnits = await f(base, "/api/units");
    record("6.2 GET /api/units intact", rUnits.status === 200);

    // 6.3 Events
    const rEvents = await f(base, "/api/events");
    record("6.3 GET /api/events intact", rEvents.status === 200);

    // 6.4 Member my-certificates
    const rMyCerts = await f(base, "/api/certificates/my", { token: memberToken });
    record("6.4 GET /api/certificates/my intact", rMyCerts.status === 200);

    // 6.5 Officer duties
    const rDuties = await f(base, "/api/officer/my-duties", { token: officerToken });
    record("6.5 GET /api/officer/my-duties intact", rDuties.status === 200);

    // Summary
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log(`  Summary: ${passed}/${total} passed (${failed} failed)`);
    console.log("════════════════════════════════════════════════════════════════\n");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

run();
