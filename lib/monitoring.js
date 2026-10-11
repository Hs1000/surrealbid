const config = require("./config");

// Optional Sentry error reporting: set SENTRY_DSN and run `npm install @sentry/node`.
let Sentry = null;
if (config.sentryDsn) {
  try {
    Sentry = require("@sentry/node");
    Sentry.init({ dsn: config.sentryDsn, environment: process.env.NODE_ENV || "development" });
  } catch {
    console.warn("[monitoring] SENTRY_DSN is set but @sentry/node isn't installed. Run: npm install @sentry/node");
  }
}

function captureError(err, context = {}) {
  console.error("[error]", context.route || "", err);
  if (Sentry) Sentry.captureException(err, { extra: context });
}

module.exports = { captureError };
