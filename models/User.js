const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Empty for accounts created with Google until they set a password via "Forgot password".
    password: { type: String, default: "" },
    googleId: { type: String, default: "" },

    // "artist" is only set once an admin approves the user's artist application.
    role: { type: String, enum: ["buyer", "artist"], default: "buyer" },
    isApproved: { type: Boolean, default: false },
    profilePhoto: { type: String, default: "" },

    emailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, default: "" },
    emailVerifyExpires: { type: Date },
    passwordResetTokenHash: { type: String, default: "" },
    passwordResetExpires: { type: Date },

    // Bumped on password reset so older login tokens stop working.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ emailVerifyTokenHash: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 });

module.exports = mongoose.model("User", userSchema);
