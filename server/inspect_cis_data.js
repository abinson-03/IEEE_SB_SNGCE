const mongoose = require('C:/Users/Abinson Babu/Desktop/ieee-sb-portal/server/node_modules/mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/ieee_sb_portal');
  const db = mongoose.connection.db;

  // List all users
  const users = await db.collection('users').find({}).toArray();
  console.log(`Total users: ${users.length}`);
  const cisUsers = users.filter(u => 
    (u.email && (u.email.includes('.cis@') || u.email.includes('cis'))) || 
    (u.name && u.name.includes('CIS')) ||
    (u.email && u.email.includes('test')) ||
    (u.email && u.email.includes('polish'))
  );
  console.log('CIS or test users in DB:');
  for (const u of cisUsers) {
    console.log(` - ID: ${u._id} | Name: "${u.name}" | Email: "${u.email}" | Role: ${u.globalRole}`);
  }

  // Check Events
  const events = await db.collection('events').find({}).toArray();
  console.log(`\nTotal events: ${events.length}`);
  for (const e of events) {
    console.log(` - Event: "${e.title}" | Unit: ${e.unit} | Status: ${e.status} | ID: ${e._id}`);
  }

  // Check eventphotos
  const photos = await db.collection('eventphotos').find({}).toArray();
  console.log(`\nTotal eventphotos: ${photos.length}`);
  for (const p of photos) {
    console.log(` - Photo: "${p.caption}" | Event: ${p.event} | URL: ${p.imageUrl || p.url} | ID: ${p._id}`);
  }

  // Check notices
  const notices = await db.collection('notices').find({}).toArray();
  console.log(`\nTotal notices: ${notices.length}`);
  for (const n of notices) {
    console.log(` - Notice: "${n.title}" | Pinned: ${n.isPinned} | ID: ${n._id}`);
  }

  process.exit(0);
}

run();
