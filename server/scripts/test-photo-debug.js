/**
 * test-photo-debug.js — End-to-end verification of profile photo URL construction and static serving
 */

process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http     = require("http");
const app      = require("../server");
const mongoose = require("mongoose");
const fs       = require("fs");
const path     = require("path");

const User             = require("../models/User");
const Unit             = require("../models/Unit");
const DutyAssignment   = require("../models/DutyAssignment");
const PositionTemplate = require("../models/PositionTemplate");

async function run() {
  console.log("\n========================================================");
  console.log("  Profile Photo End-to-End Debug & Verification");
  console.log("========================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5015, resolve));
  const base = "http://localhost:5015";

  try {
    const cisUnit = await Unit.findOne({ name: "CIS" });

    // 1. Create test user
    const email = `photo_test_${Date.now()}@ieee.org`;
    const user = await User.create({
      name: "Photo Test User",
      email,
      password: "password123",
      globalRole: "execom",
      chapterMemberships: [cisUnit._id],
    });

    const pTemplate = await PositionTemplate.create({
      unit: cisUnit._id,
      positionName: "Vice Chair",
      dutyType: "general",
      academicYear: "2026-2027",
      createdBy: user._id,
    });

    await DutyAssignment.create({
      user: user._id,
      positionTemplate: pTemplate._id,
      assignedBy: user._id,
      status: "active",
    });

    // 2. Login to get token
    const rLogin = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" }),
    });
    const dLogin = await rLogin.json();
    const token = dLogin.token;

    console.log("[1] Logged in successfully. Token acquired.");

    // 3. Upload a sample photo
    const dummyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const formData = new FormData();
    formData.append("photo", new Blob([dummyPng], { type: "image/png" }), "my_avatar.png");

    const rUpload = await fetch(`${base}/api/user/profile-photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const dUpload = await rUpload.json();

    console.log("[2] Upload result status:", rUpload.status);
    console.log("[2] Saved profilePhoto path:", dUpload.profilePhoto);

    if (rUpload.status !== 200 || !dUpload.profilePhoto) {
      throw new Error("Upload failed!");
    }

    const photoPath = dUpload.profilePhoto; // e.g. /uploads/profiles/profile-...

    // 4. Test accessing image directly via /uploads/...
    const rStaticDirect = await fetch(`${base}${photoPath}`);
    console.log("[3] Direct static access (/uploads/...):", rStaticDirect.status, rStaticDirect.headers.get("content-type"));

    // 5. Test accessing image via /api/uploads/...
    const rStaticApi = await fetch(`${base}/api${photoPath}`);
    console.log("[4] Prefix static access (/api/uploads/...):", rStaticApi.status, rStaticApi.headers.get("content-type"));

    // 6. Test GET /api/user/profile
    const rProfile = await fetch(`${base}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dProfile = await rProfile.json();
    console.log("[5] GET /api/user/profile returns photo:", dProfile.data?.profilePhoto === photoPath);

    // 7. Test GET /api/units/:id/officers
    const rOfficers = await fetch(`${base}/api/units/${cisUnit._id}/officers`);
    const dOfficers = await rOfficers.json();
    const officerDoc = dOfficers.data?.find((o) => o.name === "Photo Test User");
    console.log("[6] Chapter officer card has profilePhoto:", officerDoc?.profilePhoto === photoPath);

    // 8. Test GET /api/directory
    const rDir = await fetch(`${base}/api/directory?search=Photo Test User`);
    const dDir = await rDir.json();
    const dirDoc = dDir.data?.find((u) => u.name === "Photo Test User");
    console.log("[7] Directory has profilePhoto:", dirDoc?.profilePhoto === photoPath);

    // 9. Test GET /api/officer/members
    const rMembers = await fetch(`${base}/api/officer/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dMembers = await rMembers.json();
    const memberDoc = dMembers.data?.find((m) => m.name === "Photo Test User");
    console.log("[8] Officer Member List has profilePhoto:", memberDoc?.profilePhoto === photoPath);

    const allPassed =
      rStaticDirect.status === 200 &&
      rStaticApi.status === 200 &&
      dProfile.data?.profilePhoto === photoPath &&
      officerDoc?.profilePhoto === photoPath &&
      dirDoc?.profilePhoto === photoPath &&
      memberDoc?.profilePhoto === photoPath;

    console.log("\n========================================================");
    console.log(`  ALL 8 TESTS PASSED: ${allPassed}`);
    console.log("========================================================\n");

    if (!allPassed) process.exitCode = 1;
  } catch (err) {
    console.error("Test failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

run();
