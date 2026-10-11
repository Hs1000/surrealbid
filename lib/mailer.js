const nodemailer = require("nodemailer");
const config = require("./config");

let transport = null;
if (config.smtp.host) {
  transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/**
 * Sends a simple transactional email. `lines` are paragraphs; `action` is an optional button link.
 * Without SMTP configured (development only, enforced in config), the email is printed to the console.
 */
async function sendMail({ to, subject, lines = [], action }) {
  if (!to) return;

  const text = [...lines, action ? `${action.label}: ${action.url}` : ""].filter(Boolean).join("\n\n");
  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#1b171b">
      <p style="font:600 22px Georgia,serif;margin:0 0 20px">SurrealBid</p>
      ${lines.map((line) => `<p style="font:15px/1.6 -apple-system,Segoe UI,sans-serif;margin:0 0 14px">${escapeHtml(line)}</p>`).join("")}
      ${action ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#1b171b;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font:600 14px -apple-system,Segoe UI,sans-serif">${escapeHtml(action.label)}</a></p>
      <p style="font:12px/1.5 -apple-system,Segoe UI,sans-serif;color:#6b6268">Or open this link: ${escapeHtml(action.url)}</p>` : ""}
    </div>`;

  if (!transport) {
    console.log(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n${text}\n`);
    return;
  }

  try {
    await transport.sendMail({ from: config.smtp.from, to, subject, text, html });
  } catch (err) {
    // Email failures shouldn't break the request that triggered them.
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

const link = (path) => `${config.appUrl}${path}`;

const emails = {
  verifyEmail: (user, token) =>
    sendMail({
      to: user.email,
      subject: "Confirm your email for SurrealBid",
      lines: [`Hi ${user.name},`, "Confirm your email address to start bidding and applying as an artist. This link expires in 24 hours."],
      action: { label: "Confirm email", url: link(`/verify-email?token=${token}`) },
    }),

  resetPassword: (user, token) =>
    sendMail({
      to: user.email,
      subject: "Reset your SurrealBid password",
      lines: [`Hi ${user.name},`, "Someone asked to reset the password for your account. If that was you, use the link below within the next hour. Otherwise you can ignore this email."],
      action: { label: "Choose a new password", url: link(`/reset-password?token=${token}`) },
    }),

  applicationReceived: (artist) =>
    sendMail({
      to: config.adminEmail,
      subject: `New artist application: ${artist.basicInfo.fullName}`,
      lines: [`${artist.basicInfo.fullName} (${artist.basicInfo.email}) submitted an artist application.`],
      action: { label: "Review applications", url: link("/admin") },
    }),

  artistApproved: (artist) =>
    sendMail({
      to: artist.basicInfo.email,
      subject: "You're approved to sell on SurrealBid",
      lines: [`Hi ${artist.basicInfo.fullName},`, "Your artist application has been approved. You can now list artwork for auction."],
      action: { label: "List your first work", url: link("/submit") },
    }),

  artistRejected: (artist, reason) =>
    sendMail({
      to: artist.basicInfo.email,
      subject: "An update on your SurrealBid application",
      lines: [
        `Hi ${artist.basicInfo.fullName},`,
        "Thank you for applying. We aren't able to approve your application right now.",
        reason ? `Reviewer note: ${reason}` : "",
        "You're welcome to update your application and submit it again.",
      ].filter(Boolean),
      action: { label: "Update your application", url: link("/artist-register") },
    }),

  outbid: (to, auction, amount) =>
    sendMail({
      to,
      subject: `You've been outbid on "${auction.title}"`,
      lines: [`Someone placed a higher bid of ₹${amount.toLocaleString("en-IN")} on "${auction.title}" by ${auction.artist}.`],
      action: { label: "Bid again", url: link("/auctions") },
    }),

  auctionWon: (to, auction) =>
    sendMail({
      to,
      subject: `You won "${auction.title}"`,
      lines: [
        `Congratulations — your bid of ₹${auction.winner.amount.toLocaleString("en-IN")} won "${auction.title}" by ${auction.artist}.`,
        "Complete payment to confirm your purchase.",
      ],
      action: { label: "Pay now", url: link(`/checkout?auction=${encodeURIComponent(auction.id)}`) },
    }),

  auctionEndedForArtist: (to, auction) =>
    sendMail({
      to,
      subject: `Your auction "${auction.title}" has ended`,
      lines: auction.winner
        ? [`"${auction.title}" sold for ₹${auction.winner.amount.toLocaleString("en-IN")}. We'll let you know when the buyer has paid.`]
        : [`"${auction.title}" ended without any bids.`],
      action: { label: "Open your dashboard", url: link("/dashboard") },
    }),

  paymentReceived: (buyerEmail, artistEmail, auction) =>
    Promise.all([
      sendMail({
        to: buyerEmail,
        subject: `Payment confirmed for "${auction.title}"`,
        lines: [`We've received your payment of ₹${auction.payment.amountINR.toLocaleString("en-IN")}. The artist will be in touch about delivery.`, `Payment reference: ${auction.payment.paymentId}`],
      }),
      sendMail({
        to: artistEmail,
        subject: `"${auction.title}" has been paid for`,
        lines: [`The buyer has paid ₹${auction.payment.amountINR.toLocaleString("en-IN")}.`, "Shipping details are in your dashboard."],
        action: { label: "Open your dashboard", url: link("/dashboard") },
      }),
      sendMail({
        to: config.adminEmail,
        subject: `Payment received: "${auction.title}"`,
        lines: [`₹${auction.payment.amountINR.toLocaleString("en-IN")} — payment ${auction.payment.paymentId}.`],
      }),
    ]),

  contactMessage: (message) =>
    sendMail({
      to: config.adminEmail,
      subject: `Contact form: ${message.subject} from ${message.name}`,
      lines: [`From: ${message.name} <${message.email}>`, message.message],
    }),
};

module.exports = { sendMail, emails };
