const mongoose = require("mongoose");

// A pending "Continue with WhatsApp" sign-in. The browser holds `requestId` (secret) and the user
// sends `code` to our WhatsApp number, which proves they own their phone.
const whatsAppLoginSchema = new mongoose.Schema({
  requestIdHash: { type: String, required: true, unique: true },
  code: { type: String, required: true, index: true },
  status: { type: String, enum: ["pending", "verified", "used"], default: "pending" },
  // Set when a signed-in user is linking WhatsApp to their existing account.
  linkUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  error: { type: String, default: "" },
  // MongoDB deletes the document automatically after this time.
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

module.exports = mongoose.model("WhatsAppLogin", whatsAppLoginSchema);
