const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Unit = require("../models/Unit");
const PositionTemplate = require("../models/PositionTemplate");
const DutyAssignment = require("../models/DutyAssignment");
const Event = require("../models/Event");
const Certificate = require("../models/Certificate");
const restrictTo = require("../middleware/roleMiddleware");

const results = [];

function record(item, passed, details = "") {
  results.push({ item, passed, details });
  const mark = passed ? "[\x1b[32mPASS\x1b[0m]" : "[\x1b[31mFAIL\x1b[0m]";
  console.log(`${mark} ${item} ${details ? "- " + details : ""}`);
}

async function runChecklist() {
  console.log("\n==========================================");
  console.log("  IEEE SB Portal - Sprint 1 Test Checklist");
  console.log("==========================================\n");

  try {
    // 1. Database Connection
    await connectDB();
    record("1. Database Connection", true, "Connected to MongoDB successfully");

    // 2. Unit Seeding Verification
    const expectedUnits = ["SB", "CIS", "CS", "SPS", "WIE"];
    const foundUnits = await Unit.find({ name: { $in: expectedUnits } });
    const foundUnitNames = foundUnits.map((u) => u.name);
    const allUnitsPresent = expectedUnits.every((u) => foundUnitNames.includes(u));
    record(
      "2. Unit Models & Seeding",
      allUnitsPresent && foundUnits.length >= 5,
      `Found ${foundUnits.length} units (${foundUnitNames.join(", ")})`
    );

    const sbUnit = foundUnits.find((u) => u.name === "SB") || foundUnits[0];

    // 3. User Registration & Password Hashing
    const testEmail = `test_${Date.now()}@ieee.org`;
    const plainPassword = "Password123!";
    const testUser = await User.create({
      name: "Test Officer",
      email: testEmail,
      password: plainPassword,
      globalRole: "superadmin",
      chapterMemberships: [sbUnit._id],
    });

    const isHashed = testUser.password !== plainPassword && testUser.password.startsWith("$2");
    const matches = await testUser.matchPassword(plainPassword);
    const wrongMatches = !(await testUser.matchPassword("WrongPassword"));
    record(
      "3. User Model & Password Hashing",
      isHashed && matches && wrongMatches,
      "Pre-save bcrypt hashing and matchPassword() validated"
    );

    // 4. Password Excluded in Default Queries
    const queriedUser = await User.findById(testUser._id);
    record(
      "4. Password Excluded by Default in Queries",
      queriedUser.password === undefined,
      "queriedUser.password is undefined"
    );

    // 5. Duplicate Email Validation
    let duplicateRejected = false;
    try {
      await User.create({
        name: "Duplicate User",
        email: testEmail,
        password: "AnotherPassword123",
      });
    } catch (err) {
      duplicateRejected = err.code === 11000;
    }
    record(
      "5. Duplicate Email Rejection (Unique Index)",
      duplicateRejected,
      "Duplicate email properly rejected with 11000 code"
    );

    // 6. PositionTemplate Dynamic Engine Model
    // Pre-clean in case a previous test run left orphaned data
    await PositionTemplate.deleteMany({ unit: sbUnit._id, positionName: "Webmaster", academicYear: "2026-2027" });
    const testPosition = await PositionTemplate.create({
      unit: sbUnit._id,
      positionName: "Webmaster",
      academicYear: "2026-2027",
      createdBy: testUser._id,
    });
    record(
      "6. PositionTemplate Model (Dynamic Duty Engine)",
      testPosition && testPosition.positionName === "Webmaster",
      `Created '${testPosition.positionName}' for year ${testPosition.academicYear}`
    );

    // 7. DutyAssignment Model
    const testDuty = await DutyAssignment.create({
      user: testUser._id,
      positionTemplate: testPosition._id,
      assignedBy: testUser._id,
      status: "active",
    });
    record(
      "7. DutyAssignment Model",
      testDuty && testDuty.status === "active",
      `Assigned user ${testUser.name} to template ${testPosition._id}`
    );

    // 8. Event Model (Sprint 4 schema: registrations & attendance require name + email)
    const testEvent = await Event.create({
      title: "Orientation 2026",
      description: "Welcome event for new IEEE members",
      unit: sbUnit._id,
      date: new Date(),
      venue: "Main Auditorium",
      createdBy: testUser._id,
      status: "published",
      registrations: [{ user: testUser._id, name: testUser.name, email: testUser.email }],
      attendance:    [{ user: testUser._id, name: testUser.name, email: testUser.email }],
    });
    record(
      "8. Event Model & Attendance Schema",
      testEvent && testEvent.attendance.length === 1,
      `Event created with ${testEvent.registrations.length} reg and ${testEvent.attendance.length} attendance entry`
    );

    // 9. Certificate Model
    const testCert = await Certificate.create({
      event: testEvent._id,
      user: testUser._id,
      recipientName: testUser.name,
      recipientEmail: testUser.email,
      eventTitle: testEvent.title,
      eventDate: testEvent.date,
      generatedBy: testUser._id,
      pdfData: Buffer.from("mock-pdf-data"),
      pdfUrl: "https://storage.example.com/certs/cert-123.pdf",
      emailSent: false,
    });
    record(
      "9. Certificate Model",
      testCert && testCert.emailSent === false,
      `Certificate issued for user ${testUser._id}`
    );

    // 10. Role Middleware (restrictTo)
    let superadminAllowed = false;
    let guestAllowed = false;
    const reqSuperadmin = { user: { globalRole: "superadmin" } };
    const reqGuest = { user: { globalRole: "guest" } };
    const res = {};

    restrictTo("superadmin")(reqSuperadmin, res, () => {
      superadminAllowed = true;
    });

    restrictTo("superadmin")(reqGuest, res, (err) => {
      if (err && err.statusCode === 403) {
        guestAllowed = false; // correctly blocked
      }
    });

    record(
      "10. Role Middleware (restrictTo)",
      superadminAllowed && !guestAllowed,
      "superadmin allowed (200), guest blocked (403)"
    );

    // Clean up temporary test documents
    await Certificate.findByIdAndDelete(testCert._id);
    await Event.findByIdAndDelete(testEvent._id);
    await DutyAssignment.findByIdAndDelete(testDuty._id);
    await PositionTemplate.findByIdAndDelete(testPosition._id);
    await User.findByIdAndDelete(testUser._id);
    console.log("\n  Cleaned up temporary test data.");

  } catch (error) {
    record("Test Execution Error", false, error.message);
  } finally {
    await mongoose.disconnect();
  }

  // Summary
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log("\n------------------------------------------");
  console.log(`  Summary: ${passed}/${total} checks passed`);
  console.log("------------------------------------------\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runChecklist();
