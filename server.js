const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For handling large base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/surrealbid', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Artist Schema
const artistSchema = new mongoose.Schema({
  basicInfo: {
    artistId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    location: { type: String, required: true },
    profilePhoto: { type: String }, // Base64 encoded image
    joinedDate: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
  },
  artisticProfile: {
    bio: { type: String, required: true },
    artisticStyle: [{ type: String }],
    yearsExperience: { type: String, required: true },
    education: { type: String },
    awards: { type: String },
    exhibitions: { type: String }
  },
  portfolio: {
    images: [{ type: String }], // Array of base64 encoded images
    website: { type: String },
    socialMedia: { type: String },
    instagram: { type: String },
    behance: { type: String },
    linkedin: { type: String }
  },
  identityVerification: {
    website: { type: String },
    instagram: { type: String },
    otherSocialMedia: { type: String },
    exhibitions: { type: String },
    ownershipDeclaration: { type: Boolean, default: false },
    identityConsent: { type: Boolean, default: false }
  },
  verification: {
    emailVerified: { type: Boolean, default: false },
    portfolioSubmitted: { type: Boolean, default: false },
    portfolioReviewed: { type: Boolean, default: false },
    approved: { type: Boolean, default: null }, // null = pending, true = approved, false = rejected
    approvedAt: { type: Date },
    reviewedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    verificationLevel: { type: String, default: 'none' } // none, basic, verified
  },
  adminNotes: {
    reviewNotes: { type: String },
    approvalNotes: { type: String },
    rejectionNotes: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auction Schema
const auctionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  description: { type: String },
  startingPrice: { type: Number, required: true },
  currentBid: { type: Number, default: 0 },
  reservePrice: { type: Number },
  buyNowPrice: { type: Number },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'active', 'ended', 'cancelled'], default: 'draft' },
  images: [{ type: String }], // Array of base64 encoded images
  category: { type: String },
  tags: [{ type: String }],
  bids: [{
    bidderId: { type: String },
    bidderName: { type: String },
    amount: { type: Number },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'outbid', 'won'], default: 'active' }
  }],
  winner: {
    bidderId: { type: String },
    bidderName: { type: String },
    winningBid: { type: Number },
    wonAt: { type: Date }
  },
  createdBy: { type: String }, // Artist ID who created it
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Report Schema
const reportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reporterId: { type: String },
  reporterName: { type: String },
  auctionId: { type: String, required: true },
  auctionTitle: { type: String },
  reportType: { type: String, enum: ['copyright', 'inappropriate', 'spam', 'fake', 'other'], required: true },
  description: { type: String, required: true },
  evidence: [{ type: String }], // Array of base64 encoded images
  status: { type: String, enum: ['pending', 'investigating', 'resolved', 'dismissed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignedTo: { type: String },
  resolution: { type: String },
  resolvedAt: { type: Date },
  resolvedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const Artist = mongoose.model('Artist', artistSchema);
const Auction = mongoose.model('Auction', auctionSchema);
const Report = mongoose.model('Report', reportSchema);

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Artist routes
app.post('/api/artists', async (req, res) => {
  try {
    const artist = new Artist(req.body);
    await artist.save();
    console.log('✅ Artist saved to database:', artist.basicInfo.fullName);
    res.status(201).json({ success: true, artist });
  } catch (error) {
    console.error('❌ Error saving artist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/artists', async (req, res) => {
  try {
    const artists = await Artist.find().sort({ createdAt: -1 });
    res.json({ success: true, artists });
  } catch (error) {
    console.error('❌ Error fetching artists:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/artists/:id', async (req, res) => {
  try {
    const artist = await Artist.findOne({ 'basicInfo.artistId': req.params.id });
    if (!artist) {
      return res.status(404).json({ success: false, error: 'Artist not found' });
    }
    res.json({ success: true, artist });
  } catch (error) {
    console.error('❌ Error fetching artist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/artists/:id', async (req, res) => {
  try {
    const artist = await Artist.findOneAndUpdate(
      { 'basicInfo.artistId': req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!artist) {
      return res.status(404).json({ success: false, error: 'Artist not found' });
    }
    console.log('✅ Artist updated:', artist.basicInfo.fullName);
    res.json({ success: true, artist });
  } catch (error) {
    console.error('❌ Error updating artist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending artists for admin review
app.get('/api/artists/pending', async (req, res) => {
  try {
    const pendingArtists = await Artist.find({
      'verification.portfolioSubmitted': true,
      'verification.portfolioReviewed': false,
      'verification.approved': { $ne: false }
    }).sort({ createdAt: -1 });

    res.json({ success: true, artists: pendingArtists });
  } catch (error) {
    console.error('❌ Error fetching pending artists:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve artist
app.post('/api/artists/:id/approve', async (req, res) => {
  try {
    const { notes } = req.body;
    const artist = await Artist.findOneAndUpdate(
      { 'basicInfo.artistId': req.params.id },
      {
        'verification.portfolioReviewed': true,
        'verification.approved': true,
        'verification.approvedAt': new Date(),
        'verification.reviewedAt': new Date(),
        'verification.verificationLevel': 'verified',
        'adminNotes.approvalNotes': notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!artist) {
      return res.status(404).json({ success: false, error: 'Artist not found' });
    }

    console.log('✅ Artist approved:', artist.basicInfo.fullName);
    res.json({ success: true, artist });
  } catch (error) {
    console.error('❌ Error approving artist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject artist
app.post('/api/artists/:id/reject', async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const artist = await Artist.findOneAndUpdate(
      { 'basicInfo.artistId': req.params.id },
      {
        'verification.portfolioReviewed': false,
        'verification.approved': false,
        'verification.rejectedAt': new Date(),
        'verification.reviewedAt': new Date(),
        'verification.rejectionReason': reason,
        'adminNotes.rejectionNotes': notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!artist) {
      return res.status(404).json({ success: false, error: 'Artist not found' });
    }

    console.log('❌ Artist rejected:', artist.basicInfo.fullName);
    res.json({ success: true, artist });
  } catch (error) {
    console.error('❌ Error rejecting artist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auction routes
app.post('/api/auctions', async (req, res) => {
  try {
    const auction = new Auction(req.body);
    await auction.save();
    console.log('✅ Auction created:', auction.title);
    res.status(201).json({ success: true, auction });
  } catch (error) {
    console.error('❌ Error creating auction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auctions', async (req, res) => {
  try {
    const auctions = await Auction.find().sort({ createdAt: -1 });
    res.json({ success: true, auctions });
  } catch (error) {
    console.error('❌ Error fetching auctions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Report routes
app.post('/api/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    console.log('🚨 Report submitted:', report.reportType);
    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('❌ Error creating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const totalArtists = await Artist.countDocuments();
    const verifiedArtists = await Artist.countDocuments({ 'verification.approved': true });
    const pendingArtists = await Artist.countDocuments({
      'verification.portfolioSubmitted': true,
      'verification.portfolioReviewed': false,
      'verification.approved': { $ne: false }
    });
    const rejectedArtists = await Artist.countDocuments({ 'verification.approved': false });

    const totalAuctions = await Auction.countDocuments();
    const activeAuctions = await Auction.countDocuments({ status: 'active' });

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      stats: {
        artists: {
          total: totalArtists,
          verified: verifiedArtists,
          pending: pendingArtists,
          rejected: rejectedArtists
        },
        auctions: {
          total: totalAuctions,
          active: activeAuctions
        },
        reports: {
          total: totalReports,
          pending: pendingReports
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SurrealBid API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});