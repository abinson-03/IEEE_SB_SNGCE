const mongoose = require('mongoose');

async function testMongo() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ieee_sb_portal');
    console.log('MongoDB connection SUCCESSFUL on localhost:27017/ieee_sb_portal');
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log('Total Collections:', cols.length);
    for (const c of cols) {
      const cnt = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log('  - ' + c.name + ': ' + cnt + ' records');
    }
  } catch (err) {
    console.error('Mongo Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

testMongo();
