const mongoose = require("mongoose");
const Auction = require("../models/Auction");
const User = require("../models/User");
const { emails } = require("./mailer");

const INTERVAL_MS = 15 * 1000;

function topBid(bids = []) {
  return bids.reduce((top, bid) => (!top || bid.amount > top.amount ? bid : top), null);
}

/** Closes every active auction past its end time, records the winner, and sends the emails. */
async function closeEndedAuctions() {
  if (mongoose.connection.readyState !== 1) return;

  const due = await Auction.find({ status: "active", endTime: { $lte: Date.now() } }, { id: 1, bids: 1 });

  for (const candidate of due) {
    const top = topBid(candidate.bids);
    const winner = top ? { userId: top.userId, name: top.bidderName, amount: top.amount } : undefined;

    // The status condition makes this safe if two server instances run the job at once.
    const auction = await Auction.findOneAndUpdate(
      { _id: candidate._id, status: "active" },
      { $set: { status: "ended", closedAt: new Date(), ...(winner ? { winner } : {}) } },
      { new: true }
    );
    if (!auction) continue;

    try {
      const [winnerUser, artistUser] = await Promise.all([
        winner?.userId ? User.findById(winner.userId) : null,
        auction.userId ? User.findById(auction.userId) : null,
      ]);
      if (winnerUser) await emails.auctionWon(winnerUser.email, auction);
      await emails.auctionEndedForArtist(artistUser?.email || auction.artistEmail, auction);
    } catch (err) {
      console.error(`[closer] notification failed for ${auction.id}:`, err.message);
    }
  }
}

function startAuctionCloser() {
  const run = () => closeEndedAuctions().catch((err) => console.error("[closer]", err.message));
  run();
  return setInterval(run, INTERVAL_MS);
}

module.exports = { startAuctionCloser, closeEndedAuctions };
