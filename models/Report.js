const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    auctionId: { type: String, required: true, index: true },
    reporterEmail: { type: String, required: true, trim: true, lowercase: true },
    reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    evidence: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
