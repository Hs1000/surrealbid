const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bidderName: { type: String, default: "Anonymous", trim: true },
    // Legacy field from bids placed before accounts existed; never sent to the browser.
    bidderEmail: { type: String, default: "", trim: true, lowercase: true },
    timestamp: { type: Number, default: Date.now },
  },
  { _id: false }
);

const auctionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    artist: { type: String, required: true, trim: true },
    artistId: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    artistEmail: { type: String, default: "", trim: true, lowercase: true },

    startingBidINR: { type: Number, min: 0 },
    currentBidINR: { type: Number, required: true, min: 0 },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },

    // "pending"/"pending_verification" only exist on legacy records.
    status: {
      type: String,
      enum: ["pending", "pending_verification", "active", "paused", "ended"],
      default: "active",
    },

    imageUrl: { type: String, default: "" },
    // Legacy base64 image; new auctions store files under /uploads.
    imageDataUrl: { type: String, default: "" },
    submittedAt: { type: Number, default: Date.now },

    bids: { type: [bidSchema], default: [] },

    closedAt: { type: Date },
    winner: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      amount: { type: Number },
    },

    payment: {
      status: { type: String, enum: ["none", "pending", "paid"], default: "none" },
      orderId: { type: String, default: "" },
      paymentId: { type: String, default: "" },
      amountINR: { type: Number, default: 0 },
      paidAt: { type: Date },
      shipping: {
        name: { type: String, default: "" },
        phone: { type: String, default: "" },
        address: { type: String, default: "" },
      },
    },
  },
  { timestamps: true }
);

auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ userId: 1 });
auctionSchema.index({ "bids.userId": 1 });
auctionSchema.index({ "payment.orderId": 1 });

module.exports = mongoose.model("Auction", auctionSchema);
