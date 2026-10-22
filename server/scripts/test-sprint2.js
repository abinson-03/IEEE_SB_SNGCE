// Must be set BEFORE requiring server.js
process.env.NODE_ENV = "test";
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http = require("http");
const app  = require("../server");
const mongoose = require("mongoose");

const results = [];

function record(item, passed, details = "") {
  results.push({ item, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} ${item} ${details ? "- " + details : ""}`);
}

async function runSprint2Tests() {
  console.log("\n==========================================");
  console.log("  IEEE SB Portal - Sprint 2 API Tests");
  console.log("==========================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5002, resolve));
  const base = "http://127.0.0.1:5002";

  try {
    // 1. GET /api/stats/public
    const statsRes  = await fetch(`${base}/api/stats/public`);
    const statsData = await statsRes.json();
    record(
      "1. GET /api/stats/public",
      statsRes.status === 200 && statsData.success && typeof statsData.data.totalChapters === "number",
      `Status: ${statsRes.status}, chapters: ${statsData.data?.totalChapters}, events: ${statsData.data?.totalEvents}`
    );

    // 2. GET /api/units (all)
    const unitsRes  = await fetch(`${base}/api/units`);
    const unitsData = await unitsRes.json();
    record(
      "2. GET /api/units",
      unitsRes.status === 200 && unitsData.data.length >= 5,
      `Status: ${unitsRes.status}, returned ${unitsData.data?.length} units`
    );

    // 3. GET /api/units/:id by name (CIS)
    const cisRes  = await fetch(`${base}/api/units/CIS`);
    const cisData = await cisRes.json();
    record(
      "3. GET /api/units/CIS (by name lookup)",
      cisRes.status === 200 && cisData.data?.name === "CIS",
      `Status: ${cisRes.status}, name: ${cisData.data?.name}, type: ${cisData.data?.type}`
    );

    // 4. GET /api/units/:id/officers — empty graceful response
    const cisId = cisData.data?._id;
    const officersRes  = await fetch(`${base}/api/units/${cisId}/officers`);
    const officersData = await officersRes.json();
    record(
      "4. GET /api/units/:id/officers (empty state — no crash)",
      officersRes.status === 200 && Array.isArray(officersData.data),
      `Status: ${officersRes.status}, officers: ${officersData.data?.length} (empty is OK)`
    );

    // 5. GET /api/units/NONEXISTENT — 404
    const badUnitRes = await fetch(`${base}/api/units/NONEXISTENT`);
    record(
      "5. GET /api/units/NONEXISTENT (404 expected)",
      badUnitRes.status === 404,
      `Status: ${badUnitRes.status}`
    );

    // 6. GET /api/events (default published)
    const evRes  = await fetch(`${base}/api/events`);
    const evData = await evRes.json();
    record(
      "6. GET /api/events",
      evRes.status === 200 && Array.isArray(evData.data),
      `Status: ${evRes.status}, events: ${evData.data?.length}`
    );

    // 7. GET /api/events?unit=CIS (chapter filter)
    const evCisRes  = await fetch(`${base}/api/events?unit=CIS`);
    const evCisData = await evCisRes.json();
    record(
      "7. GET /api/events?unit=CIS (chapter filter)",
      evCisRes.status === 200 && Array.isArray(evCisData.data),
      `Status: ${evCisRes.status}, CIS events: ${evCisData.data?.length}`
    );

    // 8. GET /api/directory (public, no email returned)
    const dirRes  = await fetch(`${base}/api/directory`);
    const dirData = await dirRes.json();
    const hasNoEmail = dirData.data?.every((m) => !m.email && !m.password);
    record(
      "8. GET /api/directory (email/password never returned)",
      dirRes.status === 200 && Array.isArray(dirData.data) && hasNoEmail,
      `Status: ${dirRes.status}, members: ${dirData.data?.length}, email field: ${hasNoEmail ? "ABSENT ✓" : "PRESENT ✗"}`
    );

    // 9. GET /api/directory?unit=CIS (filter)
    const dirCisRes  = await fetch(`${base}/api/directory?unit=CIS`);
    const dirCisData = await dirCisRes.json();
    record(
      "9. GET /api/directory?unit=CIS (chapter filter)",
      dirCisRes.status === 200 && Array.isArray(dirCisData.data),
      `Status: ${dirCisRes.status}, CIS members: ${dirCisData.data?.length}`
    );

  } catch (err) {
    record("Sprint 2 Test Error", false, err.message);
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  const total  = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log("\n------------------------------------------");
  console.log(`  Summary: ${passed}/${total} Sprint 2 API tests passed`);
  console.log("------------------------------------------\n");

  process.exit(passed === total ? 0 : 1);
}

runSprint2Tests();
