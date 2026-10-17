const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // An account has an email, a WhatsApp phone number, or both. Uniqueness is enforced by the
    // partial indexes below (only when the field is set).
    email: { type: String, lowercase: true, trim: true },
    // Digits only, international format without "+", as WhatsApp reports it (e.g. 919876543210).
    phone: { type: String, trim: true },
    phoneVerified: { type: Boolean, default: false },
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

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } });
userSchema.index({ emailVerifyTokenHash: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 });

// Bidding and applying need either a confirmed email or a WhatsApp-verified phone.
userSchema.methods.isVerified = function () {
  return !!(this.emailVerified || this.phoneVerified);
};

module.exports = mongoose.model("User", userSchema);
