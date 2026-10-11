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
};

const WEAK_SECRETS = ["supersecretkey", "your-secret-key-change-in-production", "change-me"];
if (config.jwtSecret.length < 32 || WEAK_SECRETS.includes(config.jwtSecret)) {
  const message = "JWT_SECRET must be a random string of at least 32 characters.";
  if (isProduction) throw new Error(message);
  console.warn(`[config] ${message} Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
}

if (isProduction && !config.smtp.host) {
  throw new Error("SMTP_HOST is required in production so verification and auction emails can be sent.");
}

if (isProduction && !process.env.APP_URL) {
  throw new Error("APP_URL is required in production (used in email links).");
}

module.exports = config;
