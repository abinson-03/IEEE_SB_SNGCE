const mongoose = require('C:/Users/Abinson Babu/Desktop/ieee-sb-portal/server/node_modules/mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/ieee_sb_portal');
  const Unit = mongoose.model('Unit', new mongoose.Schema({}, { strict: false }));
  const PositionTemplate = mongoose.model('PositionTemplate', new mongoose.Schema({}, { strict: false }));
  const cis = await Unit.findOne({ name: 'CIS' });
  const positions = await PositionTemplate.find({ unit: cis._id });
  for (const p of positions) {
    console.log(`- ${p.positionName} | dutyType: ${p.dutyType} | year: ${p.academicYear} | ID: ${p._id}`);
  }
  process.exit(0);
}

run();
