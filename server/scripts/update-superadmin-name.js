const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const User = require("../models/User");

async function updateSuperadminName() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ieee_sb_portal");

  // Update existing superadmin accounts to name "Archana"
  const res = await User.updateMany(
    { email: { $in: ["admin@ieee-sngce.in", "archana.sb@ieee-sngce.in"] } },
    { $set: { name: "Archana" } }
  );

  console.log(`Updated ${res.modifiedCount} superadmin user(s) to name 'Archana'.`);

  const users = await User.find({ globalRole: "superadmin" });
  users.forEach((u) => console.log(`- ${u.email}: ${u.name}`));

  await mongoose.disconnect();
}

updateSuperadminName().catch(console.error);
