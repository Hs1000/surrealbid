class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendOk(res, data = {}) {
  res.json({ success: true, ...data });
}

function sendCreated(res, data = {}) {
  res.status(201).json({ success: true, ...data });
}

// Wraps async route handlers so thrown errors reach the error middleware.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function cleanString(value, maxLength = 200) {
  return String(value ?? "").trim().slice(0, maxLength);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(value) {
  const email = cleanString(value, 254).toLowerCase();
  return EMAIL_RE.test(email) ? email : "";
}

function cleanUrl(value) {
  const url = cleanString(value, 500);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

module.exports = { HttpError, sendOk, sendCreated, asyncHandler, cleanString, cleanEmail, cleanUrl };
