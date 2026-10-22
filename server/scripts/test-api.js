// Must be set BEFORE requiring server.js so the listen guard fires
process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const http = require("http");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");

const results = [];

function record(item, passed, details = "") {
  results.push({ item, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} ${item} ${details ? "- " + details : ""}`);
}

async function runApiTests() {
  console.log("\n==========================================");
  console.log("  IEEE SB Portal - HTTP API Endpoint Tests");
  console.log("==========================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5001, resolve));
  const baseUrl = "http://127.0.0.1:5001";

  let token = null;
  const testUserEmail = `api_test_${Date.now()}@ieee.org`;
  const testPassword = "Password123!";

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    record(
      "1. GET /api/health",
      healthRes.status === 200 && healthData.success === true,
      `Status: ${healthRes.status}, message: ${healthData.message}`
    );

    // 2. Register user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "API Tester",
        email: testUserEmail,
        password: testPassword,
        globalRole: "member",
      }),
    });
    const regData = await regRes.json();
    record(
      "2. POST /api/auth/register",
      regRes.status === 201 && regData.success === true && !!regData.token,
      `Status: ${regRes.status}, token issued, role: ${regData.user?.globalRole}`
    );

    // 3. Login with credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUserEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    record(
      "3. POST /api/auth/login (valid credentials)",
      loginRes.status === 200 && loginData.success === true && !!token,
      `Status: ${loginRes.status}, received JWT`
    );

    // 4. Login with invalid password
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUserEmail,
        password: "WrongPassword!",
      }),
    });
    record(
      "4. POST /api/auth/login (invalid credentials rejected)",
      badLoginRes.status === 401,
      `Status: ${badLoginRes.status} (Unauthorized)`
    );

    // 5. GET /api/auth/me with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    record(
      "5. GET /api/auth/me (authenticated)",
      meRes.status === 200 && meData.user?.email === testUserEmail,
      `Status: ${meRes.status}, retrieved user: ${meData.user?.name}`
    );

    // 6. GET /api/auth/me without token (401 expected)
    const noTokenRes = await fetch(`${baseUrl}/api/auth/me`);
    record(
      "6. GET /api/auth/me without token (unauthorized)",
      noTokenRes.status === 401,
      `Status: ${noTokenRes.status} (Unauthorized)`
    );

    // 7. GET /api/auth/me with invalid token (401 expected)
    const badTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    record(
      "7. GET /api/auth/me with invalid token (unauthorized)",
      badTokenRes.status === 401,
      `Status: ${badTokenRes.status} (Unauthorized)`
    );

    // 8. POST /api/auth/logout with token
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const logoutData = await logoutRes.json();
    record(
      "8. POST /api/auth/logout (authenticated)",
      logoutRes.status === 200 && logoutData.success === true,
      `Status: ${logoutRes.status}, message: ${logoutData.message}`
    );

    // 9. 404 Route handling
    const notFoundRes = await fetch(`${baseUrl}/api/nonexistent-route`);
    record(
      "9. 404 Route Handling",
      notFoundRes.status === 404,
      `Status: ${notFoundRes.status}`
    );

    // Cleanup test user
    await User.findOneAndDelete({ email: testUserEmail });
    console.log("\n  Cleaned up test user.");

  } catch (err) {
    record("API Test Error", false, err.message);
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  // Summary
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log("\n------------------------------------------");
  console.log(`  Summary: ${passed}/${total} API tests passed`);
  console.log("------------------------------------------\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runApiTests();
