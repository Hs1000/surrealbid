const express = require("express");
const bcrypt = require("bcrypt");
const config = require("../lib/config");
const Artist = require("../models/Artist");
const Auction = require("../models/Auction");
const Report = require("../models/Report");
const User = require("../models/User");
const ContactMessage = require("../models/ContactMessage");
const { emails } = require("../lib/mailer");
const { signAdminToken, requireAdmin } = require("../lib/auth");
const { adminAuction } = require("../lib/serialize");
const { HttpError, sendOk, asyncHandler, cleanString } = require("../lib/http");

const router = express.Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const ok = req.body.password && (await bcrypt.compare(String(req.body.password), config.adminPasswordHash));
    if (!ok) throw new HttpError(401, "Incorrect password.");
    sendOk(res, { token: signAdminToken() });
  })
);

router.use(requireAdmin);

// ---------------- ARTISTS ----------------
router.get(
  "/artists",
  asyncHandler(async (req, res) => {
    const status = ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : "pending";
    const filter = {
      pending: { "verification.portfolioReviewed": { $ne: true } },
      approved: { "verification.approved": true },
      rejected: { "verification.portfolioReviewed": true, "verification.approved": { $ne: true } },
    }[status];
    const artists = await Artist.find(filter).sort({ createdAt: -1 });
    sendOk(res, { artists: artists.map((a) => ({ ...a.toObject(), status: a.status() })) });
  })
);

async function review(artistId, approved, reason = "") {
  const now = new Date();
  const artist = await Artist.findOneAndUpdate(
    { "basicInfo.artistId": artistId },
    {
      $set: {
        "verification.portfolioReviewed": true,
        "verification.approved": approved,
        "verification.reviewedAt": now,
        ...(approved ? { "verification.approvedAt": now, "verification.rejectionReason": "" } : { "verification.rejectedAt": now, "verification.rejectionReason": reason }),
      },
    },
    { new: true }
  );
  if (!artist) throw new HttpError(404, "Artist not found.");

  await User.findByIdAndUpdate(artist.userId, { $set: { role: approved ? "artist" : "buyer", isApproved: approved } });
  await (approved ? emails.artistApproved(artist) : emails.artistRejected(artist, reason));
  return artist;
}

router.post(
  "/artists/:artistId/approve",
  asyncHandler(async (req, res) => {
    const artist = await review(req.params.artistId, true);
    sendOk(res, { artist: { ...artist.toObject(), status: artist.status() } });
  })
);

router.post(
  "/artists/:artistId/reject",
  asyncHandler(async (req, res) => {
    const reason = cleanString(req.body.reason, 1000);
    if (!reason) throw new HttpError(400, "Please include a reason the artist will see.");
    const artist = await review(req.params.artistId, false, reason);
    sendOk(res, { artist: { ...artist.toObject(), status: artist.status() } });
  })
);

// ---------------- AUCTIONS ----------------
router.get(
  "/auctions",
  asyncHandler(async (req, res) => {
    const auctions = await Auction.find().sort({ submittedAt: -1 });
    sendOk(res, { auctions: auctions.map(adminAuction) });
  })
);

router.patch(
  "/auctions/:id",
  asyncHandler(async (req, res) => {
    // Admins can pause or resume; ending happens automatically at endTime.
    const status = req.body.status;
    if (!["active", "paused"].includes(status)) throw new HttpError(400, "Status must be active or paused.");

    const auction = await Auction.findOneAndUpdate(
      { id: req.params.id, status: { $ne: "ended" } },
      { $set: { status } },
      { new: true }
    );
    if (!auction) throw new HttpError(404, "Auction not found or already ended.");
    sendOk(res, { auction: adminAuction(auction) });
  })
);

router.delete(
  "/auctions/:id",
  asyncHandler(async (req, res) => {
    const auction = await Auction.findOne({ id: req.params.id });
    if (!auction) throw new HttpError(404, "Auction not found.");
    if (auction.payment?.status === "paid") throw new HttpError(409, "Paid auctions can't be deleted.");
    await auction.deleteOne();
    sendOk(res);
  })
);

// ---------------- REPORTS ----------------
router.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const reports = await Report.find().sort({ createdAt: -1 });
    sendOk(res, { reports });
  })
);

router.patch(
  "/reports/:id",
  asyncHandler(async (req, res) => {
    const status = req.body.status;
    if (!["pending", "investigating", "resolved", "dismissed"].includes(status)) throw new HttpError(400, "Invalid report status.");
    const report = await Report.findOneAndUpdate({ id: req.params.id }, { $set: { status } }, { new: true });
    if (!report) throw new HttpError(404, "Report not found.");
    sendOk(res, { report });
  })
);

// ---------------- MESSAGES ----------------
router.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200);
    sendOk(res, { messages });
  })
);

// ---------------- STATS ----------------
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const now = Date.now();
    const [total, verified, pending, rejected, auctionsTotal, auctionsLive, paid, reportsTotal, reportsPending, reportsResolved, reportsDismissed, users] =
      await Promise.all([
        Artist.countDocuments(),
        Artist.countDocuments({ "verification.approved": true }),
        Artist.countDocuments({ "verification.portfolioReviewed": { $ne: true } }),
        Artist.countDocuments({ "verification.portfolioReviewed": true, "verification.approved": { $ne: true } }),
        Auction.countDocuments(),
        Auction.countDocuments({ status: "active", startTime: { $lte: now }, endTime: { $gt: now } }),
        Auction.countDocuments({ "payment.status": "paid" }),
        Report.countDocuments(),
        Report.countDocuments({ status: "pending" }),
        Report.countDocuments({ status: "resolved" }),
        Report.countDocuments({ status: "dismissed" }),
        User.countDocuments(),
      ]);

    sendOk(res, {
      stats: {
        users: { total: users },
        artists: { total, verified, pending, rejected },
        auctions: { total: auctionsTotal, active: auctionsLive, paid },
        reports: { total: reportsTotal, pending: reportsPending, resolved: reportsResolved, dismissed: reportsDismissed },
      },
    });
  })
);

module.exports = router;
