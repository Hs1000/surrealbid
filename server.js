const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const config = require("./lib/config");
const { captureError } = require("./lib/monitoring");
const { HttpError, sendOk } = require("./lib/http");
const { startAuctionCloser } = require("./lib/auctionCloser");

const authRoutes = require("./routes/auth");
const artistRoutes = require("./routes/artists");
const auctionRoutes = require("./routes/auctions");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");
const payments = require("./routes/payments");

const app = express();
app.disable("x-powered-by");
if (config.trustProxy) app.set("trust proxy", config.trustProxy);

// ---------------- SECURITY HEADERS ----------------
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://checkout.razorpay.com", "https://accounts.google.com/gsi/client"],
        // The markup uses inline onclick handlers.
        "script-src-attr": ["'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": ["'self'", "https://accounts.google.com/gsi/", "https://api.exchangerate-api.com", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
        "frame-src": ["https://api.razorpay.com", "https://checkout.razorpay.com", "https://accounts.google.com/gsi/"],
        "upgrade-insecure-requests": config.isProduction ? [] : null,
      },
    },
    strictTransportSecurity: config.isProduction,
    // Google sign-in and Razorpay open popups that must be able to report back to this page.
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Same-origin by default; list other origins in ALLOWED_ORIGINS if the API is used from elsewhere.
if (config.allowedOrigins.length) {
  app.use("/api", cors({ origin: config.allowedOrigins }));
}

// ---------------- RATE LIMITS ----------------
const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, error: message }),
  });

app.use("/api", limiter(1, 300, "Too many requests. Please slow down."));
app.use(["/api/auth/login", "/api/auth/signup", "/api/auth/google", "/api/admin/login"], limiter(15, 20, "Too many sign-in attempts. Try again in a few minutes."));
app.use(["/api/auth/forgot-password", "/api/auth/resend-verification"], limiter(60, 5, "Too many emails requested. Try again later."));
app.use(["/api/reports", "/api/contact"], limiter(60, 10, "Too many submissions. Try again later."));
app.use("/api/artists/apply", limiter(60, 5, "Too many applications. Try again later."));
app.post("/api/auctions/:id/bids", limiter(1, 30, "You're bidding very quickly. Wait a moment and try again."));

// ---------------- BODY PARSING ----------------
// The webhook needs the raw body to check Razorpay's signature, so it's mounted before JSON parsing.
app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }), payments.webhook);

// Larger limits only where images are uploaded.
app.use("/api/artists/apply", express.json({ limit: "40mb" }));
app.post("/api/auctions", express.json({ limit: "15mb" }));
app.use(express.json({ limit: "100kb" }));

// ---------------- API ----------------
app.get("/api/health", (req, res) =>
  sendOk(res, { status: "OK", database: mongoose.connection.readyState === 1 ? "connected" : "connecting" })
);
app.use("/api/auth", authRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/payments", payments.router);
app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);
app.use("/api", (req, res, next) => next(new HttpError(404, "Not found.")));

// ---------------- STATIC FRONTEND ----------------
// Only these folders are public; server code, models, .env and node_modules are never served.
const staticOptions = { index: false, maxAge: config.isProduction ? "1h" : 0 };
app.use("/css", express.static(path.join(__dirname, "css"), staticOptions));
app.use("/js", express.static(path.join(__dirname, "js"), staticOptions));
app.use("/uploads", express.static(config.uploadDir, { ...staticOptions, maxAge: "30d", immutable: true }));

app.get(/^\/(?!api\/|css\/|js\/|uploads\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------------- ERRORS ----------------
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, error: "That upload is too large. Try smaller images." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, error: "Invalid request." });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, error: "Some fields are invalid." });
  }

  captureError(err, { route: `${req.method} ${req.originalUrl}` });
  res.status(500).json({ success: false, error: "Something went wrong on our side. Please try again." });
});

process.on("unhandledRejection", (err) => captureError(err, { route: "unhandledRejection" }));

// ---------------- START ----------------
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

startAuctionCloser();

app.listen(config.port, () => {
  console.log(`Server running on ${config.appUrl}`);
});
