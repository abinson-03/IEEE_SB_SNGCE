const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Event = require("../models/Event");
const EventPhoto = require("../models/EventPhoto");
const User = require("../models/User");

const API_BASE = "http://localhost:5000/api";

async function runTest() {
  console.log("=== Testing Gallery Edit Endpoints (PATCH & DELETE) ===");

  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ieee_sb_portal");
  console.log("Connected to MongoDB");

  // 1. Get an officer user
  const officer = await User.findOne({ globalRole: { $in: ["superadmin", "execom", "chapteradmin"] } });
  if (!officer) {
    throw new Error("No officer user found in database!");
  }

  const jwt = require("jsonwebtoken");
  const token = jwt.sign(
    { id: officer._id, globalRole: officer.globalRole },
    process.env.JWT_SECRET || "ieee_secret_key_sprint1_2026",
    { expiresIn: "1h" }
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 2. Find or create a test event photo
  let event = await Event.findOne();
  if (!event) {
    throw new Error("No events found in database!");
  }

  const testPhoto = await EventPhoto.create({
    event: event._id,
    uploadedBy: officer._id,
    filename: "test-gallery-edit.jpg",
    url: "/uploads/events/test-gallery-edit.jpg",
    caption: "Original Caption Before Edit",
    isCover: false,
  });

  console.log("Created test photo:", testPhoto._id);

  // 3. Test PATCH /api/gallery/photos/:photoId (edit caption & set cover)
  const patchRes = await fetch(`${API_BASE}/gallery/photos/${testPhoto._id}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ caption: "Brand New Edited Caption!", isCover: true }),
  });

  const patchData = await patchRes.json();
  console.log("[Test 1] PATCH /api/gallery/photos/:id status:", patchRes.status);
  console.log("Updated caption:", patchData.data?.caption);
  console.log("Updated isCover:", patchData.data?.isCover);

  if (patchRes.status !== 200) {
    throw new Error(`PATCH failed with status ${patchRes.status}: ${JSON.stringify(patchData)}`);
  }
  if (patchData.data?.caption !== "Brand New Edited Caption!") {
    throw new Error("Caption was not updated correctly!");
  }
  if (patchData.data?.isCover !== true) {
    throw new Error("isCover was not updated to true!");
  }

  // Check database directly
  const inDb = await EventPhoto.findById(testPhoto._id);
  if (inDb.caption !== "Brand New Edited Caption!" || !inDb.isCover) {
    throw new Error("Database record does not match patch response!");
  }
  console.log("✓ MongoDB verification passed for edit");

  // 4. Test DELETE /api/gallery/photos/:photoId
  const deleteRes = await fetch(`${API_BASE}/gallery/photos/${testPhoto._id}`, {
    method: "DELETE",
    headers: authHeaders,
  });

  const deleteData = await deleteRes.json();
  console.log("[Test 2] DELETE /api/gallery/photos/:id status:", deleteRes.status);
  console.log("Delete message:", deleteData.message);

  if (deleteRes.status !== 200) {
    throw new Error(`DELETE failed with status ${deleteRes.status}: ${JSON.stringify(deleteData)}`);
  }

  const deletedInDb = await EventPhoto.findById(testPhoto._id);
  if (deletedInDb) {
    throw new Error("Photo was not deleted from database!");
  }
  console.log("✓ MongoDB verification passed: photo document deleted");

  await mongoose.disconnect();
  console.log("\n=================================");
  console.log("ALL GALLERY EDIT TESTS PASSED! ✓");
  console.log("=================================");
}

runTest().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
