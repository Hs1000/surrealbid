const express = require("express");
const config = require("../lib/config");
const WhatsAppLogin = require("../models/WhatsAppLogin");
const User = require("../models/User");
const Artist = require("../models/Artist");
const { verifySignature, chatLink } = require("../lib/whatsapp");
const { handleIncoming } = require("../lib/whatsappBot");
const { optionalUser, signUserToken } = require("../lib/auth");
const { publicUser, artistSummary } = require("../lib/serialize");
const { randomToken, hashToken } = require("../lib/tokens");
const { HttpError, sendOk, asyncHandler, cleanString } = require("../lib/http");
const { captureError } = require("../lib/monitoring");

const router = express.Router();
const LOGIN_TTL_MS = 10 * 60 * 1000;

// ---------------- WEBHOOK (called by Meta) ----------------
// Meta checks the webhook URL once with a GET request when you register it.
router.get("/webhook", (req, res) => {
  const ok = req.query["hub.mode"] === "subscribe" && config.whatsapp.verifyToken && req.query["hub.verify_token"] === config.whatsapp.verifyToken;
  if (!ok) return res.sendStatus(403);
  res.status(200).send(String(req.query["hub.challenge"] || ""));
});

// Mounted with express.raw() in server.js so the signature can be checked against the exact bytes.
async function receiveWebhook(req, res) {
  if (!verifySignature(req.body, req.headers["x-hub-signature-256"])) return res.sendStatus(401);

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.sendStatus(400);
  }

  // Acknowledge straight away (Meta retries slow webhooks), then process.
  res.sendStatus(200);

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const names = Object.fromEntries((value.contacts || []).map((c) => [c.wa_id, c.profile?.name || ""]));
      for (const msg of value.messages || []) {
        const message = {
          id: msg.id,
          type: msg.type,
          text: msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || "",
          mediaId: msg.image?.id || msg.audio?.id || "",
          mime: msg.image?.mime_type || msg.audio?.mime_type || "",
        };
        if (msg.type === "button" || msg.type === "interactive") message.type = "text";
        try {
          await handleIncoming({ phone: String(msg.from).replace(/\D/g, ""), profileName: cleanString(names[msg.from], 100), message });
        } catch (err) {
          captureError(err, { route: "whatsapp webhook" });
        }
      }
    }
  }
}

// ---------------- "CONTINUE WITH WHATSAPP" (website) ----------------
router.get("/config", (req, res) => sendOk(res, { enabled: !!config.whatsapp.displayNumber, number: config.whatsapp.displayNumber || null }));

// Starts a sign-in (or, when signed in with ?link=1, links WhatsApp to the current account).
router.post(
  "/login/start",
  optionalUser,
  asyncHandler(async (req, res) => {
    if (!config.whatsapp.displayNumber) throw new HttpError(503, "WhatsApp sign-in isn't set up yet.");
    if (req.body.link && !req.user) throw new HttpError(401, "Please sign in first.");

    const requestId = randomToken();
    let code;
    for (let i = 0; i < 5 && !code; i++) {
      const candidate = String(Math.floor(100000 + Math.random() * 900000));
      if (!(await WhatsAppLogin.exists({ code: candidate, status: "pending" }))) code = candidate;
    }
    if (!code) throw new HttpError(503, "Please try again.");

    await WhatsAppLogin.create({
      requestIdHash: hashToken(requestId),
      code,
      linkUserId: req.body.link ? req.user._id : undefined,
      expiresAt: new Date(Date.now() + LOGIN_TTL_MS),
    });

    const message = `LOGIN ${code}`;
    sendOk(res, { requestId, code, message, number: config.whatsapp.displayNumber, link: chatLink(message), expiresInSeconds: LOGIN_TTL_MS / 1000 });
  })
);

// The browser polls this until the code has been sent from WhatsApp.
router.post(
  "/login/status",
  asyncHandler(async (req, res) => {
    const requestId = cleanString(req.body.requestId, 100);
    const login = requestId ? await WhatsAppLogin.findOne({ requestIdHash: hashToken(requestId) }) : null;
    if (!login || login.status === "used") return sendOk(res, { status: "expired" });
    if (login.status === "pending") return sendOk(res, { status: "pending" });
    if (login.error === "phone_taken") return sendOk(res, { status: "error", error: "That WhatsApp number is already linked to another account." });

    // Single use: hand out the session once.
    const claimed = await WhatsAppLogin.findOneAndUpdate({ _id: login._id, status: "verified" }, { $set: { status: "used" } });
    if (!claimed) return sendOk(res, { status: "expired" });

    const user = await User.findById(login.userId);
    if (!user) return sendOk(res, { status: "expired" });
    const artist = await Artist.findOne({ userId: user._id });
    sendOk(res, { status: "verified", token: signUserToken(user), user: publicUser(user), artist: artistSummary(artist) });
  })
);

module.exports = { router, receiveWebhook: asyncHandler(receiveWebhook) };
