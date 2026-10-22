const mongoose = require("mongoose");
const crypto = require("crypto");
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
  console.log("=== Testing Account & Access Improvements ===\n");
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
    // 1. Verify Super Admin Seed Account Name
    console.log("\n[Test 1] Verify Super Admin Account Name is 'Archana'");
    const superAdmin = await User.findOne({ globalRole: "superadmin" });
    assert(superAdmin !== null, "Found Super Admin user in DB");
    assert(superAdmin?.name === "Archana", `Super Admin name is "${superAdmin?.name}" (expected "Archana")`);

    // 2. Test Forgot Password & Reset Password Flow
    console.log("\n[Test 2] Forgot Password & Reset Password Flow");
    // Find or create a test user
    let testUser = await User.findOne({ email: "test_reset_user@ieee-sngce.in" });
    if (!testUser) {
      testUser = await User.create({
        name: "Test Reset User",
        email: "test_reset_user@ieee-sngce.in",
        password: "OldPassword123!",
        globalRole: "member",
      });
    } else {
      testUser.password = "OldPassword123!";
      await testUser.save();
    }

    // Call forgot-password
    const forgotRes = await postJson(`${BASE_URL}/auth/forgot-password`, {
      email: "test_reset_user@ieee-sngce.in",
    });
    assert(forgotRes.status === 200, "POST /api/auth/forgot-password returned 200");
    assert(forgotRes.data.success === true, "Response indicated success");

    // Fetch user from DB to get the hashed reset token
    const userWithToken = await User.findOne({ email: "test_reset_user@ieee-sngce.in" }).select("+passwordResetToken +passwordResetExpires");
    assert(!!userWithToken.passwordResetToken, "User document has passwordResetToken set");
    assert(userWithToken.passwordResetExpires > Date.now(), "passwordResetExpires is in the future");

    // Generate a known token to test reset-password
    const plainToken = "testtoken1234567890abcdef1234567890abcdef1234567890abcdef";
    const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
    userWithToken.passwordResetToken = hashedToken;
    userWithToken.passwordResetExpires = Date.now() + 3600000;
    await userWithToken.save();

    // Try resetting with wrong token
    const wrongReset = await postJson(`${BASE_URL}/auth/reset-password`, {
      token: "invalidtoken_xyz",
      password: "NewPassword123!",
    });
    assert(wrongReset.status === 400, "Reset with invalid token returned 400 Bad Request");

    // Reset with valid token
    const resetRes = await postJson(`${BASE_URL}/auth/reset-password`, {
      token: plainToken,
      password: "NewSecurePassword123!",
    });
    assert(resetRes.status === 200, "POST /api/auth/reset-password succeeded with 200");

    // Verify token is cleared in DB
    const refreshedUser = await User.findOne({ email: "test_reset_user@ieee-sngce.in" }).select("+passwordResetToken +passwordResetExpires");
    assert(!refreshedUser.passwordResetToken, "passwordResetToken was cleared after reset");
    assert(!refreshedUser.passwordResetExpires, "passwordResetExpires was cleared after reset");

    // Verify login with new password
    const loginRes = await postJson(`${BASE_URL}/auth/login`, {
      email: "test_reset_user@ieee-sngce.in",
      password: "NewSecurePassword123!",
    });
    assert(loginRes.status === 200 && !!loginRes.data.token, "Login with new password succeeded");
    const authToken = loginRes.data.token;

    // 3. Test Editable Profile (PATCH /api/user/profile)
    console.log("\n[Test 3] Editable Profile (PATCH /api/user/profile)");
    const patchRes = await patchJson(
      `${BASE_URL}/user/profile`,
      { name: "Updated Test Name", email: "test_reset_updated@ieee-sngce.in" },
      { Authorization: `Bearer ${authToken}` }
    );
    assert(patchRes.status === 200, "PATCH /api/user/profile returned 200");
    assert(patchRes.data.user.name === "Updated Test Name", "User name updated to 'Updated Test Name'");
    assert(patchRes.data.user.email === "test_reset_updated@ieee-sngce.in", "User email updated to 'test_reset_updated@ieee-sngce.in'");

    // Verify rejecting duplicate email
    const duplicateRes = await patchJson(
      `${BASE_URL}/user/profile`,
      { name: "Updated Test Name", email: "admin@ieee-sngce.in" }, // already used by superadmin
      { Authorization: `Bearer ${authToken}` }
    );
    assert(duplicateRes.status === 400, "Duplicate email returned 400 Bad Request");

    // Clean up test user
    await User.deleteOne({ _id: testUser._id });
    console.log("Cleaned up test user.");

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await mongoose.disconnect();
    console.log(`\n================================`);
    console.log(`Tests completed: ${passed}/${total} passed`);
    console.log(`================================`);
  }
}

runTests();
