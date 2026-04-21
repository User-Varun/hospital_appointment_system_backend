const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },
    specialty: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  // Skip hashing for records that already contain a bcrypt hash.
  if (/^\$2[aby]\$/.test(this.password)) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.matchPassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }

  if (/^\$2[aby]\$/.test(this.password)) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Backward compatibility for legacy plaintext records.
  return candidatePassword === this.password;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
