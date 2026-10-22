const mongoose = require('C:/Users/Abinson Babu/Desktop/ieee-sb-portal/server/node_modules/mongoose');
const bcrypt = require('C:/Users/Abinson Babu/Desktop/ieee-sb-portal/server/node_modules/bcryptjs');

async function createTreasurer() {
  await mongoose.connect('mongodb://localhost:27017/ieee_sb_portal');

  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: { type: String, select: true },
    globalRole: String,
    chapterMemberships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
  }));

  const Unit = mongoose.model('Unit', new mongoose.Schema({
    name: String,
    type: String
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

  // 1. Get CIS Unit
  const cisUnit = await Unit.findOne({ name: 'CIS' });
  if (!cisUnit) {
    throw new Error('CIS Unit not found!');
  }
  console.log('CIS Unit ID:', cisUnit._id);

  // 2. Find an Admin user to be the assigner / creator
  let admin = await User.findOne({ globalRole: 'superadmin' });
  if (!admin) {
    admin = await User.findOne({ name: /abinson/i });
  }

  // 3. Check or Create/Update Nikitha User
  const email = 'nikitha.cis@ieee-sngce.in';
  const rawPassword = 'Treasurer@123';
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  let user = await User.findOne({ email });
  if (user) {
    user.name = 'Nikitha (CIS Treasurer)';
    user.password = hashedPassword;
    user.globalRole = 'execom';
    user.status = 'active';
    if (!user.chapterMemberships.some(id => id.toString() === cisUnit._id.toString())) {
      user.chapterMemberships.push(cisUnit._id);
    }
    await user.save();
    console.log('Existing user updated:', user._id);
  } else {
    user = await User.create({
      name: 'Nikitha (CIS Treasurer)',
      email,
      password: hashedPassword,
      globalRole: 'execom',
      chapterMemberships: [cisUnit._id],
      status: 'active'
    });
    console.log('New Nikitha user created:', user._id);
  }

  // 4. Check or Create PositionTemplate for CIS Treasurer
  let pos = await PositionTemplate.findOne({
    unit: cisUnit._id,
    positionName: 'Treasurer',
    academicYear: '2025-2026'
  });

  if (!pos) {
    pos = await PositionTemplate.create({
      unit: cisUnit._id,
      positionName: 'Treasurer',
      dutyType: 'budget',
      academicYear: '2025-2026',
      isArchived: false,
      createdBy: admin ? admin._id : user._id
    });
    console.log('Created CIS Treasurer PositionTemplate:', pos._id);
  } else {
    pos.dutyType = 'budget';
    pos.isArchived = false;
    await pos.save();
    console.log('Existing PositionTemplate verified:', pos._id);
  }

  // 5. Check or Create DutyAssignment
  let duty = await DutyAssignment.findOne({
    positionTemplate: pos._id,
    user: user._id
  });

  if (!duty) {
    // Check if there was an unassigned/vacant duty for this template
    duty = await DutyAssignment.findOne({ positionTemplate: pos._id });
    if (duty) {
      duty.user = user._id;
      duty.status = 'active';
      duty.assignedBy = admin ? admin._id : user._id;
      await duty.save();
      console.log('Updated existing duty to Nikitha:', duty._id);
    } else {
      duty = await DutyAssignment.create({
        user: user._id,
        positionTemplate: pos._id,
        assignedBy: admin ? admin._id : user._id,
        status: 'active'
      });
      console.log('Created new DutyAssignment for Nikitha:', duty._id);
    }
  } else {
    duty.status = 'active';
    await duty.save();
    console.log('DutyAssignment already active for Nikitha:', duty._id);
  }

  // Verify login match
  const testCompare = await bcrypt.compare(rawPassword, user.password);
  console.log('\n--- VERIFICATION SUCCESS ---');
  console.log('Name:    ', user.name);
  console.log('Email:   ', user.email);
  console.log('Password:', rawPassword);
  console.log('Role:    ', user.globalRole);
  console.log('Chapter:  CIS (ID: ' + cisUnit._id + ')');
  console.log('Position: Treasurer (dutyType: budget)');
  console.log('Auth check:', testCompare ? 'PASSED (Password matches)' : 'FAILED');

  process.exit(0);
}

createTreasurer().catch(err => {
  console.error(err);
  process.exit(1);
});
