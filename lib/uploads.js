const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const config = require("./config");
const { HttpError } = require("./http");

const TYPES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Magic bytes so a renamed non-image can't be stored as one.
function looksLikeImage(buffer, ext) {
  if (ext === "jpg") return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (ext === "png") return buffer.slice(0, 4).toString("hex") === "89504e47";
  if (ext === "gif") return buffer.slice(0, 3).toString("ascii") === "GIF";
  if (ext === "webp") return buffer.slice(8, 12).toString("ascii") === "WEBP";
  return false;
}

/**
 * Saves a base64 data URL image to the upload directory and returns its public URL.
 * Images live on disk (served from /uploads) instead of inside MongoDB documents.
 */
async function saveImageDataUrl(dataUrl, { maxBytes = 10 * 1024 * 1024, label = "Image" } = {}) {
  const match = /^data:([a-z/]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!match) throw new HttpError(400, `${label} must be a JPG, PNG, WebP or GIF image`);

  const ext = TYPES[match[1]];
  if (!ext) throw new HttpError(400, `${label} must be a JPG, PNG, WebP or GIF image`);

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > maxBytes) {
    throw new HttpError(400, `${label} is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`);
  }
  if (!looksLikeImage(buffer, ext)) throw new HttpError(400, `${label} is not a valid image file`);

  await fs.mkdir(config.uploadDir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(config.uploadDir, name), buffer);
  return `/uploads/${name}`;
}

/** Accepts either a new data URL (saved to disk) or a previously uploaded /uploads/ URL. */
async function resolveImage(value, options) {
  if (!value) return "";
  if (typeof value === "string" && /^\/uploads\/[\w.-]+$/.test(value)) return value;
  return saveImageDataUrl(value, options);
}

module.exports = { saveImageDataUrl, resolveImage };
