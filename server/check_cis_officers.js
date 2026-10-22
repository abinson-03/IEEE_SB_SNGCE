const mongoose = require('C:/Users/Abinson Babu/Desktop/ieee-sb-portal/server/node_modules/mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/ieee_sb_portal');
  const Unit = mongoose.model('Unit', new mongoose.Schema({}, { strict: false }));
  const PositionTemplate = mongoose.model('PositionTemplate', new mongoose.Schema({}, { strict: false }));
  const DutyAssignment = mongoose.model('DutyAssignment', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const cis = await Unit.findOne({ name: 'CIS' });
  console.log('CIS Unit ID:', cis._id);
  const positions = await PositionTemplate.find({ unit: cis._id });
  console.log('CIS Positions:');
  for (const p of positions) {
    console.log(` - ${p.title} (ID: ${p._id}, rank: ${p.rank})`);
  }

  const posIds = positions.map(p => p._id);
  const duties = await DutyAssignment.find({ positionTemplate: { $in: posIds } });
  console.log('CIS Duties:');
  for (const d of duties) {
    const user = d.user ? await User.findById(d.user) : null;
    const pos = positions.find(p => p._id.toString() === d.positionTemplate.toString());
    console.log(` - Duty for ${pos ? pos.title : d.positionTemplate}: user=${user ? user.name + ' (' + user.email + ')' : 'NONE'}, status=${d.status}`);
  }

  // Check if any user with name Nikitha already exists
  const existingNikitha = await User.find({ name: /nikitha/i });
  console.log('Existing Nikitha users:', existingNikitha.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.globalRole })));

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
