const mongoose = require("mongoose");

// Where a phone number is in the WhatsApp application conversation, so it can resume later.
const whatsAppSessionSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    profileName: { type: String, default: "" },
    lang: { type: String, enum: ["en", "hi"], default: "en" },
    step: { type: String, default: "start" },
    answers: {
      name: { type: String, default: "" },
      city: { type: String, default: "" },
      medium: { type: String, default: "" },
      styles: { type: [String], default: [] },
      experience: { type: String, default: "" },
      story: { type: String, default: "" },
    },
    photos: { type: [String], default: [] },
    voiceNotes: { type: [{ question: String, url: String }], default: [] },
    // Bumped on every message, so stale half-finished sessions can be cleaned up.
    lastMessageAt: { type: Date, default: Date.now },
    // Message ids already handled (Meta can deliver the same webhook more than once).
    seen: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsAppSession", whatsAppSessionSchema);
