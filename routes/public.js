const express = require("express");
const Report = require("../models/Report");
const Auction = require("../models/Auction");
const ContactMessage = require("../models/ContactMessage");
const { emails } = require("../lib/mailer");
const { randomId } = require("../lib/tokens");
const { optionalUser } = require("../lib/auth");
const { HttpError, sendCreated, asyncHandler, cleanString, cleanEmail } = require("../lib/http");

const router = express.Router();

const REPORT_REASONS = ["copyright", "fake", "inappropriate", "spam", "other"];
const CONTACT_SUBJECTS = ["general", "artist", "artwork", "partnership"];

router.post(
  "/reports",
  optionalUser,
  asyncHandler(async (req, res) => {
    const auctionId = cleanString(req.body.auctionId, 100);
    const reason = REPORT_REASONS.includes(req.body.reason) ? req.body.reason : "";
    const reporterEmail = req.user?.email || cleanEmail(req.body.reporterEmail);

    if (!reason) throw new HttpError(400, "Please choose a reason.");
    if (!reporterEmail) throw new HttpError(400, "Please enter a valid email so we can follow up.");
    if (!(await Auction.exists({ id: auctionId }))) throw new HttpError(404, "Auction not found.");

    const report = await Report.create({
      id: randomId("report"),
      auctionId,
      reason,
      reporterEmail,
      reporterUserId: req.user?._id,
      description: cleanString(req.body.description, 2000),
      evidence: cleanString(req.body.evidence, 2000),
    });
    sendCreated(res, { report: { id: report.id } });
  })
);

router.post(
  "/contact",
  asyncHandler(async (req, res) => {
    const name = cleanString(req.body.name, 100);
    const email = cleanEmail(req.body.email);
    const subject = CONTACT_SUBJECTS.includes(req.body.subject) ? req.body.subject : "";
    const message = cleanString(req.body.message, 5000);

    if (name.length < 2) throw new HttpError(400, "Please enter your name.");
    if (!email) throw new HttpError(400, "Please enter a valid email address.");
    if (!subject) throw new HttpError(400, "Please choose a topic.");
    if (message.length < 10) throw new HttpError(400, "Please write a slightly longer message.");

    const saved = await ContactMessage.create({ name, email, subject, message });
    await emails.contactMessage(saved);
    sendCreated(res);
  })
);

module.exports = router;
