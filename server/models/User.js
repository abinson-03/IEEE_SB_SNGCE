const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Model
 * Supports 4 global roles: superadmin, execom, member, guest.
 * Chapter-level access is determined by DutyAssignment (execom role)
 * and chapterMemberships (member role). A user may belong to multiple chapters.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },
    globalRole: {
      type: String,
      // Hierarchy:
      //   superadmin   → SB Counselor & SB Chair — full system access + create events for ALL units
      //   chapteradmin → Chapter Advisors & Chapter Chairs — create/manage events for their chapter
      //   execom       → Secretaries, Treasurers, Vice Chairs, Webmasters — NO event creation
      //   member       → Regular IEEE Members
      //   guest        → Unauthenticated or non-IEEE visitors
      enum: ["superadmin", "chapteradmin", "execom", "member", "guest"],
      default: "member",
    },
    // Array of Unit refs this user belongs to as a member or execom
    chapterMemberships: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // File path to user's profile photo (e.g. /uploads/profiles/xxx.jpg)
    // Image binary/base64 is NEVER stored in MongoDB
    profilePhoto: {
      type: String,
      default: "",
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false } // Using manual createdAt; updatedAt not needed for Sprint 1
);

// Hash password before saving if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare candidate password with stored hash
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
