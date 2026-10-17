# SurrealBid

A curated auction house for surreal art. Artists apply and are reviewed by hand; approved artists list work; collectors bid; the winner pays through Razorpay.

## Running locally

Requires Node 20+ and MongoDB.

```bash
npm install
cp .env.example .env   # then fill in JWT_SECRET and ADMIN_PASSWORD_HASH (commands are in the file)
npm run dev            # restarts on file changes; or `npm start`
```

Open http://localhost:3000. Without `SMTP_HOST`, every email (confirmation links, password resets, outbid and win notices) is printed to the server console, so you can click through the whole flow locally.

## How it works

1. **Accounts** — anyone can sign up. Bidding and applying require a confirmed email.
2. **Artist application** (`/artist-register`) — a signed-in user submits their profile, statement and portfolio. The admin gets an email.
3. **Review** (`/admin`) — the admin approves or rejects; the artist is emailed either way and can re-apply after a rejection.
4. **Listing** (`/submit`) — approved artists set a starting bid, length and optional start time.
5. **Bidding** (`/auctions`) — each bid must beat the current one. Bids are checked and saved in a single database operation, so simultaneous bids can't both win, and nobody can bid after the end time or on their own work. The previous leader gets an outbid email.
6. **Closing** — every 15 seconds the server closes auctions past their end time, records the winner, and emails the winner and the artist.
7. **Payment** (`/checkout?auction=…`) — only the winner can pay. The server creates the Razorpay order for the winning amount and confirms payment by checking Razorpay's signature (and, optionally, the webhook). The artist sees the buyer's delivery details on their dashboard once paid.
8. **Dashboard** (`/dashboard`) — account status, application status, the artist's listings and sales, and the collector's live, won and lost bids.

## WhatsApp (optional)

Artists can apply entirely on WhatsApp (Hindi or English, text or voice notes, photos), and anyone can sign in with "Continue with WhatsApp": the site shows a code and the user sends it to your WhatsApp number. Because the user starts the chat, sign-in and the application bot use free service conversations.

Setup: create a Meta app with the WhatsApp product, set the `WHATSAPP_*` variables (see `.env.example`), and register the webhook `https://YOUR-APP/api/whatsapp/webhook` with your `WHATSAPP_VERIFY_TOKEN`, subscribed to `messages`. Voice notes are stored for reviewers to listen to in /admin (no transcription yet).

## Project layout

```
server.js            App setup: security headers, rate limits, routes, static files, errors
lib/                 config, auth middleware, mailer, uploads, serializers, auction closer
routes/              auth, artists, auctions, payments, admin, public (reports + contact)
models/              Mongoose schemas
index.html, css/     The single-page frontend
js/core.js           API client, session, dialogs, router (loaded first)
js/*.js              auctions, artist (apply + list), account (dashboard, checkout), admin, contact
uploads/             Uploaded images (git-ignored)
```

Only `css/`, `js/`, `uploads/` and `index.html` are served to the browser.

## Security notes

- Approval status, auction IDs, prices, end times and payment amounts are always decided by the server, never taken from the request.
- Public API responses never include emails, user IDs, payment or shipping details. Bidders are shown as "First L."
- Passwords are bcrypt-hashed; email confirmation and reset tokens are stored hashed and expire (24 hours / 1 hour). Resetting a password signs out other sessions.
- Rate limits on sign-in, sign-up, password reset, bidding, applications, reports and contact.
- Uploaded images are type-checked by their file contents and size-limited.

## Deploying (Render free)

1. Render → **New → Blueprint** → this repo (`render.yaml` sets everything up).
2. Paste the secret values when asked: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `GOOGLE_CLIENT_ID`, `BREVO_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`, `CLOUDINARY_URL`, `APP_URL`.
3. MongoDB Atlas → Network Access must allow `0.0.0.0/0`.
4. Add an UptimeRobot (free) HTTP monitor on `https://YOUR-APP.onrender.com/api/health` every 5 minutes so the free service doesn't sleep.
5. Add the live URL to Google Cloud → Clients → Authorized JavaScript origins.

## Before launch

- [ ] **Hosting**: a Node host (Render, Railway, Fly.io, a VPS) with a **persistent disk** for `UPLOAD_DIR`, or move uploads to S3/Cloudinary in `lib/uploads.js`.
- [ ] **Database**: MongoDB Atlas with automated backups turned on.
- [ ] **Environment**: `NODE_ENV=production`, `APP_URL`, a fresh 48-byte `JWT_SECRET`, `TRUST_PROXY=1` behind a proxy.
- [ ] **Email**: an SMTP provider and a verified sending domain (SPF/DKIM), plus `ADMIN_EMAIL`.
- [ ] **Payments**: Razorpay live keys and the webhook. Test the full flow with `rzp_test_` keys first.
- [ ] **Monitoring**: `SENTRY_DSN` + `npm install @sentry/node`.
- [ ] **Legal**: the Terms, Privacy and Fees pages are drafts with placeholders (commission, refund window, liability). Have a lawyer review them.
- [ ] **Existing data**: accounts created before this version have no confirmed email, so they'll need to confirm (or reset their password) before bidding.
