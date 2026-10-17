// WhatsApp Cloud API client: send messages, download media, verify webhook signatures.
const crypto = require("crypto");
const config = require("./config");
const { safeEqual } = require("./tokens");

const wa = config.whatsapp;
const enabled = () => !!(wa.token && wa.phoneNumberId);

async function graph(path, options = {}) {
  const response = await fetch(`${wa.graphUrl}/${wa.apiVersion}/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${wa.token}`, ...(options.headers || {}) },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`WhatsApp API ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response;
}

/** Sends a plain text message. Free-form text only works within 24h of the user's last message. */
async function sendText(to, body) {
  if (!enabled()) {
    console.log(`[whatsapp:dev] To ${to}:\n${body}\n`);
    return;
  }
  try {
    await graph(`${wa.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4096), preview_url: false } }),
    });
  } catch (err) {
    // Message failures shouldn't break the webhook (e.g. outside the 24h window).
    console.error(`[whatsapp] send to ${to} failed:`, err.message);
  }
}

/** Downloads a media file sent by a user. Returns { buffer, mime }. */
async function downloadMedia(mediaId) {
  const meta = await (await graph(encodeURIComponent(mediaId))).json();
  const file = await fetch(meta.url, { headers: { Authorization: `Bearer ${wa.token}` } });
  if (!file.ok) throw new Error(`WhatsApp media download ${file.status}`);
  return { buffer: Buffer.from(await file.arrayBuffer()), mime: String(meta.mime_type || "").split(";")[0] };
}

/** Meta signs each webhook body with the app secret (X-Hub-Signature-256: sha256=<hex>). */
function verifySignature(rawBody, header) {
  if (!wa.appSecret) return !config.isProduction; // allowed only in development
  const expected = `sha256=${crypto.createHmac("sha256", wa.appSecret).update(rawBody).digest("hex")}`;
  return safeEqual(expected, String(header || ""));
}

/** wa.me link that opens a chat with our number, optionally with a prefilled message. */
function chatLink(text = "") {
  if (!wa.displayNumber) return "";
  return `https://wa.me/${wa.displayNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

module.exports = { enabled, sendText, downloadMedia, verifySignature, chatLink };
