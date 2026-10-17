const express = require("express");
const Artist = require("../models/Artist");
const { emails } = require("../lib/mailer");
const { randomId } = require("../lib/tokens");
const { resolveImage } = require("../lib/uploads");
const { requireUser, requireVerifiedUser } = require("../lib/auth");
const { artistSummary } = require("../lib/serialize");
const { HttpError, sendOk, sendCreated, asyncHandler, cleanString, cleanUrl } = require("../lib/http");

const router = express.Router();

const STYLES = ["surrealism", "abstract", "expressionism", "fantasy", "dark-art", "psychedelic", "symbolism", "dreamlike", "other"];
const EXPERIENCE = ["beginner", "intermediate", "experienced", "professional", "master"];
const MAX_PORTFOLIO_IMAGES = 5;

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

router.get(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    const artist = await Artist.findOne({ userId: req.user._id });
    sendOk(res, { artist: artistSummary(artist) });
  })
);

router.post(
  "/apply",
  requireVerifiedUser,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const existing = await Artist.findOne({ userId: req.user._id });
    if (existing && existing.status() !== "rejected") {
      throw new HttpError(409, existing.status() === "approved" ? "You're already an approved artist." : "Your application is already under review.");
    }

    const fullName = cleanString(body.fullName, 100);
    const location = cleanString(body.location, 120);
    const bio = cleanString(body.bio, 6000);
    const styles = (Array.isArray(body.artisticStyle) ? body.artisticStyle : []).filter((s) => STYLES.includes(s));
    const experience = EXPERIENCE.includes(body.yearsExperience) ? body.yearsExperience : "";

    const errors = [];
    if (fullName.length < 2) errors.push("Full name is required.");
    if (location.length < 2) errors.push("Location is required.");
    if (!body.profilePhoto) errors.push("A profile photo is required.");
    if (wordCount(bio) < 100) errors.push("Your artist statement needs at least 100 words.");
    if (!styles.length) errors.push("Choose at least one artistic style.");
    if (!experience) errors.push("Choose your experience level.");
    if (body.ownershipDeclaration !== true) errors.push("You must confirm you created the work you'll sell.");
    if (body.identityConsent !== true) errors.push("You must consent to identity verification.");
    if (errors.length) throw new HttpError(400, errors.join(" "));

    const portfolioInput = Array.isArray(body.portfolioImages) ? body.portfolioImages : [];
    if (portfolioInput.length > MAX_PORTFOLIO_IMAGES) throw new HttpError(400, `Upload at most ${MAX_PORTFOLIO_IMAGES} portfolio images.`);

    const profilePhoto = await resolveImage(body.profilePhoto, { maxBytes: 5 * 1024 * 1024, label: "Profile photo" });
    const portfolioImages = [];
    for (const image of portfolioInput) {
      portfolioImages.push(await resolveImage(image, { label: "Portfolio image" }));
    }

    const data = {
      userId: req.user._id,
      basicInfo: {
        artistId: existing?.basicInfo.artistId || randomId("artist"),
        fullName,
        email: req.user.email || "",
        phone: cleanString(body.phone, 40) || req.user.phone || "",
        location,
        profilePhoto,
      },
      artisticProfile: {
        bio,
        artisticStyle: styles,
        yearsExperience: experience,
        education: cleanString(body.education, 300),
        awards: cleanString(body.awards, 3000),
        exhibitions: cleanString(body.exhibitions, 3000),
      },
      portfolio: { images: portfolioImages },
      identityVerification: {
        website: cleanUrl(body.website),
        instagram: cleanString(body.instagram, 200),
        otherSocialMedia: cleanString(body.socialMedia, 300),
        ownershipDeclaration: true,
        identityConsent: true,
      },
      // Approval is never taken from the request; only the admin review routes change it.
      verification: { approved: false, portfolioReviewed: false, submittedAt: new Date(), rejectionReason: "" },
    };

    const artist = existing ? Object.assign(existing, data) : new Artist(data);
    await artist.save();
    await emails.applicationReceived(artist);

    sendCreated(res, { artist: artistSummary(artist) });
  })
);

module.exports = router;
