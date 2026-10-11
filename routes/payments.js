const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const config = require("../lib/config");
const Auction = require("../models/Auction");
const User = require("../models/User");
const { emails } = require("../lib/mailer");
const { safeEqual } = require("../lib/tokens");
const { requireUser } = require("../lib/auth");
const { HttpError, sendOk, asyncHandler, cleanString } = require("../lib/http");

const router = express.Router();

const razorpay = config.razorpay.keyId && config.razorpay.keySecret
  ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
  : null;

function requirePayments() {
  if (!razorpay) throw new HttpError(503, "Payments aren't set up yet. Please contact us to complete your purchase.");
}

async function findWonAuction(auctionId, user) {
  const auction = await Auction.findOne({ id: cleanString(auctionId, 100) });
  if (!auction) throw new HttpError(404, "Auction not found.");
  if (auction.status !== "ended" || !auction.winner?.userId) throw new HttpError(409, "This auction hasn't closed yet.");
  if (String(auction.winner.userId) !== String(user._id)) throw new HttpError(403, "Only the winning bidder can pay for this artwork.");
  return auction;
}

async function markPaid(auction, paymentId) {
  const updated = await Auction.findOneAndUpdate(
    { _id: auction._id, "payment.status": { $ne: "paid" } },
    { $set: { "payment.status": "paid", "payment.paymentId": paymentId, "payment.paidAt": new Date() } },
    { new: true }
  );
  if (!updated) return auction; // already marked paid (webhook and browser both reported it)

  const [buyer, artist] = await Promise.all([
    User.findById(updated.winner.userId),
    updated.userId ? User.findById(updated.userId) : null,
  ]);
  emails
    .paymentReceived(buyer?.email, artist?.email || updated.artistEmail, updated)
    .catch((err) => console.error("[payments] email failed:", err.message));
  return updated;
}

router.get("/config", (req, res) => sendOk(res, { enabled: !!razorpay }));

// Checkout summary for the winner.
router.get(
  "/auction/:id",
  requireUser,
  asyncHandler(async (req, res) => {
    const auction = await findWonAuction(req.params.id, req.user);
    sendOk(res, {
      auction: { id: auction.id, title: auction.title, artist: auction.artist, imageUrl: auction.imageUrl || auction.imageDataUrl, amountINR: auction.winner.amount },
      payment: { status: auction.payment?.status || "none", paymentId: auction.payment?.paymentId || "" },
      enabled: !!razorpay,
    });
  })
);

router.post(
  "/order",
  requireUser,
  asyncHandler(async (req, res) => {
    requirePayments();
    const auction = await findWonAuction(req.body.auctionId, req.user);
    if (auction.payment?.status === "paid") throw new HttpError(409, "This artwork has already been paid for.");

    const shipping = {
      name: cleanString(req.body.name, 100),
      phone: cleanString(req.body.phone, 20),
      address: cleanString(req.body.address, 500),
    };
    if (shipping.name.length < 2) throw new HttpError(400, "Please enter the recipient's name.");
    if (!/^[+]?[0-9\s\-()]{10,20}$/.test(shipping.phone)) throw new HttpError(400, "Please enter a valid phone number.");
    if (shipping.address.length < 10) throw new HttpError(400, "Please enter a complete shipping address.");

    // The amount comes from the closed auction, never from the browser.
    const amountINR = auction.winner.amount;
    const order = await razorpay.orders.create({
      amount: amountINR * 100,
      currency: "INR",
      receipt: auction.id.slice(0, 40),
      notes: { auctionId: auction.id, title: auction.title.slice(0, 200) },
    });

    auction.set({ "payment.status": "pending", "payment.orderId": order.id, "payment.amountINR": amountINR, "payment.shipping": shipping });
    await auction.save();

    sendOk(res, {
      keyId: config.razorpay.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      title: auction.title,
      artist: auction.artist,
      prefill: { name: req.user.name, email: req.user.email, contact: shipping.phone.replace(/\s/g, "") },
    });
  })
);

router.post(
  "/verify",
  requireUser,
  asyncHandler(async (req, res) => {
    requirePayments();
    const auction = await findWonAuction(req.body.auctionId, req.user);
    const orderId = cleanString(req.body.razorpay_order_id, 100);
    const paymentId = cleanString(req.body.razorpay_payment_id, 100);
    const signature = cleanString(req.body.razorpay_signature, 200);

    if (!orderId || orderId !== auction.payment?.orderId) throw new HttpError(400, "Payment doesn't match this order.");

    const expected = crypto.createHmac("sha256", config.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    if (!safeEqual(expected, signature)) throw new HttpError(400, "We couldn't verify this payment. If you were charged, contact us with your payment ID.");

    const updated = await markPaid(auction, paymentId);
    sendOk(res, { payment: { status: "paid", paymentId: updated.payment.paymentId, amountINR: updated.payment.amountINR } });
  })
);

// Razorpay webhook (configure in the Razorpay dashboard with RAZORPAY_WEBHOOK_SECRET).
// Mounted with a raw body parser in server.js so the signature can be checked.
async function webhook(req, res) {
  if (!config.razorpay.webhookSecret) return res.status(503).end();

  const signature = String(req.headers["x-razorpay-signature"] || "");
  const expected = crypto.createHmac("sha256", config.razorpay.webhookSecret).update(req.body).digest("hex");
  if (!safeEqual(expected, signature)) return res.status(400).end();

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).end();
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const auction = payment?.order_id ? await Auction.findOne({ "payment.orderId": payment.order_id }) : null;
    if (auction && payment.amount === auction.payment.amountINR * 100) {
      await markPaid(auction, payment.id);
    }
  }
  res.json({ ok: true });
}

module.exports = { router, webhook: asyncHandler(webhook) };
