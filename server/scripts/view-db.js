/**
 * Quick Terminal DB Viewer for IEEE SB Portal
 * Run via: node server/scripts/view-db.js or npm run db:view
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ieee_sb_portal";

async function viewDB() {
  console.log("\n============================================================");
  console.log("  📊 IEEE SB Portal — MongoDB Database Explorer");
  console.log("  Connection: " + MONGO_URI);
  console.log("============================================================\n");

  await mongoose.connect(MONGO_URI);

  const User = require("../models/User");
  const Unit = require("../models/Unit");
  const Event = require("../models/Event");
  const AuditLog = require("../models/AuditLog");
  const DutyAssignment = require("../models/DutyAssignment");
  const PositionTemplate = require("../models/PositionTemplate");

  // 1. Units
  const units = await Unit.find().lean();
  console.log(`\n🏛️  UNITS / CHAPTERS (${units.length} total)`);
  console.log("------------------------------------------------------------");
  units.forEach((u, i) => {
    console.log(` ${i + 1}. [${u.name}] ${u.type.toUpperCase()} — ${u.description?.slice(0, 60)}…`);
  });

  // 2. Users
  const users = await User.find().populate("chapterMemberships", "name").lean();
  console.log(`\n👥  USERS (${users.length} total)`);
  console.log("------------------------------------------------------------");
  users.forEach((u, i) => {
    const chapters = u.chapterMemberships?.map((c) => c.name).join(", ") || "None";
    console.log(` ${i + 1}. ${u.name.padEnd(20)} | ${u.email.padEnd(30)} | Role: ${u.globalRole.padEnd(11)} | Chapters: ${chapters}`);
  });

  // 3. Events
  const events = await Event.find().populate("unit", "name").lean();
  console.log(`\n🗓️  EVENTS (${events.length} total)`);
  console.log("------------------------------------------------------------");
  if (events.length === 0) {
    console.log(" (No events found)");
  } else {
    events.forEach((e, i) => {
      const regCount = e.registrations?.length || 0;
      const attCount = e.attendance?.length || 0;
      const dateStr = new Date(e.date).toLocaleDateString("en-IN", { dateStyle: "medium" });
      console.log(` ${i + 1}. "${e.title}" | Unit: ${e.unit?.name} | Status: ${e.status.toUpperCase()} | Date: ${dateStr} | Reg: ${regCount}, Attended: ${attCount}`);
    });
  }

  // 4. Audit Logs
  const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(10).lean();
  console.log(`\n🔍  RECENT AUDIT LOGS (${auditLogs.length} shown)`);
  console.log("------------------------------------------------------------");
  if (auditLogs.length === 0) {
    console.log(" (No audit logs yet)");
  } else {
    auditLogs.forEach((a, i) => {
      const timeStr = new Date(a.createdAt).toLocaleTimeString("en-IN");
      console.log(` ${i + 1}. [${timeStr}] Action: ${a.action.padEnd(18)} | Target: ${a.targetType} (${a.targetId})`);
    });
  }

  console.log("\n============================================================\n");
  await mongoose.disconnect();
  process.exit(0);
}

viewDB().catch((err) => {
  console.error("DB View Error:", err);
  process.exit(1);
});
