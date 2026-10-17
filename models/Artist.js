const mongoose = require("mongoose");

// One artist application/profile per user account.
const artistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    basicInfo: {
      artistId: { type: String, required: true, unique: true },
      fullName: { type: String, required: true, trim: true },
      email: { type: String, default: "", lowercase: true, trim: true },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      profilePhoto: { type: String, default: "" },
    },

    artisticProfile: {
      bio: { type: String, default: "" },
      artisticStyle: { type: [String], default: [] },
      yearsExperience: { type: String, default: "" },
      education: { type: String, default: "" },
      medium: { type: String, default: "" },
      awards: { type: String, default: "" },
      exhibitions: { type: String, default: "" },
    },

    portfolio: {
      images: { type: [String], default: [] },
      // Original voice answers from the WhatsApp application, for reviewers to listen to.
      voiceNotes: { type: [{ question: String, url: String }], default: [] },
    },

    // "web" (the website form) or "whatsapp" (the WhatsApp bot).
    source: { type: String, enum: ["web", "whatsapp"], default: "web" },

    identityVerification: {
      website: { type: String, default: "" },
      instagram: { type: String, default: "" },
      otherSocialMedia: { type: String, default: "" },
      ownershipDeclaration: { type: Boolean, default: false },
      identityConsent: { type: Boolean, default: false },
    },

    // Status is derived: approved -> "approved", reviewed but not approved -> "rejected", else "pending".
    verification: {
      approved: { type: Boolean, default: false },
      portfolioReviewed: { type: Boolean, default: false },
      submittedAt: { type: Date, default: Date.now },
      reviewedAt: { type: Date },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      rejectionReason: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

artistSchema.index({ "verification.portfolioReviewed": 1, createdAt: -1 });

artistSchema.methods.status = function () {
  if (this.verification?.approved) return "approved";
  if (this.verification?.portfolioReviewed) return "rejected";
  return "pending";
};

module.exports = mongoose.model("Artist", artistSchema);
