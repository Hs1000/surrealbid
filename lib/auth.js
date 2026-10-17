const jwt = require("jsonwebtoken");
const config = require("./config");
const User = require("../models/User");
const Artist = require("../models/Artist");
const { HttpError, asyncHandler } = require("./http");

function signUserToken(user) {
  return jwt.sign({ sub: String(user._id), v: user.tokenVersion || 0 }, config.jwtSecret, { expiresIn: "7d" });
}

function signAdminToken() {
  return jwt.sign({ admin: true }, config.jwtSecret, { expiresIn: "8h" });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function loadUser(req) {
  const token = readToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
  if (!payload.sub) return null;

  const user = await User.findById(payload.sub);
  if (!user || (user.tokenVersion || 0) !== payload.v) {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
  return user;
}

const optionalUser = asyncHandler(async (req, res, next) => {
  try {
    req.user = await loadUser(req);
  } catch {
    req.user = null;
  }
  next();
});

const requireUser = asyncHandler(async (req, res, next) => {
  req.user = await loadUser(req);
  if (!req.user) throw new HttpError(401, "Please sign in to continue.");
  next();
});

const requireVerifiedUser = [
  requireUser,
  (req, res, next) => {
    if (!req.user.isVerified()) {
      return next(new HttpError(403, "Please confirm your email address first. Check your inbox for the link."));
    }
    next();
  },
];

const requireApprovedArtist = [
  ...requireVerifiedUser,
  asyncHandler(async (req, res, next) => {
    const artist = await Artist.findOne({ userId: req.user._id });
    if (!artist) throw new HttpError(403, "Apply as an artist before listing artwork.");
    if (!artist.verification.approved) throw new HttpError(403, "Your artist application hasn't been approved yet.");
    req.artist = artist;
    next();
  }),
];

function requireAdmin(req, res, next) {
  const token = readToken(req);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (!payload.admin) throw new Error("not admin");
    next();
  } catch {
    next(new HttpError(401, "Admin sign-in required."));
  }
}

module.exports = { signUserToken, signAdminToken, optionalUser, requireUser, requireVerifiedUser, requireApprovedArtist, requireAdmin };
