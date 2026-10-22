const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const BASE_URL = "http://localhost:5000/api";

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function patchJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log("=== Testing Profile Email Change & Change Password (End-to-End) ===\n");
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

  const initialEmail = "e2e_profile_user@ieee-sngce.in";
  const updatedEmail = "e2e_profile_updated@ieee-sngce.in";
  const initialPassword = "InitialPassword123!";
  const newPassword = "BrandNewSecurePassword456!";

  try {
    // Clean up any leftovers from previous test runs
    await User.deleteMany({ email: { $in: [initialEmail, updatedEmail] } });

    // Create a real test user
    const testUser = await User.create({
      name: "E2E Profile Tester",
      email: initialEmail,
      password: initialPassword,
      globalRole: "member",
    });
    assert(!!testUser, `Created real test user: ${initialEmail}`);

    // Initial login
    const login1 = await postJson(`${BASE_URL}/auth/login`, {
      email: initialEmail,
      password: initialPassword,
    });
    assert(login1.status === 200 && !!login1.data.token, "Initial login with original credentials succeeded");
    const token = login1.data.token;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: VERIFY EMAIL CHANGE WORKS CORRECTLY END-TO-END
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Test 1] Email Change via PATCH /api/user/profile");

    // Call update profile
    const updateRes = await patchJson(
      `${BASE_URL}/user/profile`,
      { name: "E2E Profile Tester Renamed", email: updatedEmail },
      { Authorization: `Bearer ${token}` }
    );
    assert(updateRes.status === 200, "PATCH /api/user/profile returned 200");
    assert(updateRes.data.user?.email === updatedEmail, `Response returns updated email: ${updatedEmail}`);

    // Verify in MongoDB: User document's email is overwritten
    const dbUserNew = await User.findOne({ email: updatedEmail });
    assert(dbUserNew !== null, "User found in MongoDB by new email");
    assert(dbUserNew?._id.toString() === testUser._id.toString(), "MongoDB user ID is preserved (no duplication)");

    // Verify in MongoDB: Old email record NO LONGER exists
    const dbUserOld = await User.findOne({ email: initialEmail });
    assert(dbUserOld === null, "Old email query returns null (overwritten, no duplicate records)");

    // Login with OLD email now FAILS
    const loginOld = await postJson(`${BASE_URL}/auth/login`, {
      email: initialEmail,
      password: initialPassword,
    });
    assert(loginOld.status === 401, `Login with old email correctly rejected (HTTP 401: "${loginOld.data.message}")`);

    // Login with NEW email + existing password SUCCEEDS
    const loginNew = await postJson(`${BASE_URL}/auth/login`, {
      email: updatedEmail,
      password: initialPassword,
    });
    assert(loginNew.status === 200 && !!loginNew.data.token, "Login with new email + existing password succeeded immediately");
    const activeToken = loginNew.data.token;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: CHANGE PASSWORD ON PROFILE (POST /api/user/change-password)
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Test 2] Change Password (POST /api/user/change-password)");

    // Test rejection with wrong current password
    const wrongCurrent = await postJson(
      `${BASE_URL}/user/change-password`,
      { currentPassword: "WrongCurrentPassword123!", newPassword: newPassword },
      { Authorization: `Bearer ${activeToken}` }
    );
    assert(wrongCurrent.status === 400, "Rejects incorrect current password with HTTP 400");
    assert(wrongCurrent.data.message?.includes("Current password is incorrect"), `Error message: "${wrongCurrent.data.message}"`);

    // Test rejection with too short new password (< 8 chars)
    const shortNew = await postJson(
      `${BASE_URL}/user/change-password`,
      { currentPassword: initialPassword, newPassword: "short" },
      { Authorization: `Bearer ${activeToken}` }
    );
    assert(shortNew.status === 400, "Rejects new password < 8 characters with HTTP 400");
    assert(shortNew.data.message?.includes("at least 8 characters"), `Error message: "${shortNew.data.message}"`);

    // Successfully change password with valid current + new password
    const changeSuccess = await postJson(
      `${BASE_URL}/user/change-password`,
      { currentPassword: initialPassword, newPassword: newPassword },
      { Authorization: `Bearer ${activeToken}` }
    );
    assert(changeSuccess.status === 200, "POST /api/user/change-password returned 200");
    assert(changeSuccess.data.success === true, "Password change response indicates success: true");

    // Attempt login with OLD password -> MUST FAIL (401)
    const loginOldPass = await postJson(`${BASE_URL}/auth/login`, {
      email: updatedEmail,
      password: initialPassword,
    });
    assert(loginOldPass.status === 401, `Login with old password correctly rejected (HTTP 401: "${loginOldPass.data.message}")`);

    // Attempt login with NEW password -> MUST SUCCEED (200)
    const loginNewPass = await postJson(`${BASE_URL}/auth/login`, {
      email: updatedEmail,
      password: newPassword,
    });
    assert(loginNewPass.status === 200 && !!loginNewPass.data.token, "Login with new password succeeded with fresh JWT");
    assert(loginNewPass.data.user?.email === updatedEmail, `Logged in user email matches: ${updatedEmail}`);

    // Clean up test user
    await User.deleteOne({ _id: testUser._id });
    console.log("\nCleaned up test user record from MongoDB.");

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
