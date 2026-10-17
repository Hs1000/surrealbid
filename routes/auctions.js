const express = require("express");
const Auction = require("../models/Auction");
const User = require("../models/User");
const { emails } = require("../lib/mailer");
const { randomId } = require("../lib/tokens");
const { resolveImage } = require("../lib/uploads");
const { requireUser, requireVerifiedUser, requireApprovedArtist } = require("../lib/auth");
const { publicAuction, ownerAuction, bidderAuction } = require("../lib/serialize");
const { HttpError, sendOk, sendCreated, asyncHandler, cleanString, cleanUrl } = require("../lib/http");
const { closeOverdueAuctions } = require("../lib/auctionCloser");

const router = express.Router();

// Make sure anything past its end time is closed before we show or sell it.
router.get(["/", "/mine", "/bidding", "/:id"], asyncHandler(async (req, res, next) => {
  await closeOverdueAuctions();
  next();
}));

const MINUTE = 60 * 1000;
const MIN_STARTING_BID = 100;
const MAX_STARTING_BID = 10_000_000;
const MAX_BID = 100_000_000;
const MAX_DURATION_MINUTES = 14 * 24 * 60;
const MAX_SCHEDULE_AHEAD = 90 * 24 * 60 * MINUTE;

// Public catalogue: live, upcoming and ended auctions. Paused and legacy unverified ones stay hidden.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const auctions = await Auction.find({ status: { $in: ["active", "ended"] } }).sort({ submittedAt: -1 });
    sendOk(res, { auctions: auctions.map(publicAuction) });
  })
);

router.get(
  "/mine",
  requireUser,
  asyncHandler(async (req, res) => {
    const auctions = await Auction.find({ userId: req.user._id }).sort({ submittedAt: -1 });
    sendOk(res, { auctions: auctions.map(ownerAuction) });
  })
);

router.get(
  "/bidding",
  requireUser,
  asyncHandler(async (req, res) => {
    const auctions = await Auction.find({ "bids.userId": req.user._id }).sort({ endTime: -1 });
    sendOk(res, { auctions: auctions.map((a) => bidderAuction(a, req.user._id)) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const auction = await Auction.findOne({ id: req.params.id, status: { $in: ["active", "ended"] } });
    if (!auction) throw new HttpError(404, "Auction not found.");
    sendOk(res, { auction: publicAuction(auction) });
  })
);

router.post(
  "/",
  requireApprovedArtist,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const now = Date.now();

    const title = cleanString(body.title, 100);
    const description = cleanString(body.description, 2000);
    const startingBid = Math.floor(Number(body.startingBidINR));
    const duration = Math.floor(Number(body.durationMinutes));
    const startTime = body.startTime ? Math.floor(Number(body.startTime)) : now;

    if (title.length < 3) throw new HttpError(400, "Title must be at least 3 characters.");
    if (!Number.isFinite(startingBid) || startingBid < MIN_STARTING_BID || startingBid > MAX_STARTING_BID) {
      throw new HttpError(400, `Starting bid must be between ₹${MIN_STARTING_BID} and ₹${MAX_STARTING_BID.toLocaleString("en-IN")}.`);
    }
    if (!Number.isFinite(duration) || duration < 1 || duration > MAX_DURATION_MINUTES) {
      throw new HttpError(400, "Auction length must be between 1 minute and 14 days.");
    }
    if (!Number.isFinite(startTime) || startTime < now - MINUTE || startTime > now + MAX_SCHEDULE_AHEAD) {
      throw new HttpError(400, "Start time must be now or within the next 90 days.");
    }

    let imageUrl = "";
    if (body.imageData) {
      imageUrl = await resolveImage(body.imageData, { label: "Artwork image" });
    } else if (body.imageUrl) {
      imageUrl = cleanUrl(body.imageUrl);
      if (!imageUrl) throw new HttpError(400, "Image URL must start with http:// or https://");
    }

    const auction = await Auction.create({
      id: randomId("auction"),
      title,
      description,
      artist: req.artist.basicInfo.fullName,
      artistId: req.artist.basicInfo.artistId,
      userId: req.user._id,
      artistEmail: req.user.email,
      startingBidINR: startingBid,
      currentBidINR: startingBid,
      startTime: Math.max(startTime, now),
      endTime: Math.max(startTime, now) + duration * MINUTE,
      status: "active",
      imageUrl,
      submittedAt: now,
    });

    sendCreated(res, { auction: ownerAuction(auction) });
  })
);

router.post(
  "/:id/bids",
  requireVerifiedUser,
  asyncHandler(async (req, res) => {
    const amount = Math.floor(Number(req.body.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > MAX_BID) throw new HttpError(400, "Enter a valid bid amount.");

    const now = Date.now();
    const user = req.user;
    const before = await Auction.findOne({ id: req.params.id });
    if (!before) throw new HttpError(404, "Auction not found.");

    const bid = {
      id: randomId("bid"),
      amount,
      userId: user._id,
      bidderName: user.name,
      timestamp: now,
    };

    // One atomic update: it only applies if the auction is live, the bidder isn't the artist,
    // and the amount still beats the current bid at the moment of writing.
    const auction = await Auction.findOneAndUpdate(
      {
        id: req.params.id,
        status: "active",
        startTime: { $lte: now },
        endTime: { $gt: now },
        currentBidINR: { $lt: amount },
        userId: { $ne: user._id },
      },
      { $set: { currentBidINR: amount }, $push: { bids: bid } },
      { new: true }
    );

    if (!auction) {
      if (before.userId && String(before.userId) === String(user._id)) throw new HttpError(403, "You can't bid on your own artwork.");
      if (before.status !== "active" || before.endTime <= now) throw new HttpError(409, "This auction has ended.");
      if (before.startTime > now) throw new HttpError(409, "This auction hasn't started yet.");
      const latest = await Auction.findOne({ id: req.params.id }, { currentBidINR: 1 });
      throw new HttpError(409, `Your bid must be higher than ₹${Number(latest.currentBidINR).toLocaleString("en-IN")}.`);
    }

    // Let the previous leader know, unless they just outbid themselves.
    const previousTop = (before.bids || []).reduce((top, b) => (!top || b.amount > top.amount ? b : top), null);
    if (previousTop?.userId && String(previousTop.userId) !== String(user._id)) {
      User.findById(previousTop.userId)
        .then((previous) => previous && emails.outbid(previous.email, auction, amount))
        .catch((err) => console.error("[bids] outbid email failed:", err.message));
    }

    sendCreated(res, { bid: { id: bid.id, amount, bidderName: bid.bidderName, timestamp: now }, auction: publicAuction(auction) });
  })
);

module.exports = router;
