const mongoose = require('C:/Users/Abinson Babu/Desktop/ieee-sb-portal/server/node_modules/mongoose');
const bcrypt = require('C:/Users/Abinson Babu/Desktop/ieee-sb-portal/server/node_modules/bcryptjs');

const CIS_OFFICERS = [
  {
    name: "Krishnaindu KS",
    position: "Faculty Advisor",
    email: "krishnaindu@gmail.com",
    pass: "krishnaindu@123",
    role: "chapteradmin",
    dutyType: "oversight"
  },
  {
    name: "Abinson Babu",
    position: "Chair",
    email: "abinsonb@gmail.com",
    pass: "Welcome@123",
    role: "chapteradmin",
    dutyType: "oversight"
  },
  {
    name: "Akshaya KP",
    position: "Vice Chair",
    email: "akshaya.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "oversight"
  },
  {
    name: "Riyan",
    position: "Secretary",
    email: "riyan@gmail.com",
    pass: "Riyan@123",
    role: "execom",
    dutyType: "reporting"
  },
  {
    name: "Parthip",
    position: "Joint Secretary",
    email: "parthip.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "reporting"
  },
  {
    name: "Nikitha",
    position: "Treasurer",
    email: "nikitha@gmail.com",
    pass: "Nikitha@123",
    role: "execom",
    dutyType: "budget"
  },
  {
    name: "Saniya S",
    position: "Program Lead",
    email: "saniya.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "general"
  },
  {
    name: "Jagath Krishna",
    position: "Web Master",
    email: "jagath.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "design"
  },
  {
    name: "Neeraja R",
    position: "Design Lead",
    email: "neeraja.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "design"
  },
  {
    name: "Lakshmi B",
    position: "Event Coordinator",
    email: "lakshmi.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "general"
  },
  {
    name: "Darshan Krishna",
    position: "Technical Lead",
    email: "darshan.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "general"
  },
  {
    name: "Saroj",
    position: "Social Event Lead",
    email: "saroj.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "general"
  },
  {
    name: "Dharmaja",
    position: "Outreach Coordinator",
    email: "dharmaja.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "general"
  },
  {
    name: "Adithyan",
    position: "Marketing/Publicity Coordinator",
    email: "adithyan.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "design"
  },
  {
    name: "Devananda",
    position: "Membership Engagement",
    email: "devananda.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "general"
  },
  {
    name: "Nikson",
    position: "Project Coordinator",
    email: "nikson.cis@ieee-sngce.in",
    pass: "Officer@123",
    role: "execom",
    dutyType: "general"
  }
];

async function setup() {
  await mongoose.connect('mongodb://localhost:27017/ieee_sb_portal');

  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: { type: String, select: true },
    globalRole: String,
    chapterMemberships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],
    status: { type: String, default: 'active' },
    profilePhoto: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }));

  const Unit = mongoose.model('Unit', new mongoose.Schema({
    name: String,
    type: String,
    description: String,
    coverImage: String
  }));

  const PositionTemplate = mongoose.model('PositionTemplate', new mongoose.Schema({
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    positionName: String,
    dutyType: String,
    academicYear: String,
    isArchived: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }));

  const DutyAssignment = mongoose.model('DutyAssignment', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    positionTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'PositionTemplate' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'active' }
  }));

  // 1. Find CIS Unit
  const cis = await Unit.findOne({ name: 'CIS' });
  if (!cis) {
    throw new Error('CIS Unit not found');
  }
  console.log('CIS Unit ID:', cis._id);

  // 2. Find Superadmin
  let admin = await User.findOne({ globalRole: 'superadmin' });
  if (!admin) {
    admin = await User.findOne({ name: /abinson/i });
  }

  // 3. Clear existing CIS duty assignments and position templates
  const oldCisTemplates = await PositionTemplate.find({ unit: cis._id });
  const oldTemplateIds = oldCisTemplates.map(t => t._id);
  const deletedDuties = await DutyAssignment.deleteMany({ positionTemplate: { $in: oldTemplateIds } });
  console.log(`Cleared ${deletedDuties.deletedCount} old CIS duty assignments.`);
  const deletedTemplates = await PositionTemplate.deleteMany({ unit: cis._id });
  console.log(`Cleared ${deletedTemplates.deletedCount} old CIS position templates.`);

  // 4. Create / Update Users, PositionTemplates, and DutyAssignments
  const createdRoster = [];

  for (const item of CIS_OFFICERS) {
    const hashedPassword = await bcrypt.hash(item.pass, 12);

    let user = await User.findOne({ email: item.email.toLowerCase() });
    if (user) {
      user.name = item.name;
      user.password = hashedPassword;
      user.globalRole = item.role;
      user.status = 'active';
      if (!user.chapterMemberships.some(id => id.toString() === cis._id.toString())) {
        user.chapterMemberships.push(cis._id);
      }
      await user.save();
      console.log(`[USER UPDATED] ${item.name} (${item.email}) - Role: ${item.role}`);
    } else {
      user = await User.create({
        name: item.name,
        email: item.email.toLowerCase(),
        password: hashedPassword,
        globalRole: item.role,
        chapterMemberships: [cis._id],
        status: 'active',
        profilePhoto: ''
      });
      console.log(`[USER CREATED] ${item.name} (${item.email}) - Role: ${item.role}`);
    }

    // Create Position Template
    const template = await PositionTemplate.create({
      unit: cis._id,
      positionName: item.position,
      dutyType: item.dutyType,
      academicYear: '2025-2026',
      isArchived: false,
      createdBy: admin ? admin._id : user._id
    });

    // Create Duty Assignment
    const duty = await DutyAssignment.create({
      user: user._id,
      positionTemplate: template._id,
      assignedBy: admin ? admin._id : user._id,
      status: 'active'
    });

    createdRoster.push({
      name: item.name,
      position: item.position,
      email: item.email,
      pass: item.pass,
      role: item.role,
      dutyType: item.dutyType
    });
  }

  console.log('\n=============================================');
  console.log(`SUCCESS: Successfully populated ${createdRoster.length} CIS ExeCom officers!`);
  console.log('=============================================\n');

  process.exit(0);
}

setup().catch(err => {
  console.error(err);
  process.exit(1);
});
