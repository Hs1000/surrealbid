const express = require("express");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const config = require("../lib/config");
const User = require("../models/User");
const Artist = require("../models/Artist");
const { emails } = require("../lib/mailer");
const { randomToken, hashToken } = require("../lib/tokens");
const { signUserToken, requireUser } = require("../lib/auth");
const { publicUser, artistSummary } = require("../lib/serialize");
const { HttpError, sendOk, sendCreated, asyncHandler, cleanString, cleanEmail } = require("../lib/http");

const router = express.Router();

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function checkPassword(password) {
  const value = String(password || "");
  if (value.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
  if (value.length > 200) throw new HttpError(400, "Password is too long.");
  return value;
}

async function issueEmailVerification(user) {
  const token = randomToken();
  user.emailVerifyTokenHash = hashToken(token);
  user.emailVerifyExpires = new Date(Date.now() + DAY);
  await user.save();
  await emails.verifyEmail(user, token);
}

async function sessionPayload(user) {
  const artist = await Artist.findOne({ userId: user._id });
  return { user: publicUser(user), artist: artistSummary(artist) };
}

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const name = cleanString(req.body.name, 80);
    const email = cleanEmail(req.body.email);
    const password = checkPassword(req.body.password);

    if (name.length < 2) throw new HttpError(400, "Please enter your name.");
    if (!email) throw new HttpError(400, "Please enter a valid email address.");
    if (await User.exists({ email })) throw new HttpError(409, "An account with this email already exists. Try signing in.");

    // Role is never taken from the request: everyone starts as a buyer.
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: "buyer" });
    await issueEmailVerification(user);

    sendCreated(res, { token: signUserToken(user), ...(await sessionPayload(user)) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body.email);
    const user = email ? await User.findOne({ email }) : null;
    const ok = user && user.password && (await bcrypt.compare(String(req.body.password || ""), user.password));
    if (!ok) throw new HttpError(401, "Incorrect email or password.");

    sendOk(res, { token: signUserToken(user), ...(await sessionPayload(user)) });
  })
);

// ---------------- GOOGLE ----------------
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

router.get("/google/config", (req, res) => sendOk(res, { clientId: config.googleClientId || null }));

router.post(
  "/google",
  asyncHandler(async (req, res) => {
    if (!googleClient) throw new HttpError(503, "Google sign-in isn't set up.");

    let payload;
    try {
      // Checks Google's signature, expiry, and that the token was issued for our client ID.
      const ticket = await googleClient.verifyIdToken({ idToken: cleanString(req.body.credential, 5000), audience: config.googleClientId });
      payload = ticket.getPayload();
    } catch {
      throw new HttpError(401, "Google sign-in failed. Please try again.");
    }

    const email = cleanEmail(payload.email);
    if (!email || payload.email_verified !== true) throw new HttpError(401, "Your Google account email isn't verified.");

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
    if (user) {
      // Google has verified this email, so it's safe to link it to an existing account.
      if (!user.googleId) user.googleId = payload.sub;
      user.emailVerified = true;
      await user.save();
    } else {
      user = await User.create({
        name: cleanString(payload.name, 80) || email.split("@")[0],
        email,
        googleId: payload.sub,
        role: "buyer",
        emailVerified: true,
      });
    }

    sendOk(res, { token: signUserToken(user), ...(await sessionPayload(user)) });
  })
);

router.get(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    sendOk(res, await sessionPayload(req.user));
  })
);

router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const token = cleanString(req.body.token, 100);
    const user = token
      ? await User.findOne({ emailVerifyTokenHash: hashToken(token), emailVerifyExpires: { $gt: new Date() } })
      : null;
    if (!user) throw new HttpError(400, "This confirmation link is invalid or has expired.");

    user.emailVerified = true;
    user.emailVerifyTokenHash = "";
    user.emailVerifyExpires = undefined;
    await user.save();

    sendOk(res, { user: publicUser(user) });
  })
);

router.post(
  "/resend-verification",
  requireUser,
  asyncHandler(async (req, res) => {
    if (!req.user.emailVerified) await issueEmailVerification(req.user);
    sendOk(res);
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body.email);
    const user = email ? await User.findOne({ email }) : null;

    if (user) {
      const token = randomToken();
      user.passwordResetTokenHash = hashToken(token);
      user.passwordResetExpires = new Date(Date.now() + HOUR);
      await user.save();
      await emails.resetPassword(user, token);
    }

    // Same response either way so this can't be used to find out who has an account.
    sendOk(res, { message: "If an account exists for that email, a reset link is on its way." });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const token = cleanString(req.body.token, 100);
    const password = checkPassword(req.body.password);
    const user = token
      ? await User.findOne({ passwordResetTokenHash: hashToken(token), passwordResetExpires: { $gt: new Date() } })
      : null;
    if (!user) throw new HttpError(400, "This reset link is invalid or has expired.");

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = "";
    user.passwordResetExpires = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    // Opening the link proves they control the inbox.
    user.emailVerified = true;
    await user.save();

    sendOk(res, { token: signUserToken(user), ...(await sessionPayload(user)) });
  })
);

module.exports = router;
