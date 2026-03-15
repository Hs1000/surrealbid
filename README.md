# SurrealBid - Artist Auction Platform

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## ✨ Features

- **Artist Registration**: Multi-step registration with profile photos and portfolio uploads
- **Persistent Storage**: Data stored in browser localStorage with backup/restore
- **Admin Dashboard**: Beautiful UI for approving/rejecting artists with real-time updates
- **Auction System**: Create and manage art auctions
- **Community Reporting**: Art theft prevention with reporting system
- **Email Verification**: Automated verification (demo mode shows links directly)
- **Data Management**: Export/import data, backup/restore functionality
- **Payment Integration**: Razorpay integration for secure payments
- **Responsive Design**: Works perfectly on all devices

## 🎛️ Admin Access

The admin panel is **not linked in the site navigation**—only you can access it by going directly to `/admin` (e.g. `http://localhost:3000/admin`) and entering the password: `DevSecurePass2024!`

**Admin Features:**
- 👨‍🎨 **Artist Management**: Review, approve, or reject artist registrations with profile photos
- 🚨 **Report Management**: Investigate and resolve community reports
- 📊 **Analytics Dashboard**: Monitor platform statistics and user metrics
- 🎯 **Auction Control**: Manage auction listings and moderation
- 💾 **Data Management**: Export/import data, backup/restore, storage analytics
- 🔒 **Security Features**: Session management and access controls

## 📝 Technical Notes

- **localStorage Storage**: Data persists in browser's localStorage with structured format
- **Email Verification**: Shows verification links directly for demo purposes
- **Data Persistence**: All artist profiles, auctions, and reports are permanently stored
- **Admin Security**: Password required every time you open the admin panel (no session persistence)
- **Data Export**: Full backup/restore functionality for data management
- **Browser Compatibility**: Works on all modern browsers

## 🔧 Development Setup

- **Storage**: localStorage with structured data format (v2.0)
- **Admin Password**: `DevSecurePass2024!` (change in production)
- **Data Management**: Export/import data through admin panel
