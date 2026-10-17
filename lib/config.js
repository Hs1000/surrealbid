require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. See .env.example.`);
  }
  return value;
}

const PORT = Number(process.env.PORT || 3000);

const config = {
  isProduction,
  port: PORT,
  appUrl: (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, ""),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/surrealbid",
  jwtSecret: required("JWT_SECRET"),
  adminPasswordHash: required("ADMIN_PASSWORD_HASH"),
  adminEmail: process.env.ADMIN_EMAIL || "",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  trustProxy: process.env.TRUST_PROXY || false,
  uploadDir: process.env.UPLOAD_DIR || require("path").join(__dirname, "..", "uploads"),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "SurrealBid <no-reply@surrealbid.local>",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },
  sentryDsn: process.env.SENTRY_DSN || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  // cloudinary://API_KEY:API_SECRET@CLOUD_NAME (from the Cloudinary dashboard)
  cloudinaryUrl: process.env.CLOUDINARY_URL || "",
  whatsapp: {
    // From Meta → WhatsApp → API Setup. Without a token (development), outgoing messages are printed.
    token: process.env.WHATSAPP_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    // The number people message, digits only (e.g. 919876543210). Used for wa.me links.
    displayNumber: (process.env.WHATSAPP_DISPLAY_NUMBER || "").replace(/\D/g, ""),
    // Any string you choose; enter the same value in Meta when registering the webhook.
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    // Meta app secret, used to check webhook signatures (required in production).
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
    graphUrl: (process.env.WHATSAPP_GRAPH_URL || "https://graph.facebook.com").replace(/\/$/, ""),
  },
};

const WEAK_SECRETS = ["supersecretkey", "your-secret-key-change-in-production", "change-me"];
if (config.jwtSecret.length < 32 || WEAK_SECRETS.includes(config.jwtSecret)) {
  const message = "JWT_SECRET must be a random string of at least 32 characters.";
  if (isProduction) throw new Error(message);
  console.warn(`[config] ${message} Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
}

if (isProduction && !config.smtp.host && !config.brevoApiKey) {
  throw new Error("Set BREVO_API_KEY (or SMTP_HOST) in production so verification and auction emails can be sent.");
}

if (isProduction && config.whatsapp.token && !config.whatsapp.appSecret) {
  throw new Error("WHATSAPP_APP_SECRET is required in production when WhatsApp is enabled (verifies webhook calls).");
}

if (isProduction && !process.env.APP_URL) {
  throw new Error("APP_URL is required in production (used in email links).");
}

module.exports = config;
