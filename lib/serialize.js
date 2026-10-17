// Shapes database records for the browser. Public views never include emails,
// user ids of bidders, payment details, or shipping addresses.

function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email || "",
    phone: user.phone || "",
    role: user.role,
    isApproved: user.isApproved,
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneVerified,
    // Confirmed through email or WhatsApp: allowed to bid and apply.
    verified: !!(user.emailVerified || user.phoneVerified),
  };
}

// Public bidder names are shortened to "First L." so full names stay private.
function maskName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Anonymous";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function imageOf(auction) {
  return auction.imageUrl || auction.imageDataUrl || "";
}

function publicAuction(auction) {
  const a = auction.toObject ? auction.toObject() : auction;
  return {
    id: a.id,
    title: a.title,
    description: a.description || "",
    artist: a.artist,
    imageUrl: imageOf(a),
    startingBidINR: a.startingBidINR ?? a.currentBidINR,
    currentBidINR: a.currentBidINR,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    submittedAt: a.submittedAt,
    bids: (a.bids || []).map((bid) => ({
      id: bid.id,
      amount: bid.amount,
      bidderName: maskName(bid.bidderName),
      timestamp: bid.timestamp,
    })),
    winner: a.winner?.amount ? { name: maskName(a.winner.name), amount: a.winner.amount } : null,
    sold: a.payment?.status === "paid",
  };
}

// The artist sees their own auction in full, including the buyer's shipping details once paid.
function ownerAuction(auction) {
  const a = auction.toObject ? auction.toObject() : auction;
  return {
    ...publicAuction(a),
    payment: {
      status: a.payment?.status || "none",
      amountINR: a.payment?.amountINR || 0,
      paidAt: a.payment?.paidAt || null,
      shipping: a.payment?.status === "paid" ? a.payment.shipping : null,
    },
  };
}

// A bidder's view: their own standing on an auction they bid on.
function bidderAuction(auction, userId) {
  const a = auction.toObject ? auction.toObject() : auction;
  const mine = (a.bids || []).filter((bid) => String(bid.userId) === String(userId));
  const myHighest = mine.reduce((max, bid) => Math.max(max, bid.amount), 0);
  const won = !!a.winner?.userId && String(a.winner.userId) === String(userId);
  const topBid = (a.bids || []).reduce((top, bid) => (!top || bid.amount > top.amount ? bid : top), null);
  return {
    ...publicAuction(a),
    myHighestBid: myHighest,
    myBidCount: mine.length,
    leading: !!topBid && String(topBid.userId) === String(userId),
    won,
    paymentStatus: won ? a.payment?.status || "none" : undefined,
  };
}

function adminAuction(auction) {
  const a = auction.toObject ? auction.toObject() : auction;
  return {
    ...ownerAuction(a),
    artistId: a.artistId,
    userId: a.userId ? String(a.userId) : null,
    createdAt: a.createdAt,
    payment: { ...(a.payment || {}) },
  };
}

function artistSummary(artist) {
  if (!artist) return null;
  return {
    artistId: artist.basicInfo.artistId,
    fullName: artist.basicInfo.fullName,
    status: artist.status(),
    rejectionReason: artist.verification.rejectionReason || "",
    submittedAt: artist.verification.submittedAt,
  };
}

module.exports = { publicUser, publicAuction, ownerAuction, bidderAuction, adminAuction, artistSummary };
