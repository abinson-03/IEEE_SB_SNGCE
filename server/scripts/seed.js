/**
 * IEEE SB Portal — Production-Ready Seed Script
 * Resets the database and populates:
 *   1. Units (SB, CS, CIS, SPS, WIE)
 *   2. Super Admins (SB Faculty Counselor & SB Chair)
 *   3. Chapter Admins (Faculty Advisors & Chapter Chairs for CS, CIS, SPS, WIE)
 *   4. Chapter Officers (Secretary, Treasurer, Webmaster, Technical Leads for each unit)
 *   5. Position Templates & Active Duty Assignments (Academic Year 2025-2026)
 *   6. Realistic Initial Events (Free & Paid with UPI)
 *   7. Sample Notifications & Member Account
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Unit = require("../models/Unit");
const User = require("../models/User");
const PositionTemplate = require("../models/PositionTemplate");
const DutyAssignment = require("../models/DutyAssignment");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const BudgetProposal = require("../models/BudgetProposal");

const ACADEMIC_YEAR = "2025-2026";

const UNITS_DATA = [
  { name: "SB",  type: "branch",  description: "IEEE Student Branch SNGCE — Parent organisation overseeing all technical chapters." },
  { name: "CS",  type: "chapter", description: "IEEE Computer Society Chapter — Software engineering, AI, computing and algorithms." },
  { name: "CIS", type: "chapter", description: "IEEE Computational Intelligence Society Chapter — Deep learning, neural networks and smart systems." },
  { name: "SPS", type: "chapter", description: "IEEE Signal Processing Society Chapter — DSP, telecommunications, audio and image processing." },
  { name: "WIE", type: "chapter", description: "IEEE Women in Engineering Affinity Group — Empowering and advancing women in technology." },
];

const seed = async () => {
  await connectDB();

  console.log("\n============================================================");
  console.log("  IEEE SB Portal — Full Database Reset & Hierarchical Seeding");
  console.log("============================================================\n");

  // 1. Clear existing collections
  console.log("🧹 Clearing old database records…");
  await User.deleteMany({});
  await Unit.deleteMany({});
  await PositionTemplate.deleteMany({});
  await DutyAssignment.deleteMany({});
  await Event.deleteMany({});
  await Notification.deleteMany({});
  await AuditLog.deleteMany({});
  await BudgetProposal.deleteMany({});
  console.log("  ✔ All collections cleared successfully.\n");

  // 2. Seed Units
  console.log("🏢 Seeding Units (SB & Technical Chapters)…");
  const unitMap = {};
  for (const u of UNITS_DATA) {
    const created = await Unit.create(u);
    unitMap[u.name] = created;
    console.log(`  ✔ Unit "${created.name}" (${created.type}) — ID: ${created._id}`);
  }

  // Helper to create users
  const createdUsers = {};
  const createUser = async (name, email, password, globalRole, chapters = []) => {
    const chapterIds = chapters.map((c) => unitMap[c]._id);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      globalRole,
      chapterMemberships: chapterIds,
    });
    createdUsers[email.toLowerCase()] = user;
    return user;
  };

  // 3. Seed Super Admins (SB Level: Faculty Counselor & SB Chair)
  console.log("\n🛡️ Seeding Super Admins (SB Level)…");
  const sbCounselor = await createUser(
    "Archana",
    "archana.sb@ieee-sngce.in",
    "Advisor@1234",
    "superadmin",
    ["SB", "CS", "CIS", "SPS", "WIE"]
  );
  console.log(`  ✔ Super Admin (Counselor): ${sbCounselor.name} (${sbCounselor.email})`);

  const sbChair = await createUser(
    "Jesmet (SB Chair)",
    "jesmet.sb@ieee-sngce.in",
    "Chair@1234",
    "superadmin",
    ["SB", "CS", "CIS", "SPS", "WIE"]
  );
  console.log(`  ✔ Super Admin (Chair): ${sbChair.name} (${sbChair.email})`);

  // Also create alias superadmin for general demo / tests
  const adminTest = await createUser(
    "Archana",
    "admin@ieee-sngce.in",
    "Admin@1234",
    "superadmin",
    ["SB", "CS", "CIS", "SPS", "WIE"]
  );
  console.log(`  ✔ Super Admin (Test Alias): ${adminTest.email}`);

  // 4. Seed Chapter Admins (Faculty Advisors & Chairs) — role: chapteradmin
  console.log("\n👔 Seeding Chapter Admins (Faculty Advisors & Chairs) [role: chapteradmin]…");
  
  // Computer Society (CS)
  const csAdvisor = await createUser("Prof. Deepa V (CS Advisor)", "advisor.cs@ieee-sngce.in", "Advisor@1234", "chapteradmin", ["CS"]);
  const csChair = await createUser("Gowtham (CS Chair)", "gowtham.cs@ieee-sngce.in", "Chair@1234", "chapteradmin", ["CS"]);
  const csOfficerTest = await createUser("Gowtham (CS Lead)", "officer@ieee-sngce.in", "Officer@1234", "chapteradmin", ["CS"]);

  // Computational Intelligence Society (CIS)
  const cisAdvisor = await createUser("Krishnendu (CIS Advisor)", "krishnendu.cis@ieee-sngce.in", "Advisor@1234", "chapteradmin", ["CIS"]);
  const cisChair = await createUser("Abinson Babu (CIS Chair)", "abinson.cis@ieee-sngce.in", "Chair@1234", "chapteradmin", ["CIS"]);

  // Signal Processing Society (SPS)
  const spsAdvisor = await createUser("Prof. Rajesh K (SPS Advisor)", "advisor.sps@ieee-sngce.in", "Advisor@1234", "chapteradmin", ["SPS"]);
  const spsChair = await createUser("Anand Kumar (SPS Chair)", "chair.sps@ieee-sngce.in", "Chair@1234", "chapteradmin", ["SPS"]);

  // Women in Engineering (WIE)
  const wieAdvisor = await createUser("Dr. Lakshmi S (WIE Advisor)", "advisor.wie@ieee-sngce.in", "Advisor@1234", "chapteradmin", ["WIE"]);
  const wieChair = await createUser("Anjali Krishna (WIE Chair)", "chair.wie@ieee-sngce.in", "Chair@1234", "chapteradmin", ["WIE"]);

  console.log("  ✔ Chapter Admins created for CS, CIS, SPS, and WIE (chapteradmin role).");

  // 5. Seed Chapter Officers
  console.log("\n⚡ Seeding Chapter & Branch Officers…");
  // SB Officers
  const sbViceChair = await createUser("Alen Thomas (SB Vice Chair)", "vicechair.sb@ieee-sngce.in", "Officer@1234", "execom", ["SB"]);
  const sbSec = await createUser("Gopika V (SB Secretary)", "secretary.sb@ieee-sngce.in", "Officer@1234", "execom", ["SB"]);
  const sbTreasurer = await createUser("Rohan Jacob (SB Treasurer)", "treasurer.sb@ieee-sngce.in", "Officer@1234", "execom", ["SB"]);
  const sbWebmaster = await createUser("Devadath M (SB Webmaster)", "webmaster.sb@ieee-sngce.in", "Officer@1234", "execom", ["SB"]);

  // CS Officers
  const csViceChair = await createUser("Meera S (CS Vice Chair)", "vicechair.cs@ieee-sngce.in", "Officer@1234", "execom", ["CS"]);
  const csSec = await createUser("Aravind P (CS Secretary)", "secretary.cs@ieee-sngce.in", "Officer@1234", "execom", ["CS"]);
  const csWebmaster = await createUser("Adithya K (CS Webmaster)", "webmaster.cs@ieee-sngce.in", "Officer@1234", "execom", ["CS"]);

  // CIS Officers
  const cisViceChair = await createUser("Akshaya K.P (CIS Vice Chair)", "akshaya.cis@ieee-sngce.in", "Officer@1234", "execom", ["CIS"]);
  const cisSec = await createUser("Riyan (CIS Secretary)", "riyan.cis@ieee-sngce.in", "Officer@1234", "execom", ["CIS"]);
  const cisAiLead = await createUser("Joel Varghese (CIS AI Lead)", "ailead.cis@ieee-sngce.in", "Officer@1234", "execom", ["CIS"]);

  // SPS Officers
  const spsViceChair = await createUser("Harikrishnan M (SPS Vice Chair)", "vicechair.sps@ieee-sngce.in", "Officer@1234", "execom", ["SPS"]);
  const spsSec = await createUser("Arya Nair (SPS Secretary)", "secretary.sps@ieee-sngce.in", "Officer@1234", "execom", ["SPS"]);

  // WIE Officers
  const wieViceChair = await createUser("Riya Susan (WIE Vice Chair)", "vicechair.wie@ieee-sngce.in", "Officer@1234", "execom", ["WIE"]);
  const wieSec = await createUser("Keerthana M (WIE Secretary)", "secretary.wie@ieee-sngce.in", "Officer@1234", "execom", ["WIE"]);
  const wieOutreach = await createUser("Malavika B (WIE Outreach Lead)", "outreach.wie@ieee-sngce.in", "Officer@1234", "execom", ["WIE"]);

  // 6. Seed Sample Members
  console.log("\n🎓 Seeding Sample Members…");
  const memberTest = await createUser(
    "Abin Babu (Member)",
    "member@ieee-sngce.in",
    "Member@1234",
    "member",
    ["CS", "CIS"]
  );
  const member2 = await createUser(
    "Sandra Paul",
    "sandra@ieee-sngce.in",
    "Member@1234",
    "member",
    ["WIE", "SPS"]
  );
  const member3 = await createUser(
    "Nikhil George",
    "nikhil@ieee-sngce.in",
    "Member@1234",
    "member",
    ["CS"]
  );
  console.log(`  ✔ Sample members created.`);

  // 7. Create PositionTemplates & Active Duty Assignments
  console.log("\n📜 Creating Position Templates & Assigning Duties (2025-2026)…");
  const POSITIONS_TO_ASSIGN = [
    // SB Unit
    { unit: "SB", pos: "Faculty Counselor", user: sbCounselor },
    { unit: "SB", pos: "Chair", user: sbChair },
    { unit: "SB", pos: "Vice Chair", user: sbViceChair },
    { unit: "SB", pos: "Secretary", user: sbSec },
    { unit: "SB", pos: "Treasurer", user: sbTreasurer },
    { unit: "SB", pos: "Webmaster", user: sbWebmaster },

    // CS Unit
    { unit: "CS", pos: "Chapter Advisor", user: csAdvisor },
    { unit: "CS", pos: "Chair", user: csChair },
    { unit: "CS", pos: "Vice Chair", user: csViceChair },
    { unit: "CS", pos: "Secretary", user: csSec },
    { unit: "CS", pos: "Webmaster", user: csWebmaster },
    { unit: "CS", pos: "Technical Lead", user: csOfficerTest },

    // CIS Unit
    { unit: "CIS", pos: "Chapter Advisor", user: cisAdvisor },
    { unit: "CIS", pos: "Chair", user: cisChair },
    { unit: "CIS", pos: "Vice Chair", user: cisViceChair },
    { unit: "CIS", pos: "Secretary", user: cisSec },
    { unit: "CIS", pos: "AI & Projects Lead", user: cisAiLead },

    // SPS Unit
    { unit: "SPS", pos: "Chapter Advisor", user: spsAdvisor },
    { unit: "SPS", pos: "Chair", user: spsChair },
    { unit: "SPS", pos: "Vice Chair", user: spsViceChair },
    { unit: "SPS", pos: "Secretary", user: spsSec },

    // WIE Unit
    { unit: "WIE", pos: "Affinity Advisor", user: wieAdvisor },
    { unit: "WIE", pos: "Chair", user: wieChair },
    { unit: "WIE", pos: "Vice Chair", user: wieViceChair },
    { unit: "WIE", pos: "Secretary", user: wieSec },
    { unit: "WIE", pos: "Outreach Coordinator", user: wieOutreach },
  ];

  const resolveDutyType = (pos) => {
    const p = pos.toLowerCase();
    if (p.includes("chair") || p.includes("advisor") || p.includes("counselor")) return "oversight";
    if (p.includes("secretary")) return "reporting";
    if (p.includes("treasurer")) return "budget";
    if (p.includes("design") || p.includes("poster") || p.includes("media") || p.includes("webmaster")) return "design";
    return "general";
  };

  for (const item of POSITIONS_TO_ASSIGN) {
    const template = await PositionTemplate.create({
      unit: unitMap[item.unit]._id,
      positionName: item.pos,
      dutyType: resolveDutyType(item.pos),
      academicYear: ACADEMIC_YEAR,
      createdBy: sbChair._id,
    });

    await DutyAssignment.create({
      user: item.user._id,
      positionTemplate: template._id,
      assignedBy: sbChair._id,
      status: "active",
    });
    console.log(`  ✔ Assigned [${item.unit}] ${item.pos} ➔ ${item.user.name}`);
  }

  // 8. Seed Initial Events (Free & Paid)
  console.log("\n🎟️ Seeding Realistic Events across Chapters…");
  const eventsData = [
    {
      title: "MERN Stack Bootcamp & API Engineering",
      description: "Hands-on 2-day full-stack web development workshop covering Node.js, Express, MongoDB, and React with real deployment.",
      unit: unitMap["CS"]._id,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      venue: "CS Seminar Hall & CCF Lab 3",
      category: "technical",
      status: "published",
      capacity: 60,
      isPaid: true,
      fee: 150,
      memberFee: 100,
      upiId: "ieee.cs.sngce@sbi",
      createdBy: csChair._id,
      registrations: [
        {
          user: memberTest._id,
          name: memberTest.name,
          email: memberTest.email,
          phone: "9876543210",
          college: "SNGCE Kadayiruppu",
          paymentStatus: "paid",
          transactionId: "UPI983471092834",
          registeredAt: new Date(),
        },
      ],
    },
    {
      title: "Generative AI & LLM Applications Hands-on",
      description: "Learn how to build AI agent workflows, prompt engineering, and RAG pipelines using Python and modern LLM APIs.",
      unit: unitMap["CIS"]._id,
      date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      venue: "IoT & Smart Systems Lab",
      category: "technical",
      status: "published",
      capacity: 50,
      isPaid: false,
      fee: 0,
      memberFee: 0,
      createdBy: cisChair._id,
      registrations: [],
    },
    {
      title: "Signal Processing & Embedded DSP Hackathon",
      description: "State-level 24-hour hardware and signal processing hackathon with prizes worth 15K.",
      unit: unitMap["SPS"]._id,
      date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      venue: "ECE Project Lab",
      category: "hackathon",
      status: "published",
      capacity: 40,
      isPaid: true,
      fee: 200,
      memberFee: 150,
      upiId: "ieee.sps.sngce@sbi",
      createdBy: spsChair._id,
      registrations: [],
    },
    {
      title: "Women in Tech Leadership Conclave 2026",
      description: "Keynote talks, panel discussions, and mentorship sessions featuring leading women leaders from Google, Microsoft, and UST.",
      unit: unitMap["WIE"]._id,
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      venue: "Main Auditorium",
      category: "non-technical",
      status: "published",
      capacity: 120,
      isPaid: false,
      fee: 0,
      memberFee: 0,
      createdBy: wieChair._id,
      registrations: [
        {
          user: member2._id,
          name: member2.name,
          email: member2.email,
          phone: "9123456789",
          college: "SNGCE Kadayiruppu",
          paymentStatus: "free",
          registeredAt: new Date(),
        },
      ],
    },
    {
      title: "IEEE SB SNGCE Annual General Meeting (AGM)",
      description: "Annual meeting celebrating IEEE SB milestones, passing the torch to the new ExeCom, and felicitating outstanding student volunteers.",
      unit: unitMap["SB"]._id,
      date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      venue: "Central Seminar Hall",
      category: "meeting",
      status: "published",
      capacity: 200,
      isPaid: false,
      fee: 0,
      memberFee: 0,
      createdBy: sbChair._id,
      registrations: [],
    },
  ];

  for (const ev of eventsData) {
    const createdEv = await Event.create(ev);
    console.log(`  ✔ Event "${createdEv.title}" (${createdEv.isPaid ? "Paid: ₹" + createdEv.fee : "Free"}) — ID: ${createdEv._id}`);
  }

  // 9. Seed Sample Budget Proposals
  console.log("\n💰 Seeding Sample Budget Proposals…");
  await BudgetProposal.create([
    {
      unit: unitMap["CIS"]._id,
      title: "Deep Learning Workshop Cloud GPUs & Kits",
      amount: 4500,
      description: "Cloud GPU compute credits and printed reference cheat-sheets for 40 hands-on attendees.",
      submittedBy: cisChair._id,
      status: "pending",
    },
    {
      unit: unitMap["CS"]._id,
      title: "Algorhythm Hackathon Refreshments & Badges",
      amount: 3200,
      description: "Lanyards, printed ID passes, and evening tea for participants.",
      submittedBy: csChair._id,
      status: "approved",
      reviewedBy: sbChair._id,
      reviewDate: new Date(),
      reviewComment: "Approved within semester budget quota.",
    },
  ]);

  // 10. Initial Audit Log
  await AuditLog.create({
    performedBy: sbChair._id,
    action: "SYSTEM_INITIALIZE",
    targetType: "System",
    meta: { message: "Database reset and seeded with full IEEE SB SNGCE organizational hierarchy." },
  });

  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("  🎉 Seed Complete! All data populated cleanly.");
  console.log("══════════════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
