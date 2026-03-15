// ===== CLIENT-SIDE ROUTING SYSTEM =====
let currentPage = '/';

// Simple admin password (client-side app)
const ADMIN_PASSWORD = 'DevSecurePass2024!';

// Simple localStorage key for data storage
const DATA_STORAGE_KEY = 'surrealbid_data_v2';

// Notification system for admin feedback
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.admin-notification');
  existingNotifications.forEach(notif => notif.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `admin-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span class="notification-text">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Route definitions
const routes = {
  '/': 'home-page',
  '/auctions': 'auctions-page',
  '/submit': 'submit-page',
  '/contact': 'contact-page', // Contact page
  '/verify': 'verification-page', // Email verification page
  '/artist-register': 'artist-register-page', // Artist registration
  '/artist-profile': 'artist-profile-page', // Artist profile
  '/admin': 'admin-page', // Admin panel
  '/about': 'home-page', // About section is in home page
  '/payment-success': 'payment-success-page'
};

// Navigation function
function navigateTo(path) {
  // Prevent navigation if already on the same page
  if (currentPage === path) {
    return;
  }

  // Update current page
  currentPage = path;

  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show target page
  const targetPage = routes[path];
  if (targetPage) {
    const pageElement = document.getElementById(targetPage);
    if (pageElement) {
      setTimeout(() => {
        pageElement.classList.add('active');
      }, 50);
    } else {
      // Fallback to home
      setTimeout(() => {
        document.getElementById('home-page').classList.add('active');
      }, 50);
    }
  } else {
    // Fallback to home
    setTimeout(() => {
      document.getElementById('home-page').classList.add('active');
    }, 50);
  }

  // Update navigation active states
  updateNavActiveState(path);

  // Handle special cases
  if (path === '/auctions') {
    // Initialize auctions page after transition
    setTimeout(() => {
      handleAuctionsPage();
    }, 100);
  } else if (path === '/submit') {
    // Initialize auction form validation
    setTimeout(() => {
      initAuctionFormValidation();
    }, 100);
  } else if (path === '/contact') {
    // Initialize contact form after transition
    setTimeout(() => {
      initContactForm();
    }, 100);
  } else if (path === '/verify') {
    // Handle email verification
    setTimeout(() => {
      handleEmailVerification();
    }, 100);
  } else if (path === '/artist-register') {
    // Initialize artist registration
    setTimeout(() => {
      initArtistRegistration();
    }, 100);
  } else if (path === '/admin') {
    // Initialize admin panel
    setTimeout(() => {
      initAdminPanel();
    }, 100);
  } else if (path === '/about') {
    // Scroll to about section
    setTimeout(() => {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  } else if (path === '/payment-success') {
    // Display payment details from URL
    setTimeout(() => {
      displayPaymentDetails();
    }, 100);
  }

  // Update browser history
  history.pushState(null, null, path);

  // Scroll to top for new pages
  if (path !== '/about') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Update navigation active states
function updateNavActiveState(activePath) {
  // Remove active class from all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('nav-link-active');
  });

  // Add active class to current nav link
  const activeLink = document.querySelector(`a[href="${activePath}"]`);
  if (activeLink && activeLink.classList.contains('nav-link')) {
    activeLink.classList.add('nav-link-active');
  }

  // Special case for auctions page
  if (activePath === '/auctions') {
    const auctionsLink = document.querySelector('a[href="/auctions"]');
    if (auctionsLink) {
      auctionsLink.classList.add('nav-link-active');
    }
  }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
  const path = window.location.pathname;
  navigateTo(path);
});

// Initialize routing on page load
document.addEventListener('DOMContentLoaded', function() {
  // Get initial path
  const initialPath = window.location.pathname;

  // If path is just '/' or empty, default to home
  if (initialPath === '/' || initialPath === '') {
    navigateTo('/');
  } else if (routes[initialPath]) {
    navigateTo(initialPath);
  } else {
    // Handle payment success with query parameters
    if (initialPath === '/payment-success') {
      navigateTo('/payment-success');
    } else {
      // Fallback to home for unknown routes
      navigateTo('/');
    }
  }
});

// Display payment details for payment success page
function displayPaymentDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('payment_id');
  const orderId = urlParams.get('order_id');
  const amount = urlParams.get('amount');
  const title = urlParams.get('title');
  const artist = urlParams.get('artist');

  const detailsDiv = document.getElementById('payment-details');
  if (!detailsDiv) return;

  let html = '<div class="checkout-item">';
  if (title && artist) {
    html += `<h3>${title}</h3><p class="checkout-artist">by ${artist}</p>`;
  }
  if (amount) {
    const amountNum = Number(amount);
    html += `<p class="checkout-price">₹${amountNum.toLocaleString('en-IN')}</p>`;
  }
  if (paymentId) {
    html += `<p style="font-size: 12px; opacity: 0.7; margin-top: 12px;">Payment ID: ${paymentId}</p>`;
  }
  if (orderId) {
    html += `<p style="font-size: 12px; opacity: 0.7;">Order ID: ${orderId}</p>`;
  }
  html += '</div>';
  detailsDiv.innerHTML = html;
}

console.log("SurrealBid loaded - using JSONBin.io storage only");

// Storage configuration
const STORAGE_KEY = "surrealbid_auctions";
const BIDS_STORAGE_KEY = "surrealbid_bids";
const EXCHANGE_RATE_CACHE_KEY = "surrealbid_exchange_rate";
const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_INR_PER_USD = 83; // Fallback rate if API fails

// JSONBin.io storage configuration (primary and only storage)
// Note: JSONBin.io API endpoints may vary. Try these alternatives if the default doesn't work:
// 'https://api.jsonbin.io/v3/b' (v3 API - most common)
// 'https://api.jsonbin.io/b' (v2 API - sometimes works better)
const SHARED_STORAGE_API = 'https://api.jsonbin.io/v3/b';

// Alternative endpoints to try if the default doesn't work
const ALTERNATIVE_APIS = [
  'https://api.jsonbin.io/v3/b',
  'https://api.jsonbin.io/b',
  'https://jsonbin.io/api/v3/b'
];
const SHARED_STORAGE_BIN_ID = '699063ae43b1c97be97e71d0'; // ⚠️ REPLACE WITH YOUR ACTUAL BIN ID
const SHARED_STORAGE_API_KEY = '$2a$10$dwfI5DnmcSV.xrlrteOKBOW0qrUqwdylnR4Zz.AsmSbD9RAJM7yG6'; // ⚠️ REPLACE WITH YOUR ACTUAL API KEY
const USE_SHARED_STORAGE = true; // JSONBin.io is now the only storage

// Clear cached exchange rate (useful for debugging)
function clearExchangeRateCache() {
  try {
    localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
    console.log('Exchange rate cache cleared');
  } catch (e) {
    console.warn('Error clearing cache:', e);
  }
}

// Live exchange rate fetching
async function getLiveExchangeRate() {
  // Check cache first
  try {
    const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      const now = Date.now();
      if (now - timestamp < EXCHANGE_RATE_CACHE_DURATION) {
        return rate;
      }
    }
  } catch (e) {
    console.warn('Error reading cached exchange rate:', e);
  }

  // Fetch live rate from API
  try {
    // Using exchangerate-api.com free endpoint (no API key required)
    // This returns: { base: "USD", rates: { INR: 83.5, ... } }
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('API response not ok');
    
    const data = await response.json();
    const inrPerUsd = data.rates?.INR;
    
    // Validate the rate is reasonable (should be between 70-100 INR per USD)
    if (inrPerUsd && inrPerUsd > 70 && inrPerUsd < 100) {
      console.log('Live exchange rate fetched:', inrPerUsd, 'INR per USD');
      // Cache the rate
      try {
        localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
          rate: inrPerUsd,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Error caching exchange rate:', e);
      }
      return inrPerUsd;
    } else {
      console.warn('Invalid exchange rate received:', inrPerUsd);
    }
  } catch (error) {
    console.warn('Error fetching live exchange rate:', error);
  }

  // Fallback to cached rate even if expired, but validate it
  try {
    const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cached) {
      const { rate } = JSON.parse(cached);
      // Only use cached rate if it's reasonable
      if (rate > 70 && rate < 100) {
        console.log('Using cached exchange rate:', rate);
        return rate;
      } else {
        console.warn('Cached rate is invalid, clearing cache:', rate);
        localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
      }
    }
  } catch (e) {
    // ignore
  }

  console.log('Using default exchange rate:', DEFAULT_INR_PER_USD);
  return DEFAULT_INR_PER_USD;
}

// Get exchange rate (async wrapper)
let exchangeRatePromise = null;
function getExchangeRate() {
  if (!exchangeRatePromise) {
    exchangeRatePromise = getLiveExchangeRate();
    // Reset promise after 5 minutes to allow refresh
    setTimeout(() => {
      exchangeRatePromise = null;
    }, 5 * 60 * 1000);
  }
  return exchangeRatePromise;
}

// Helper function to convert INR to USD using current rate
function convertINRtoUSD(inr) {
  // Strict validation: rate must be between 70 and 100 (exclusive of 100)
  if (!currentExchangeRate || currentExchangeRate <= 70 || currentExchangeRate >= 100) {
    console.warn('Invalid exchange rate, using default for conversion. Current rate:', currentExchangeRate);
    const defaultUsd = inr / DEFAULT_INR_PER_USD;
    console.log(`Converted ₹${inr} using default rate (${DEFAULT_INR_PER_USD}): $${defaultUsd.toFixed(2)}`);
    return defaultUsd;
  }
  const usd = inr / currentExchangeRate;
  console.log(`Converted ₹${inr} using rate (${currentExchangeRate}): $${usd.toFixed(2)}`);
  return usd;
}

// Clear invalid cached rates on page load
(function clearInvalidCache() {
  try {
    const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cached) {
      const { rate } = JSON.parse(cached);
      // If cached rate is invalid (like 100), clear it immediately
      // Valid range: 70 < rate < 100 (exclusive)
      if (!rate || rate <= 70 || rate >= 100) {
        console.log('Clearing invalid cached exchange rate:', rate);
        localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
      } else {
        console.log('Valid cached exchange rate found:', rate);
      }
    }
  } catch (e) {
    console.warn('Error checking cache:', e);
  }
})();

// Initialize exchange rate on page load
let currentExchangeRate = DEFAULT_INR_PER_USD;
getExchangeRate().then(rate => {
  if (rate && rate > 70 && rate < 100) {
    currentExchangeRate = rate;
    console.log('Exchange rate loaded:', rate, 'INR per USD');
    // Update displayed prices if on auctions page
    if (document.querySelector('.auctions-grid')) {
      updateAllPrices().catch(console.error);
    }
  } else {
    console.warn('Invalid exchange rate, using default:', rate);
    // Force clear cache if rate is invalid
    if (rate) {
      try {
        localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
      } catch (e) {}
    }
  }
});

// Function to update all price displays with current exchange rate
async function updateAllPrices() {
  const auctions = await loadStoredAuctions();
  document.querySelectorAll('[data-price-element="true"]').forEach(async (priceSpan) => {
    const auctionId = priceSpan.dataset.auctionId;
    const highestBid = await getHighestBid(auctionId);
    if (highestBid) {
      const usd = convertINRtoUSD(highestBid.amount);
      priceSpan.textContent = `₹${highestBid.amount.toLocaleString('en-IN')} (≈ $${usd.toFixed(2)})`;
    } else {
      // Get auction data to show starting bid
      const auction = auctions.find(a => String(a.id) === auctionId);
      if (auction) {
        const bidAmount = auction.currentBidINR || 0;
        const usd = convertINRtoUSD(bidAmount);
        priceSpan.textContent = `₹${bidAmount.toLocaleString('en-IN')} (≈ $${usd.toFixed(2)})`;
      }
    }
  });
}

// Load auctions from JSONBin.io only (no localStorage fallback)
async function loadStoredAuctions() {
  if (!USE_SHARED_STORAGE || !SHARED_STORAGE_BIN_ID || !SHARED_STORAGE_API_KEY) {
    console.error('JSONBin.io not configured. Please check SHARED_STORAGE_BIN_ID and SHARED_STORAGE_API_KEY');
    return [];
  }

  try {
    console.log('Loading auctions from JSONBin.io...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': SHARED_STORAGE_API_KEY,
        'X-Bin-Meta': 'false'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Bin not found or empty, returning empty array');
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw JSONBin.io response:', data);

    // Handle different JSONBin.io response formats
    let auctions = [];
    if (data.record && Array.isArray(data.record)) {
      auctions = data.record;
      console.log('📦 Using data.record (array format)');
    } else if (data.record && data.record.auctions && Array.isArray(data.record.auctions)) {
      auctions = data.record.auctions;
      console.log('📦 Using data.record.auctions format');
    } else if (Array.isArray(data)) {
      auctions = data;
      console.log('📦 Using data (direct array format)');
    } else if (data.auctions && Array.isArray(data.auctions)) {
      auctions = data.auctions;
      console.log('📦 Using data.auctions format');
    } else {
      console.warn('⚠️ Unexpected JSONBin.io response format:', data);
      auctions = [];
    }

    console.log(`✓ Successfully loaded ${auctions.length} auctions from JSONBin.io`);

    // Validate and clean auction data, especially image data
    const validatedAuctions = auctions.map((auction, index) => {
      // Ensure imageDataUrl is valid if present
      if (auction.imageDataUrl) {
        if (typeof auction.imageDataUrl !== 'string' ||
            !auction.imageDataUrl.startsWith('data:image/') ||
            auction.imageDataUrl.length < 100) { // Minimum viable data URL length
          console.warn(`⚠️ Invalid imageDataUrl for auction "${auction.title}", removing`);
          delete auction.imageDataUrl;
        }
      }

      // Ensure imageUrl is valid if present
      if (auction.imageUrl) {
        if (typeof auction.imageUrl !== 'string' ||
            auction.imageUrl.trim().length === 0) {
          console.warn(`⚠️ Invalid imageUrl for auction "${auction.title}", removing`);
          delete auction.imageUrl;
        }
      }

      console.log(`Validated auction ${index + 1}: ${auction.title}`, {
        hasImageDataUrl: !!auction.imageDataUrl,
        hasImageUrl: !!auction.imageUrl,
        imageDataUrlLength: auction.imageDataUrl ? auction.imageDataUrl.length : 0,
        imageDataUrlValid: auction.imageDataUrl ? auction.imageDataUrl.startsWith('data:image/') : false
      });

      return auction;
    });

    return validatedAuctions;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out - JSONBin.io may be unreachable');
    } else {
      console.error('Failed to load from JSONBin.io:', error.message);
    }

    // Return empty array if JSONBin.io is not available
    console.log('Returning empty array due to JSONBin.io error');
    return [];
  }
}


// Helper function to compress base64 image data (aggressive compression for JSONBin.io limits)
function compressImageData(imageDataUrl, maxWidth = 300, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Add timeout for compression
    const timeout = setTimeout(() => {
      reject(new Error('Image compression timeout'));
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let newWidth = maxWidth;
        let newHeight = maxWidth / aspectRatio;

        if (newHeight > maxWidth) {
          newHeight = maxWidth;
          newWidth = maxWidth * aspectRatio;
        }

        // Ensure minimum dimensions
        newWidth = Math.max(100, Math.min(newWidth, 1200));
        newHeight = Math.max(100, Math.min(newHeight, 1200));

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        if (compressedDataUrl.length < 100) {
          reject(new Error('Compressed image too small'));
          return;
        }

        resolve(compressedDataUrl);
      } catch (error) {
        console.error('Canvas compression error:', error);
        reject(error);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = imageDataUrl;
  });
}

// Helper function to prepare auctions for shared storage
async function prepareAuctionsForSync(auctions) {
  const processedAuctions = [];

  for (const auction of auctions) {
    if (auction.imageDataUrl && auction.imageDataUrl.length > 50000) { // Compress images over 50KB to stay under 100KB total limit
      try {
        console.log('Compressing image for auction:', auction.id);
        const compressedImageData = await compressImageData(auction.imageDataUrl);
        processedAuctions.push({
          ...auction,
          imageDataUrl: compressedImageData
        });
      } catch (error) {
        console.warn('Failed to compress image, keeping original:', error);
        processedAuctions.push(auction);
      }
    } else {
      processedAuctions.push(auction);
    }
  }

  return processedAuctions;
}

// Save auctions to JSONBin.io only (no localStorage)
async function saveStoredAuctions(list) {
  if (!USE_SHARED_STORAGE || !SHARED_STORAGE_BIN_ID || !SHARED_STORAGE_API_KEY) {
    throw new Error('JSONBin.io not configured. Please check SHARED_STORAGE_BIN_ID and SHARED_STORAGE_API_KEY');
  }

  console.log('🔍 saveStoredAuctions called with:', {
    listLength: list?.length || 'undefined',
    listType: Array.isArray(list) ? 'array' : typeof list,
    firstItem: list?.[0] ? 'exists' : 'none',
    sampleData: list?.[0] ? { id: list[0].id, title: list[0].title } : 'N/A'
  });

  try {
    console.log(`Saving ${list.length} auctions to JSONBin.io...`);

    const payload = {
      auctions: list,
      updatedAt: Date.now(),
      version: '1.0'
    };

    const payloadSize = JSON.stringify(payload).length;
    const payloadSizeKB = (payloadSize / 1024).toFixed(2);

    console.log('📦 Payload to save:', {
      auctionCount: list.length,
      totalSize: `${payloadSizeKB}KB`,
      maxAllowed: '100KB (JSONBin.io free limit)',
      status: payloadSize > 100000 ? '❌ TOO BIG' : '✅ OK'
    });

    // Check if payload exceeds JSONBin.io free limit
    if (payloadSize > 100000) {
      const excessKB = ((payloadSize - 100000) / 1024).toFixed(1);
      throw new Error(`Payload too large: ${payloadSizeKB}KB exceeds 100KB limit by ${excessKB}KB. Try smaller images or fewer auctions.`);
    }

    if (payloadSize > 90000) { // Warn if approaching limit
      console.warn('⚠️ Payload is close to 100KB limit. Consider smaller images.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': SHARED_STORAGE_API_KEY
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('JSONBin.io Error Details:');
      console.error('- Status:', response.status);
      console.error('- Status Text:', response.statusText);
      console.error('- Response:', errorText);
      console.error('- Bin ID:', SHARED_STORAGE_BIN_ID);
      console.error('- API Key (first 10 chars):', SHARED_STORAGE_API_KEY.substring(0, 10) + '...');

      let userFriendlyMessage = 'Unknown error';
      if (response.status === 403) {
        userFriendlyMessage = 'Authentication failed - please check your JSONBin.io API key';
      } else if (response.status === 404) {
        userFriendlyMessage = 'Bin not found - please check your JSONBin.io bin ID';
      } else if (response.status === 413) {
        userFriendlyMessage = 'Data too large - try with smaller images';
      } else if (response.status >= 500) {
        userFriendlyMessage = 'JSONBin.io server error - try again later';
      }

      throw new Error(`${userFriendlyMessage} (${response.status})`);
    }

    console.log('✓ Successfully saved auctions to JSONBin.io');

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out - check your internet connection');
    }
    console.error('Failed to save to JSONBin.io:', error.message);
    throw error;
  }
}



// Bidding system functions (JSONBin.io)
async function loadBids() {
  try {
    const auctions = await loadStoredAuctions();
    // For now, store bids within the auctions data structure
    // In a production app, you'd want a separate bin for bids
    const allBids = {};

    // Extract bids from auctions (this is a simple approach)
    auctions.forEach(auction => {
      if (auction.bids && Array.isArray(auction.bids)) {
        allBids[auction.id] = auction.bids;
      }
    });

    return allBids;
  } catch (error) {
    console.error('Failed to load bids:', error);
    return {};
  }
}

async function saveBids(bids) {
  try {
    // Load current auctions
    const auctions = await loadStoredAuctions();

    // Update bids in auctions
    Object.keys(bids).forEach(auctionId => {
      const auction = auctions.find(a => String(a.id) === String(auctionId));
      if (auction) {
        auction.bids = bids[auctionId];
      }
    });

    // Save updated auctions
    await saveStoredAuctions(auctions);
    console.log('✓ Bids saved to JSONBin.io');
  } catch (error) {
    console.error('Failed to save bids:', error);
    throw error;
  }
}

function getHighestBid(auctionId) {
  const bids = loadBids();
  const auctionBids = bids[auctionId] || [];
  if (auctionBids.length === 0) return null;
  return auctionBids.reduce((highest, bid) =>
    bid.amount > highest.amount ? bid : highest, auctionBids[0]
  );
}

async function addBid(auctionId, amount, bidderName, bidderEmail) {
  const bids = loadBids();
  if (!bids[auctionId]) bids[auctionId] = [];

  bids[auctionId].push({
    id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    bidderName: bidderName || 'Anonymous',
    bidderEmail: bidderEmail || '',
    timestamp: Date.now()
  });

  await saveBids(bids);

  // Update auction's current bid
  const auctions = await loadStoredAuctions();
  const auctionIndex = auctions.findIndex(a => String(a.id) === String(auctionId));
  if (auctionIndex !== -1) {
    auctions[auctionIndex].currentBidINR = amount;
    await saveStoredAuctions(auctions);

    // Update bid history display if visible
    updateBidHistoryIfVisible(auctionId);
  }

  return bids[auctionId];
}

// Handle submit-auction.html form
// Wait for DOM to be ready before initializing form handler
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleAuctionForm);
} else {
  handleAuctionForm();
}

// ======================================================
// ARTIST VERIFICATION & PROFILE SYSTEM
// ======================================================

// Artist profile data structure
const ARTIST_PROFILE_STRUCTURE = {
  basicInfo: {
    artistId: 'unique-generated-id',
    fullName: 'required',
    email: 'required-verified',
    phone: 'optional',
    location: 'required',
    profilePhoto: 'optional-compressed',
    joinedDate: 'auto-generated',
    lastActive: 'auto-updated'
  },
  artisticProfile: {
    bio: 'required-100-500-words',
    artisticStyle: 'required-multi-select',
    yearsExperience: 'required',
    education: 'optional',
    awards: 'optional',
    exhibitions: 'optional'
  },
  portfolio: {
    images: 'required-1',
    website: 'optional',
    socialMedia: 'optional',
    instagram: 'optional',
    behance: 'optional',
    linkedin: 'optional'
  },
  verification: {
    emailVerified: false,
    portfolioSubmitted: false,
    portfolioReviewed: false,
    identityVerified: false,
    premiumArtist: false,
    verificationLevel: 'none', // none, basic, verified, premium
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null
  },
  statistics: {
    auctionsCreated: 0,
    auctionsSold: 0,
    totalEarnings: 0,
    averageRating: 0,
    responseTime: 0
  }
};

// Verification levels
const VERIFICATION_LEVELS = {
  NONE: 'none',
  BASIC: 'basic', // Email verified + portfolio submitted
  VERIFIED: 'verified', // Portfolio reviewed + approved
  PREMIUM: 'premium' // Identity verified + background check
};

// Artist registration and management
class ArtistManager {
  constructor() {
    this.currentArtist = null;
    this.loadCurrentArtist();
  }

  // Generate unique artist ID
  generateArtistId() {
    return 'artist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Create new artist profile
  async createArtistProfile(profileData) {
    console.log('🎨 Creating artist profile...');

    const artistProfile = {
      ...ARTIST_PROFILE_STRUCTURE,
      basicInfo: {
        ...(ARTIST_PROFILE_STRUCTURE.basicInfo || {}),
        artistId: this.generateArtistId(),
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone || '',
        location: profileData.location,
        profilePhoto: profileData.profilePhoto || null,
        joinedDate: new Date().toISOString(),
        lastActive: new Date().toISOString()
      },
      artisticProfile: {
        bio: profileData.bio,
        artisticStyle: profileData.artisticStyle,
        yearsExperience: profileData.yearsExperience,
        education: profileData.education || '',
        awards: profileData.awards || '',
        exhibitions: profileData.exhibitions || ''
      },
      portfolio: {
        images: profileData.portfolioImages || [],
        website: profileData.website || '',
        socialMedia: profileData.socialMedia || '',
        instagram: profileData.instagram || '',
        behance: profileData.behance || '',
        linkedin: profileData.linkedin || ''
      },
      verification: {
        ...ARTIST_PROFILE_STRUCTURE.verification,
        emailVerified: false,
        portfolioSubmitted: true,
        submittedAt: new Date().toISOString()
      }
    };

    // Save to localStorage (in production, save to database)
    await this.saveArtistProfile(artistProfile);

    // Set as current artist
    this.currentArtist = artistProfile;
    localStorage.setItem('currentArtist', JSON.stringify(artistProfile));

    console.log('✅ Artist profile created:', artistProfile.basicInfo.artistId);
    return artistProfile;
  }

  // Save artist profile
  async saveArtistProfile(profile) {
    const artists = JSON.parse(localStorage.getItem('artists') || '[]');

    // Remove existing profile if updating
    const existingIndex = artists.findIndex(a => a.basicInfo.artistId === profile.basicInfo.artistId);
    if (existingIndex >= 0) {
      artists[existingIndex] = profile;
    } else {
      artists.push(profile);
    }

    localStorage.setItem('artists', JSON.stringify(artists));
    console.log('💾 Artist profile saved');

    // Also save to new data management system
    saveArtistProfile(profile);
  }

  // Load current artist from localStorage
  loadCurrentArtist() {
    const stored = localStorage.getItem('currentArtist');
    if (stored) {
      this.currentArtist = JSON.parse(stored);
      console.log('👤 Current artist loaded:', this.currentArtist.basicInfo.artistId);
    }
  }

  // Get artist by ID
  getArtistById(artistId) {
    const artists = JSON.parse(localStorage.getItem('artists') || '[]');
    return artists.find(a => a.basicInfo.artistId === artistId);
  }

  // Check if artist is verified for auction creation
  canCreateAuction(artistId) {
    const artist = this.getArtistById(artistId);
    if (!artist) return { allowed: false, reason: 'Artist profile not found' };

    // At minimum, email must be verified
    if (!artist.verification.emailVerified) {
      return { allowed: false, reason: 'Email not verified. Please verify your email first.' };
    }

    // Portfolio must be submitted and approved
    if (!artist.verification.portfolioReviewed) {
      return { allowed: false, reason: 'Portfolio not reviewed yet. Please wait for approval.' };
    }

    return { allowed: true };
  }

  // Update artist verification status
  async updateVerificationStatus(artistId, status, reviewerId = null, rejectionReason = null) {
    const artist = this.getArtistById(artistId);
    if (!artist) return false;

    artist.verification.portfolioReviewed = status === 'approved';
    artist.verification.reviewedAt = new Date().toISOString();
    artist.verification.reviewedBy = reviewerId;
    artist.verification.rejectionReason = rejectionReason;

    if (status === 'approved') {
      artist.verification.verificationLevel = VERIFICATION_LEVELS.VERIFIED;
    }

    await this.saveArtistProfile(artist);

    // Update current artist if this is them
    if (this.currentArtist && this.currentArtist.basicInfo.artistId === artistId) {
      this.currentArtist = artist;
      localStorage.setItem('currentArtist', JSON.stringify(artist));
    }

    console.log(`✅ Artist ${artistId} verification updated:`, status);
    return true;
  }

  // Mark artist email as verified
  async markEmailVerified(artistId) {
    const artist = this.getArtistById(artistId);
    if (!artist) {
      console.error('Artist not found for email verification:', artistId);
      return false;
    }

    artist.verification.emailVerified = true;
    artist.verification.verificationLevel = VERIFICATION_LEVELS.BASIC; // Email verified = basic verification
    artist.verification.emailVerifiedAt = new Date().toISOString();

    await this.saveArtistProfile(artist);

    // Update current artist if this is them
    if (this.currentArtist && this.currentArtist.basicInfo.artistId === artistId) {
      this.currentArtist = artist;
      localStorage.setItem('currentArtist', JSON.stringify(artist));
    }

    console.log('✅ Artist email marked as verified:', artistId);
    return true;
  }

  // Get all pending artist reviews
  getPendingReviews() {
    const artists = JSON.parse(localStorage.getItem('artists') || '[]');
    return artists.filter(a =>
      a.verification.portfolioSubmitted &&
      !a.verification.portfolioReviewed
    );
  }
}


// Global artist manager instance
const artistManager = new ArtistManager();

// ======================================================
// AUCTION VERIFICATION & VALIDATION SYSTEM
// ======================================================

// Enhanced validation rules
const AUCTION_VALIDATION_RULES = {
  title: {
    minLength: 5,
    maxLength: 100,
    required: true,
    spamWords: ['test', 'fake', 'spam', 'xxx', 'casino', 'lottery', 'viagra']
  },
  artist: {
    minLength: 2,
    maxLength: 50,
    required: true,
    patterns: {
      // Prevent single letters, numbers, obvious fakes
      invalid: /^[a-zA-Z]$|^[0-9]+$|^test|fake|spam|unknown|anonymous/i
    }
  },
  description: {
    minLength: 20,
    maxLength: 500,
    required: false // Optional for now
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    disposableDomains: ['10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'temp-mail.org']
  },
  bid: {
    minValue: 100, // Minimum ₹100
    maxValue: 1000000, // Maximum ₹10 lakh
    reasonable: true
  },
  image: {
    required: true,
    minSize: 10000, // 10KB minimum
    maxSize: 10000000, // 10MB maximum
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  }
};

// Spam detection patterns
const SPAM_PATTERNS = {
  suspiciousWords: [
    'free', 'win', 'winner', 'prize', 'lottery', 'casino', 'viagra', 'cialis',
    'porn', 'sex', 'nude', 'naked', 'escort', 'drugs', 'weed', 'cocaine',
    'bitcoin', 'crypto', 'investment', 'scam', 'hack', 'crack'
  ],
  repetitiveChars: /(.)\1{4,}/, // 5+ same characters in a row
  allCaps: /^[A-Z\s]{10,}$/, // All caps with 10+ characters
  excessivePunctuation: /[!?]{3,}/, // 3+ exclamation/question marks
  urlPatterns: /(https?:\/\/[^\s]+)/gi // URLs in title/artist fields
};

// Rate limiting storage
let submissionHistory = JSON.parse(localStorage.getItem('auction_submissions') || '[]');

// Clean old submissions (older than 24 hours)
function cleanOldSubmissions() {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  submissionHistory = submissionHistory.filter(sub => sub.timestamp > oneDayAgo);
  localStorage.setItem('auction_submissions', JSON.stringify(submissionHistory));
}

// Check rate limits
function checkRateLimits() {
  cleanOldSubmissions();

  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  const recentSubmissions = submissionHistory.filter(sub => sub.timestamp > oneHourAgo);
  const todaySubmissions = submissionHistory.filter(sub => sub.timestamp > oneDayAgo);

  // Rate limits
  if (recentSubmissions.length >= 3) {
    return { allowed: false, reason: 'Too many submissions in the last hour. Please wait before submitting another auction.' };
  }

  if (todaySubmissions.length >= 5) {
    return { allowed: false, reason: 'You\'ve reached the daily submission limit. Please try again tomorrow.' };
  }

  return { allowed: true };
}

// Record submission for rate limiting
function recordSubmission() {
  submissionHistory.push({
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    ip: 'unknown' // Would be handled server-side normally
  });

  // Keep only last 100 submissions
  if (submissionHistory.length > 100) {
    submissionHistory = submissionHistory.slice(-100);
  }

  localStorage.setItem('auction_submissions', JSON.stringify(submissionHistory));
}

// Check artist verification status
function checkArtistVerification(email) {
  // First, check if artist exists
  const artists = JSON.parse(localStorage.getItem('artists') || '[]');
  const artist = artists.find(a => a.basicInfo.email === email);

  if (!artist) {
    return {
      allowed: false,
      message: 'Artist profile not found. Please register as an artist first.',
      action: 'register',
      actionText: 'Register as Artist'
    };
  }

  // Check email verification
  if (!artist.verification.emailVerified) {
    return {
      allowed: false,
      message: 'Email not verified. Please check your email for the verification link.',
      action: 'verify',
      actionText: 'Resend Verification'
    };
  }

  // Check portfolio review status
  if (!artist.verification.portfolioReviewed) {
    return {
      allowed: false,
      message: 'Portfolio under review. We\'ll notify you once approved (usually within 48 hours).',
      action: 'pending',
      actionText: 'Check Status'
    };
  }

  // Check if portfolio was rejected
  if (artist.verification.rejectionReason) {
    return {
      allowed: false,
      message: `Portfolio needs revision: ${artist.verification.rejectionReason}`,
      action: 'revise',
      actionText: 'Update Portfolio'
    };
  }

  // Artist is verified and can create auctions
  return {
    allowed: true,
    artist: artist,
    message: 'Artist verified! Ready to create auctions.'
  };
}

// Comprehensive auction validation
function validateAuctionSubmission(auctionData) {
  const errors = [];

  // Title validation
  if (!auctionData.title || auctionData.title.trim().length === 0) {
    errors.push('Title is required');
  } else {
    const title = auctionData.title.trim();
    const titleRules = AUCTION_VALIDATION_RULES.title;

    if (title.length < titleRules.minLength) {
      errors.push(`Title must be at least ${titleRules.minLength} characters long`);
    }
    if (title.length > titleRules.maxLength) {
      errors.push(`Title must be no more than ${titleRules.maxLength} characters long`);
    }

    // Check for spam words
    const lowerTitle = title.toLowerCase();
    const spamWord = titleRules.spamWords.find(word => lowerTitle.includes(word));
    if (spamWord) {
      errors.push(`Title contains inappropriate content ("${spamWord}")`);
    }

    // Check for spam patterns
    if (SPAM_PATTERNS.repetitiveChars.test(title)) {
      errors.push('Title contains repetitive characters');
    }
    if (SPAM_PATTERNS.allCaps.test(title)) {
      errors.push('Title should not be all caps');
    }
    if (SPAM_PATTERNS.excessivePunctuation.test(title)) {
      errors.push('Title contains excessive punctuation');
    }
    if (SPAM_PATTERNS.urlPatterns.test(title)) {
      errors.push('Title should not contain URLs');
    }
  }

  // Artist validation
  if (!auctionData.artist || auctionData.artist.trim().length === 0) {
    errors.push('Artist name is required');
  } else {
    const artist = auctionData.artist.trim();
    const artistRules = AUCTION_VALIDATION_RULES.artist;

    if (artist.length < artistRules.minLength) {
      errors.push(`Artist name must be at least ${artistRules.minLength} characters long`);
    }
    if (artist.length > artistRules.maxLength) {
      errors.push(`Artist name must be no more than ${artistRules.maxLength} characters long`);
    }

    // Check for invalid patterns
    if (artistRules.patterns.invalid.test(artist)) {
      errors.push('Please provide a valid artist name');
    }
  }

  // Email validation (if provided - we'll add this field)
  if (auctionData.email) {
    const emailRules = AUCTION_VALIDATION_RULES.email;
    if (!emailRules.pattern.test(auctionData.email)) {
      errors.push('Please provide a valid email address');
    }

    // Check for disposable email domains
    const domain = auctionData.email.split('@')[1];
    if (domain && emailRules.disposableDomains.includes(domain.toLowerCase())) {
      errors.push('Please use a permanent email address');
    }
  }

  // Bid validation
  const bidRules = AUCTION_VALIDATION_RULES.bid;
  if (auctionData.startBid < bidRules.minValue) {
    errors.push(`Starting bid must be at least ₹${bidRules.minValue.toLocaleString('en-IN')}`);
  }
  if (auctionData.startBid > bidRules.maxValue) {
    errors.push(`Starting bid cannot exceed ₹${bidRules.maxValue.toLocaleString('en-IN')}`);
  }

  // Image validation
  const imageRules = AUCTION_VALIDATION_RULES.image;
  if (!auctionData.hasImage) {
    errors.push('Please provide an artwork image');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: [] // Could add warnings for optional improvements
  };
}

// Spam content detection
function detectSpamContent(text) {
  if (!text) return { isSpam: false, reasons: [] };

  const reasons = [];
  const lowerText = text.toLowerCase();

  // Check for suspicious words
  const foundSpamWords = SPAM_PATTERNS.suspiciousWords.filter(word =>
    lowerText.includes(word)
  );
  if (foundSpamWords.length > 0) {
    reasons.push(`Contains suspicious words: ${foundSpamWords.join(', ')}`);
  }

  // Check for spam patterns
  if (SPAM_PATTERNS.repetitiveChars.test(text)) {
    reasons.push('Contains repetitive characters');
  }
  if (SPAM_PATTERNS.allCaps.test(text) && text.length > 10) {
    reasons.push('All caps text');
  }
  if (SPAM_PATTERNS.excessivePunctuation.test(text)) {
    reasons.push('Excessive punctuation');
  }

  return {
    isSpam: reasons.length > 0,
    reasons: reasons,
    severity: reasons.length > 2 ? 'high' : reasons.length > 0 ? 'medium' : 'low'
  };
}

// Generate verification token
function generateVerificationToken() {
  return btoa(Math.random().toString() + Date.now().toString()).replace(/[+/=]/g, '').substring(0, 32);
}

// Store verification data (temporary - would be server-side)
function storeVerificationData(auctionId, token, email) {
  const verificationData = {
    auctionId,
    token,
    email,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    attempts: 0
  };

  localStorage.setItem(`verification_${auctionId}`, JSON.stringify(verificationData));
  console.log('Verification data stored for auction:', auctionId);
}

// Verify email token
function verifyEmailToken(token, auctionId) {
  console.log('🔍 Verifying token for:', auctionId);
  console.log('🔍 Received token:', token);

  const stored = localStorage.getItem(`verification_${auctionId}`);
  if (!stored) {
    console.log('❌ No verification data found for:', auctionId);
    console.log('🔍 Available localStorage keys:', Object.keys(localStorage).filter(key => key.startsWith('verification_')));
    return false;
  }

  const verificationData = JSON.parse(stored);
  console.log('🔍 Verification data found:', verificationData);

  // Check if token matches and hasn't expired
  if (verificationData.token !== token) {
    console.log('❌ Token mismatch:');
    console.log('   Expected:', verificationData.token);
    console.log('   Received:', token);
    console.log('   Match:', verificationData.token === token);
    return false;
  }

  if (Date.now() > verificationData.expiresAt) {
    console.log('❌ Token expired:', {
      now: Date.now(),
      expiresAt: verificationData.expiresAt,
      expired: Date.now() > verificationData.expiresAt
    });
    return false;
  }

  // Mark as verified
  verificationData.verified = true;
  verificationData.verifiedAt = Date.now();
  localStorage.setItem(`verification_${auctionId}`, JSON.stringify(verificationData));

  console.log('✅ Token verified successfully');
  return true;
}

// Send verification email (demo mode - shows link directly)
async function sendVerificationEmail(email, auctionId, token, title) {
  // Generate token if not provided
  const finalToken = token || generateVerificationToken();

  // For lite-server/SPA, we need to use the correct base URL
  const baseUrl = window.location.origin;
  const verificationLink = `${baseUrl}/verify?token=${finalToken}&auction=${auctionId}`;

  console.log('📧 Preparing verification email...');
  console.log('Current location:', window.location.href);
  console.log('Base URL:', baseUrl);
  console.log('To:', email);
  console.log('Token:', finalToken);
  console.log('Auction ID:', auctionId);
  console.log('Full link:', verificationLink);

  const isArtistVerification = auctionId.startsWith('artist-');
  const verificationType = isArtistVerification ? 'artist profile' : 'auction';

  // Store verification data locally (in localStorage for demo purposes)
  const verificationData = {
    token: finalToken,
    email,
    auctionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    attempts: 0
  };

  localStorage.setItem(`verification_${auctionId}`, JSON.stringify(verificationData));
  console.log('💾 Stored verification data for:', auctionId, verificationData);

  // Show verification link directly (demo mode)
  const message = `✅ ${isArtistVerification ? 'Artist registration' : 'Auction'} submitted successfully!\n\n🔗 Verification Link:\n${verificationLink}\n\nClick OK to verify now, or copy the link to verify later.`;

  alert(message);

  // Store verification data temporarily for SPA navigation
  sessionStorage.setItem('pending_verification', JSON.stringify({
    token: finalToken,
    auctionId: auctionId,
    email: email,
    timestamp: Date.now()
  }));

  // Navigate to verification page (SPA style)
  setTimeout(() => {
    console.log('🔄 Navigating to verification page...');
    navigateTo('/verify');
  }, 1000);

  return { status: 'demo_mode', link: verificationLink };
}

// Legacy function for backward compatibility
function sendVerificationEmailSimulation(email, auctionId, token, title) {
  // Redirect to the real email function
  return sendVerificationEmail(email, auctionId, token, title);
}

// Handle verification from sessionStorage (for SPA)
function handleEmailVerification() {
  // Show loading state initially
  const loadingEl = document.getElementById('verification-loading');
  const successEl = document.getElementById('verification-success');
  const errorEl = document.getElementById('verification-error');

  if (loadingEl) loadingEl.style.display = 'block';
  if (successEl) successEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';

  // Get verification data from sessionStorage (set by sendVerificationEmail)
  let pendingVerification = sessionStorage.getItem('pending_verification');

  // Fallback: Check URL parameters (for manual navigation or direct links)
  if (!pendingVerification) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const auctionId = urlParams.get('auction');

    if (token && auctionId) {
      pendingVerification = JSON.stringify({
        token,
        auctionId,
        email: 'unknown',
        timestamp: Date.now()
      });
      console.log('🔍 Using verification data from URL parameters (fallback)');
    }
  }

  if (pendingVerification) {
    const verificationData = JSON.parse(pendingVerification);
    const { token, auctionId, email } = verificationData;

    console.log('🔍 Processing email verification:', { token, auctionId, email });

    // Clear the pending verification data
    sessionStorage.removeItem('pending_verification');

    // Debug: Check all localStorage keys
    console.log('🔍 All localStorage keys:', Object.keys(localStorage));
    console.log('🔍 Looking for key:', `verification_${auctionId}`);

    if (verifyEmailToken(token, auctionId)) {
      // Token is valid - check if this is artist verification or auction verification
      if (auctionId.startsWith('artist-')) {
        // Artist profile verification
        const artistId = auctionId.replace('artist-', '');
        artistManager.markEmailVerified(artistId);

        // Update success message for artist
        const successTitle = document.querySelector('#verification-success h2');
        const successText = document.querySelector('#verification-success p');
        const successBtn = document.querySelector('#verification-success a');

        if (successTitle) successTitle.textContent = 'Email Verified!';
        if (successText) successText.textContent = 'Your artist profile has been verified. You can now create auctions on SurrealBid.';
        if (successBtn) {
          successBtn.textContent = 'Start Creating Auctions';
          successBtn.onclick = () => navigateTo('/submit');
        }

        console.log('✅ Artist email verified:', artistId);
      } else {
        // Regular auction verification
        publishPendingAuction(auctionId);

        // Update success message for auction
        const successTitle = document.querySelector('#verification-success h2');
        const successText = document.querySelector('#verification-success p');
        const successBtn = document.querySelector('#verification-success a');

        if (successTitle) successTitle.textContent = 'Email Verified!';
        if (successText) successText.textContent = 'Your auction has been published and is now live on SurrealBid.';
        if (successBtn) {
          successBtn.textContent = 'View Your Auction';
          successBtn.onclick = () => navigateTo('/auctions');
        }

        console.log('✅ Auction published:', auctionId);
      }

      // Show success state
      if (loadingEl) loadingEl.style.display = 'none';
      if (successEl) successEl.style.display = 'block';

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigateTo(auctionId.startsWith('artist-') ? '/submit' : '/auctions');
      }, 3000);

    } else {
      // Token invalid or expired
      console.log('❌ Verification failed - checking localStorage data...');

      // Check if verification data exists at all
      const storedData = localStorage.getItem(`verification_${auctionId}`);
      if (!storedData) {
        console.log('❌ No verification data found in localStorage');
      } else {
        const data = JSON.parse(storedData);
        console.log('❌ Verification data exists but validation failed:', data);
      }

      // Show error state
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'block';

      // Update error message based on verification type
      const errorTitle = document.querySelector('#verification-error h2');
      const errorText = document.querySelector('#verification-error p');
      const errorBtn = document.querySelector('#verification-error a');

      if (auctionId.startsWith('artist-')) {
        if (errorText) errorText.textContent = 'The verification link is invalid or has expired. Please register as an artist again. Check the browser console (F12) for debug information.';
        if (errorBtn) {
          errorBtn.textContent = 'Register as Artist';
          errorBtn.onclick = () => navigateTo('/artist-register');
        }
      } else {
        if (errorText) errorText.textContent = 'The verification link is invalid or has expired. Please submit your auction again. Check the browser console (F12) for debug information.';
        if (errorBtn) {
          errorBtn.textContent = 'Submit New Auction';
          errorBtn.onclick = () => navigateTo('/submit');
        }
      }
    }
  } else {
    // Missing verification data
    console.log('❌ Verification failed - no pending verification data in sessionStorage');
    console.log('Available sessionStorage keys:', Object.keys(sessionStorage));

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';

    // Show generic error
    const errorText = document.querySelector('#verification-error p');
    if (errorText) {
      errorText.textContent = 'No verification data found. Please submit your registration or auction again. Check the browser console (F12) for debug information.';
    }
  }
}

// Publish pending auction to live auctions
function publishPendingAuction(auctionId) {
  console.log('📢 Publishing pending auction:', auctionId);

  // Get pending auctions
  const pendingAuctions = JSON.parse(localStorage.getItem('pending_auctions') || '[]');
  const auctionIndex = pendingAuctions.findIndex(a => a.id === auctionId);

  if (auctionIndex === -1) {
    console.error('Pending auction not found:', auctionId);
    return;
  }

  const auction = pendingAuctions[auctionIndex];

  // Update status and add to live auctions
  auction.status = 'active'; // Now it's a live auction
  auction.verifiedAt = Date.now();

  // Add to live auctions (this would normally go to your JSONBin storage)
  // For now, we'll add it to localStorage as well
  const liveAuctions = JSON.parse(localStorage.getItem('live_auctions') || '[]');
  liveAuctions.push(auction);
  localStorage.setItem('live_auctions', JSON.stringify(liveAuctions));

  // Remove from pending
  pendingAuctions.splice(auctionIndex, 1);
  localStorage.setItem('pending_auctions', JSON.stringify(pendingAuctions));

  console.log('✅ Auction published successfully:', auction.title);
}

function handleAuctionForm() {
  const form = document.getElementById("auction-form");
  if (!form) {
    console.log('Form not found - this page may not have the auction form');
    return;
  }

  console.log('Auction form handler initialized');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log('🚀 Form submitted - checking image inputs...');

    // Debug: Check form inputs before processing
    const titleInput = document.getElementById("title");
    const artistInput = document.getElementById("artist");
    const imageUrlInput = document.getElementById("imageUrl");
    const imageFileInput = document.getElementById("imageFile");
    const auctionStartDateInput = document.getElementById("auctionStartDate");

    console.log('🎯 Form input values at submit:');
    console.log('- Title:', titleInput?.value);
    console.log('- Artist:', artistInput?.value);
    console.log('- Image URL:', imageUrlInput?.value);
    console.log('- Image file:', imageFileInput?.files?.[0]?.name || 'No file selected');
    console.log('- Auction start date input element:', auctionStartDateInput);
    console.log('- Auction start date value:', auctionStartDateInput?.value);
    console.log('- Auction start date type:', auctionStartDateInput?.type);

    // Disable submit button to prevent double submission
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating...';
    }

    try {
      const title = /** @type {HTMLInputElement} */ (document.getElementById("title"))?.value.trim();
      const artist = /** @type {HTMLInputElement} */ (document.getElementById("artist"))?.value.trim();
      const artistEmail = /** @type {HTMLInputElement} */ (document.getElementById("artistEmail"))?.value.trim();
      const imageUrlRaw = /** @type {HTMLInputElement} */ (document.getElementById("imageUrl"))?.value.trim();
      const imageUrl = imageUrlRaw && imageUrlRaw.length > 0 ? imageUrlRaw : undefined;
      const imageFileInput = /** @type {HTMLInputElement} */ (document.getElementById("imageFile"));
      const startBidRaw = /** @type {HTMLInputElement} */ (document.getElementById("startBid"))?.value;
      const durationRaw = /** @type {HTMLInputElement} */ (document.getElementById("durationMinutes"))?.value;
      const auctionStartDateRaw = /** @type {HTMLInputElement} */ (document.getElementById("auctionStartDate"))?.value;

      console.log('📝 Form submission debug:');
      console.log('Title:', title);
      console.log('Artist:', artist);
      console.log('Image URL raw:', imageUrlRaw);
      console.log('Image URL processed:', imageUrl);
      console.log('Image file input element:', imageFileInput);
      console.log('Image file selected:', imageFileInput?.files?.[0] ? imageFileInput.files[0].name : 'None');
      console.log('Image file size:', imageFileInput?.files?.[0] ? (imageFileInput.files[0].size / 1024).toFixed(1) + 'KB' : 'N/A');
      console.log('Start bid:', startBidRaw);
      console.log('Duration:', durationRaw);
      console.log('Auction start date raw:', auctionStartDateRaw);
      console.log('Auction start date type:', typeof auctionStartDateRaw);
      console.log('Auction start date length:', auctionStartDateRaw?.length || 0);

      // Test date parsing
      if (auctionStartDateRaw && auctionStartDateRaw.trim() !== '') {
        const testDate = new Date(auctionStartDateRaw);
        console.log('Parsed date object:', testDate);
        console.log('Parsed timestamp:', testDate.getTime());
        console.log('Is valid date:', !isNaN(testDate.getTime()));
        console.log('Current time for comparison:', Date.now());
        console.log('Parsed date vs current:', testDate.getTime() > Date.now() ? 'Future' : 'Past/Current');
      }

      // Check if user provided any image data
      const hasImageUrl = imageUrl && imageUrl.trim().length > 0;
      const hasImageFile = imageFileInput?.files && imageFileInput.files[0];

      if (!hasImageUrl && !hasImageFile) {
        alert('⚠️ No image provided! Please either:\n• Paste an image URL in the "Artwork image" field, OR\n• Upload an image file using the file input\n\nWithout an image, your auction will show a placeholder.');
      }

      // ===== ENHANCED VALIDATION =====

    // Check rate limits first
    const rateLimitCheck = checkRateLimits();
    if (!rateLimitCheck.allowed) {
      alert('🚫 ' + rateLimitCheck.reason);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create auction';
      }
      return;
    }

    // Check if artist is registered and verified
    const artistCheck = checkArtistVerification(artistEmail);
    if (!artistCheck.allowed) {
      // Show detailed verification notice instead of simple alert
      showArtistVerificationNotice(artistCheck);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create auction';
      }
      return;
    }

      // Prepare auction data for validation
      const auctionData = {
        title: title,
        artist: artist,
        email: artistEmail,
        startBid: Math.max(0, Math.floor(Number(startBidRaw || "0") || 0)),
        durationMinutes: Math.max(1, Number(durationRaw || "0") || 0),
        hasImage: hasImageUrl || hasImageFile
      };

      // Run comprehensive validation
      const validation = validateAuctionSubmission(auctionData);

      if (!validation.isValid) {
        alert('❌ Validation Errors:\n\n' + validation.errors.join('\n'));
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Create auction';
        }
        return;
      }

      // Additional spam detection
      const titleSpamCheck = detectSpamContent(title);
      const artistSpamCheck = detectSpamContent(artist);

      if (titleSpamCheck.isSpam || artistSpamCheck.isSpam) {
        const reasons = [...titleSpamCheck.reasons, ...artistSpamCheck.reasons];
        alert('🚨 Content flagged for review:\n\n' + reasons.join('\n') +
              '\n\nYour submission will be manually reviewed before publishing.');
        // Still allow submission but mark for review
      }

      const startBidINR = auctionData.startBid;
      const durationMinutes = auctionData.durationMinutes;

      // Calculate auction start and end times
      const now = Date.now();
      let startTime, endTime;

      if (auctionStartDateRaw && auctionStartDateRaw.trim() !== '') {
        // User specified a start date
        console.log('🎯 Processing auction start date:', auctionStartDateRaw);

        // Try multiple parsing methods for better compatibility
        let parsedDate = new Date(auctionStartDateRaw);

        // If that fails, try parsing as ISO string
        if (isNaN(parsedDate.getTime())) {
          console.log('⚠️ Standard parsing failed, trying alternative methods');
          // Try removing timezone info and parsing
          const cleanDateStr = auctionStartDateRaw.replace(/(\+|-)\d{2}:\d{2}$/, '');
          parsedDate = new Date(cleanDateStr);

          // If still fails, try manual parsing
          if (isNaN(parsedDate.getTime())) {
            console.log('⚠️ Alternative parsing failed, trying manual parsing');
            // Manual parsing for YYYY-MM-DDTHH:MM format
            const match = auctionStartDateRaw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
            if (match) {
              parsedDate = new Date(
                parseInt(match[1]), // year
                parseInt(match[2]) - 1, // month (0-based)
                parseInt(match[3]), // day
                parseInt(match[4]), // hour
                parseInt(match[5]) // minute
              );
            }
          }
        }

        startTime = parsedDate.getTime();

        console.log('📅 Final parsed start time:', startTime);
        console.log('📅 Readable start time:', new Date(startTime).toLocaleString());

        if (isNaN(startTime)) {
          alert('Please enter a valid start date and time. Format should be: YYYY-MM-DD HH:MM');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create auction';
          }
          return;
        }

        // Check if the date is in the past (with 1 minute buffer)
        if (startTime < (Date.now() - 60000)) {
          alert('Start date cannot be in the past. Please select a future date and time.');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create auction';
          }
          return;
        }

        endTime = startTime + durationMinutes * 60 * 1000;
        console.log('✅ Auction scheduled for future:', new Date(startTime).toLocaleString());
      } else {
        // Start immediately
        startTime = now;
        endTime = now + durationMinutes * 60 * 1000;
      }

      console.log('⏰ Auction timing calculated:');
      console.log('Start time:', new Date(startTime).toISOString());
      console.log('End time:', new Date(endTime).toISOString());
      console.log('Duration:', durationMinutes, 'minutes');

      console.log('🔄 Loading current auctions from JSONBin.io...');
      // Load directly from JSONBin.io
      let auctions = [];
      try {
        auctions = await loadStoredAuctions();
        console.log('✅ Loaded', auctions.length, 'auctions from JSONBin.io:', auctions);
      } catch (error) {
        console.error('❌ Failed to load auctions:', error);
        auctions = [];
        console.log('⚠️ Using empty auctions array due to error');
      }

      console.log('📊 Current auctions array length:', auctions.length);

      const file = imageFileInput?.files && imageFileInput.files[0];
      console.log('Image handling:', {
        hasFile: !!file,
        hasImageUrl: !!imageUrl,
        fileName: file?.name,
        fileSize: file ? (file.size / 1024).toFixed(1) + 'KB' : 'N/A'
      });

      // ===== EMAIL VERIFICATION FLOW =====
      function finishSave(extra) {
        console.log('🏗️ Creating pending auction for verification...');

        // Generate unique auction ID
        const auctionId = `pending-${now}-${Math.random().toString(36).substr(2, 9)}`;

        // Create pending auction (not yet published)
        const pendingAuction = {
          id: auctionId,
          title,
          artist,
          artistEmail,
          currentBidINR: startBidINR,
          startTime,
          endTime,
          status: 'pending_verification', // New status
          submittedAt: now,
          ...extra
        };

        // Add image data
        if (imageUrl && imageUrl.trim().length > 0) {
          pendingAuction.imageUrl = imageUrl.trim();
          console.log('🖼️ Added imageUrl to pending auction:', imageUrl);
        }

        console.log('📝 Pending auction created:', pendingAuction);

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Store pending auction temporarily
        const pendingAuctions = JSON.parse(localStorage.getItem('pending_auctions') || '[]');
        pendingAuctions.push(pendingAuction);
        localStorage.setItem('pending_auctions', JSON.stringify(pendingAuctions));

        // Record submission for rate limiting
        recordSubmission();

        console.log('✅ Pending auction stored, verification token generated');

        // Send verification email (simulate for now)
        sendVerificationEmail(artistEmail, auctionId, verificationToken, title);

        // Show success message (verification link will be shown by sendVerificationEmail)
        console.log('✅ Auction submitted - verification link will be displayed shortly');

        // Reset form
        form.reset();

        console.log('📋 Auctions after push:', auctions.length, 'items');
        console.log('📋 Final auctions to save:', auctions);

        // Show final summary before saving
        const startInfo = auctionStartDateRaw ?
          `\nStarts: ${new Date(startTime).toLocaleString()}` :
          '\nStarts: Immediately';

        alert(`Auction "${title}" by ${artist} is being created!\n\nImage: ${imageSummary}\n\nStarting bid: ₹${startBidINR}\nDuration: ${durationMinutes} minutes${startInfo}`);

        // Save to JSONBin.io
        saveStoredAuctions(auctions).then(() => {
          console.log('✅ Auction saved successfully to JSONBin.io');
          window.location.href = "auctions.html";
        }).catch(error => {
          console.error('Failed to save auction:', error);

          // Show more specific error message
          let errorMessage = 'Error saving auction. ';
          if (error.message.includes('Authentication failed')) {
            errorMessage += 'Please check your JSONBin.io API key is correct.';
          } else if (error.message.includes('Bin not found')) {
            errorMessage += 'Please check your JSONBin.io bin ID is correct.';
          } else if (error.message.includes('timed out')) {
            errorMessage += 'Please check your internet connection.';
          } else if (error.message.includes('too large')) {
            errorMessage += 'Please try with a smaller image.';
          } else {
            errorMessage += 'Please try again.';
          }

          alert(errorMessage);
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create auction';
          }
        });
      }

      if (file) {
        console.log('Reading and compressing image file...');
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = typeof reader.result === "string" ? reader.result : "";
            console.log('Image read, size:', (dataUrl.length / 1024).toFixed(1), 'KB');

            // Aggressive compression to stay under 100KB limit
            console.log('Compressing image aggressively...');
            const compressedDataUrl = await compressImageData(dataUrl, 300, 0.5); // Smaller size, lower quality
            const compressionRatio = ((dataUrl.length - compressedDataUrl.length) / dataUrl.length * 100).toFixed(1);
            console.log(`Image compressed: ${compressionRatio}% size reduction (${(compressedDataUrl.length/1024).toFixed(1)}KB)`);

            finishSave({ imageDataUrl: compressedDataUrl });
          } catch (error) {
            console.error('Image compression failed, using original:', error);
            // If compression fails, still try to save with original (might still be too big)
            const dataUrl = typeof reader.result === "string" ? reader.result : "";
            finishSave({ imageDataUrl: dataUrl });
          }
        };
        reader.onerror = () => {
          console.error('FileReader error');
          alert('Error reading image file. Please try again.');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create auction';
          }
        };
        reader.readAsDataURL(file);
      } else {
        finishSave({});
      }
    } catch (error) {
      console.error('Unexpected error in form submission:', error);
      alert('An error occurred: ' + (error.message || 'Unknown error'));
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create auction';
      }
    }
  });
}

// Render auctions and run countdowns on auctions.html
(function handleAuctionsPage() {
  const grid = document.querySelector(".auctions-grid");
  if (!grid) return;

  // Show skeleton loading initially
  showSkeletonLoading();

  // Initialize filters
  initFilters();

  // Load auctions asynchronously
  loadStoredAuctions().then(stored => {
    hideSkeletonLoading();
    renderAuctions(stored);

    // Initialize bidders ticker
    initializeBiddersTicker();

    // Poll for new auctions every 10 seconds (if using shared storage)
    if (USE_SHARED_STORAGE) {
      let allAuctions = stored;
      console.log('Polling for new auctions every 10 seconds...');
      setInterval(async () => {
        try {
          const updatedAuctions = await loadStoredAuctions();
          // Check if auctions changed (new ones added or count changed)
          const currentIds = new Set(allAuctions.map(a => a.id));
          const updatedIds = new Set(updatedAuctions.map(a => a.id));

          // Check if there are new auctions
          const newAuctions = updatedAuctions.filter(a => !currentIds.has(a.id));

          // Also check if count changed (someone might have deleted)
          if (newAuctions.length > 0 || updatedAuctions.length !== allAuctions.length) {
            console.log('New auctions detected! Re-rendering auctions...', {
              current: allAuctions.length,
              updated: updatedAuctions.length,
              new: newAuctions.length
            });
            allAuctions = updatedAuctions;
            // Re-render auctions instead of reloading the page
            renderAuctions(updatedAuctions);
          }
        } catch (error) {
          console.warn('Error polling for new auctions:', error);
        }
      }, 10000);
    }
  }).catch(error => {
    console.error('Failed to load auctions:', error);
    hideSkeletonLoading();
    showErrorState();
  });
})();

/* ======================================================
   RENDER AUCTIONS (FIXED PROPERLY)
====================================================== */

function renderAuctions(allAuctions) {
  const upcomingGrid = document.getElementById("upcoming-auctions");
  const activeGrid = document.getElementById("active-auctions");
  const endedGrid = document.getElementById("ended-auctions");

  if (!upcomingGrid || !activeGrid || !endedGrid) return;

  upcomingGrid.innerHTML = "";
  activeGrid.innerHTML = "";
  endedGrid.innerHTML = "";

  const now = Date.now();
  console.log('🎯 renderAuctions called with', allAuctions.length, 'auctions');
  console.log('⏰ Current time (now):', new Date(now).toISOString());

  const upcoming = [];
  const inProgress = [];
  const ended = [];

  allAuctions.forEach(auction => {
    const startTime = Number(auction.startTime || 0);
    const endTime = Number(auction.endTime || 0);

    let category = 'unknown';

    if (endTime && now >= endTime) {
      // Auction has ended
      ended.push(auction);
      category = 'ENDED';
    } else if (startTime && now >= startTime) {
      // Auction is currently active
      inProgress.push(auction);
      category = 'IN PROGRESS';
    } else if (startTime && now < startTime) {
      // Auction hasn't started yet
      upcoming.push(auction);
      category = 'UPCOMING';
    } else {
      // Fallback: assume active if no clear start time (for backward compatibility)
      inProgress.push(auction);
      category = 'IN PROGRESS (fallback)';
    }

    console.log(`🏷️ Auction "${auction.title}" (ID: ${auction.id}):`, {
      startTime: startTime ? new Date(startTime).toISOString() : 'N/A',
      endTime: endTime ? new Date(endTime).toISOString() : 'N/A',
      currentTime: new Date(now).toISOString(),
      category: category
    });
  });

  console.log(`📊 Categorization complete: ${upcoming.length} upcoming, ${inProgress.length} in progress, ${ended.length} ended`);

  // Render upcoming auctions
  upcoming.forEach(a =>
    upcomingGrid.appendChild(createAuctionCard(a, false, 'upcoming'))
  );

  // Render active auctions
  inProgress.forEach(a =>
    activeGrid.appendChild(createAuctionCard(a, false, 'active'))
  );

  // Render ended auctions
  ended.forEach(a =>
    endedGrid.appendChild(createAuctionCard(a, true, 'ended'))
  );

  // Update watchlist buttons after rendering
  updateWatchlistButtons();
}

/* ======================================================
   CREATE CARD
====================================================== */

function createAuctionCard(auction, isEnded, auctionState = 'active') {
  const card = document.createElement("article");
  card.className = `auction-card auction-${auctionState}`;

  const imageDiv = document.createElement("div");
  imageDiv.className = "auction-image";
  imageDiv.style.cursor = "pointer";
  imageDiv.onclick = () => openLightbox(auction.id);

  console.log(`Auction ${auction.id} image debug:`, {
    hasImageDataUrl: !!auction.imageDataUrl,
    hasImageUrl: !!auction.imageUrl,
    imageDataUrlLength: auction.imageDataUrl ? auction.imageDataUrl.length : 0,
    imageUrlPreview: auction.imageUrl ? auction.imageUrl.substring(0, 50) + '...' : null,
    auctionKeys: Object.keys(auction)
  });

  // Check if image data is valid
  if (auction.imageDataUrl) {
    console.log(`Image data URL starts with: ${auction.imageDataUrl.substring(0, 30)}...`);
    console.log(`Is valid data URL: ${auction.imageDataUrl.startsWith('data:image/')}`);
  }

  if (auction.imageDataUrl && auction.imageDataUrl.trim() !== '') {
    imageDiv.style.backgroundImage = `url('${auction.imageDataUrl}')`;
    console.log(`✓ Set background image for auction ${auction.id} using imageDataUrl (${auction.imageDataUrl.length} chars)`);
    // Add a class to ensure proper styling
    imageDiv.classList.add("has-image");
  } else if (auction.imageUrl && auction.imageUrl.trim() !== '') {
    imageDiv.style.backgroundImage = `url('${auction.imageUrl}')`;
    console.log(`✓ Set background image for auction ${auction.id} using imageUrl: ${auction.imageUrl}`);
    // Add a class to ensure proper styling
    imageDiv.classList.add("has-image");
  } else {
    imageDiv.classList.add("placeholder-image");
    console.log(`⚠ No image data for auction ${auction.id}, using placeholder`);
  }

  // Debug: Check if background image was set
  console.log(`Final background-image for ${auction.id}:`, imageDiv.style.backgroundImage ? 'SET' : 'NOT SET');
  console.log(`Classes on image div:`, imageDiv.className);

  // Watchlist heart icon
  const watchlistBtn = document.createElement("button");
  watchlistBtn.className = "watchlist-btn";
  watchlistBtn.setAttribute("data-auction-id", auction.id);
  watchlistBtn.onclick = (e) => {
    e.stopPropagation();
    toggleWatchlist(auction.id);
  };

  const heartIcon = document.createElement("span");
  heartIcon.className = "heart-icon";
  heartIcon.textContent = isInWatchlist(auction.id) ? "❤️" : "🤍";
  watchlistBtn.appendChild(heartIcon);

  imageDiv.appendChild(watchlistBtn);

  const body = document.createElement("div");
  body.className = "auction-body";

  const titleEl = document.createElement("h2");
  titleEl.textContent = auction.title;

  const artistEl = document.createElement("p");
  artistEl.textContent = `by ${auction.artist}`;

  const metaEl = document.createElement("p");
  metaEl.className = "auction-meta";

  const highestBid = getHighestBid(auction.id);
  const currentBidAmount = highestBid
    ? highestBid.amount
    : auction.currentBidINR || 0;

  const usd = convertINRtoUSD(currentBidAmount);

  metaEl.innerHTML =
    `Current bid: ₹${currentBidAmount.toLocaleString("en-IN")} (≈ $${usd.toFixed(2)})`;

  // Progress bar for countdown
  const progressContainer = document.createElement("div");
  progressContainer.className = "auction-progress";

  const progressBar = document.createElement("div");
  progressBar.className = "auction-progress-bar";
  progressContainer.appendChild(progressBar);

  const timerEl = document.createElement("p");
  timerEl.className = "auction-timer";

  function formatRemaining(ms) {
    if (ms <= 0) return "Auction ended";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s left`;
    if (m > 0) return `${m}m ${s}s left`;
    return `${s}s left`;
  }

  function formatTimeUntil(targetTime) {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) return "Starting now";

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  }

  if (!isEnded) {
    const now = Date.now();

    if (auctionState === 'upcoming') {
      // Show when auction starts
      const startTime = auction.startTime;
      const timeUntilStart = startTime - now;

      if (timeUntilStart > 0) {
        timerEl.textContent = `Starts ${formatTimeUntil(startTime)}`;
        progressBar.style.width = '0%';
        progressContainer.classList.add('normal');
      } else {
        // Should not happen, but fallback
        timerEl.textContent = "Starting soon...";
      }
    } else {
      // Active auction - show countdown
      const remaining = auction.endTime - now;
      const totalDuration = remaining; // We'll track from current point

      const interval = setInterval(() => {
        const currentNow = Date.now();
        const currentRemaining = auction.endTime - currentNow;

        timerEl.textContent = formatRemaining(currentRemaining);

        // Update progress bar (starts full and decreases)
        const progressPercent = Math.max(0, (currentRemaining / totalDuration) * 100);
        progressBar.style.width = `${progressPercent}%`;

        // Update progress bar color based on time remaining
        progressContainer.className = 'auction-progress';
        if (currentRemaining < 300000) { // Less than 5 minutes
          progressContainer.classList.add('urgent');
        } else if (currentRemaining < 1800000) { // Less than 30 minutes
          progressContainer.classList.add('warning');
        } else {
          progressContainer.classList.add('normal');
        }

        if (currentRemaining <= 0) {
          clearInterval(interval);
          progressBar.style.width = '0%';
          progressContainer.classList.add('urgent');
          loadStoredAuctions().then(renderAuctions); // move automatically
        }
      }, 1000);

      // Initial progress
      const initialProgress = Math.max(0, (remaining / totalDuration) * 100);
      progressBar.style.width = `${initialProgress}%`;
    }
  } else {
    timerEl.textContent = "Auction ended";
    progressBar.style.width = '0%';
    progressContainer.classList.add('urgent');
  }

  timerEl.textContent = isEnded
    ? "Auction ended"
    : formatRemaining(auction.endTime - Date.now());

  // Bid History Button
  const historyBtn = document.createElement("button");
  historyBtn.className = "bid-history-btn";

  // Get bid count for initial display
  loadBids().then(bids => {
    const auctionBids = bids[auction.id] || [];
    const bidCount = auctionBids.length;
    historyBtn.textContent = `📊 View Bids ${bidCount > 0 ? `(${bidCount})` : ''}`;
  }).catch(() => {
    historyBtn.textContent = "📊 View Bids";
  });

  historyBtn.setAttribute('data-auction-id', auction.id);
  historyBtn.onclick = (e) => {
    e.stopPropagation();
    toggleBidHistory(auction.id, historyBtn);
  };

  // Bid History Container
  const historyContainer = document.createElement("div");
  historyContainer.className = "bid-history-container";
  historyContainer.id = `history-${auction.id}`;

  const btn = document.createElement("button");
  btn.className = "auction-btn";

  if (isEnded) {
    btn.disabled = true;
    btn.textContent = "Auction ended";
    btn.style.opacity = "0.5";
  } else if (auctionState === 'upcoming') {
    // Don't show bid button for upcoming auctions
    btn.style.display = 'none';
  } else {
    // Only show bid button for active auctions
    btn.textContent = "Place Bid";
    btn.onclick = () =>
      openBidModal(
        auction.id,
        auction.title,
        auction.artist,
        currentBidAmount
      );
  }

  // Report button
  const reportBtn = document.createElement("button");
  reportBtn.className = "report-btn";
  reportBtn.textContent = "🚨 Report";
  reportBtn.onclick = (e) => {
    e.stopPropagation();
    openReportModal(auction.id, auction.title, auction.artist);
  };

  body.appendChild(titleEl);
  body.appendChild(artistEl);
  body.appendChild(metaEl);
  if (!isEnded) {
    body.appendChild(progressContainer);
  }
  body.appendChild(timerEl);
  body.appendChild(historyBtn);
  body.appendChild(historyContainer);
  body.appendChild(btn);
  body.appendChild(reportBtn);

  card.appendChild(imageDiv);
  card.appendChild(body);

  return card;
}

/* ======================================================
   BID MODAL
====================================================== */

/* ======================================================
   BEAUTIFUL BID MODAL (RESTORED)
====================================================== */

function openBidModal(auctionId, title, artist, currentBid) {
  const existingModal = document.getElementById("bid-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "bid-modal";
  modal.className = "bid-modal-overlay";

  modal.innerHTML = `
    <div class="bid-modal">
      <div class="bid-modal-header">
        <h2>Place Your Bid</h2>
        <button class="bid-modal-close" onclick="closeBidModal()">&times;</button>
      </div>

      <div class="bid-modal-body">
        <div class="bid-artwork-info">
          <h3>${title}</h3>
          <p>by ${artist}</p>
          <p class="bid-current-price">
            Current bid: ₹${currentBid.toLocaleString("en-IN")}
          </p>
        </div>

        <form id="bid-form" class="bid-form">
          <div class="form-row">
            <label for="bidder-name">Your Name</label>
            <input 
              id="bidder-name" 
              type="text" 
              required 
              minlength="2" 
              maxlength="100" 
              placeholder="Enter your name"
            />
          </div>

          <div class="form-row">
            <label for="bidder-email">Email (optional)</label>
            <input 
              id="bidder-email" 
              type="email" 
              maxlength="254" 
              placeholder="your@email.com"
            />
          </div>

          <div class="form-row">
            <label for="bid-amount">Your Bid Amount (INR)</label>
            <input 
              id="bid-amount" 
              type="number" 
              required 
              min="${currentBid + 1}" 
              step="1"
              placeholder="Enter amount"
            />
            <p class="form-hint">
              Minimum bid: ₹${(currentBid + 1).toLocaleString("en-IN")}
            </p>
          </div>

          <div class="bid-modal-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              onclick="closeBidModal()"
            >
              Cancel
            </button>

            <button type="submit" class="btn">
              Place Bid
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle submission
  const form = document.getElementById("bid-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const amount = Math.floor(
      Number(document.getElementById("bid-amount").value)
    );

    const name = document.getElementById("bidder-name").value.trim();
    const email = document.getElementById("bidder-email").value.trim();

    if (!amount || amount <= currentBid) {
      alert(
        `Your bid must be higher than ₹${currentBid.toLocaleString("en-IN")}`
      );
      return;
    }

    if (!name) {
      alert("Please enter your name.");
      return;
    }

    addBidWithNotification(auctionId, amount, name, email)
      .then(() => {
        closeBidModal();

        // Re-render auctions so price updates immediately
        return loadStoredAuctions();
      })
      .then(renderAuctions)
      .catch(err => {
        console.error("Bid error:", err);
        alert("Error placing bid. Please try again.");
      });
  });

  // Close when clicking outside
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeBidModal();
  });
}

function closeBidModal() {
  const modal = document.getElementById("bid-modal");
  if (modal) modal.remove();
}

/* ======================================================
   REPORT MODAL
====================================================== */

function openReportModal(auctionId, title, artist) {
  const existingModal = document.getElementById("report-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "report-modal";
  modal.className = "bid-modal-overlay"; // Reuse bid modal styling

  modal.innerHTML = `
    <div class="bid-modal">
      <div class="bid-modal-header">
        <h2>Report Artwork</h2>
        <button class="bid-modal-close" onclick="closeReportModal()">&times;</button>
      </div>

      <div class="bid-modal-body">
        <div class="report-artwork-info">
          <h3>"${title}"</h3>
          <p>by ${artist}</p>
        </div>

        <form id="report-form" onsubmit="submitReport(event, '${auctionId}')">
          <div class="form-row">
            <label for="report-reason">Reason for reporting:</label>
            <select id="report-reason" required>
              <option value="">Select a reason...</option>
              <option value="copyright">Copyright infringement - stolen artwork</option>
              <option value="fake">Fake or misrepresented artwork</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam or misleading listing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-row">
            <label for="report-description">Additional details (optional):</label>
            <textarea id="report-description" rows="4" placeholder="Please provide any additional information that might help us investigate this report..."></textarea>
          </div>

          <div class="form-row">
            <label for="report-email">Your email (for follow-up):</label>
            <input type="email" id="report-email" placeholder="your.email@example.com" required>
          </div>

          <div class="form-row">
            <label for="report-evidence">Evidence links (optional):</label>
            <textarea id="report-evidence" rows="2" placeholder="Links to original artwork, copyright information, etc."></textarea>
          </div>

          <div class="report-notice">
            <p><strong>Important:</strong> False reports may result in account restrictions. We take all reports seriously and will investigate promptly.</p>
          </div>

          <div class="bid-modal-actions">
            <button type="button" class="bid-modal-cancel" onclick="closeReportModal()">Cancel</button>
            <button type="submit" class="bid-modal-submit">Submit Report</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeReportModal() {
  const modal = document.getElementById("report-modal");
  if (modal) modal.remove();
}

function submitReport(event, auctionId) {
  event.preventDefault();

  const reason = document.getElementById('report-reason').value;
  const description = document.getElementById('report-description').value;
  const email = document.getElementById('report-email').value;
  const evidence = document.getElementById('report-evidence').value;

  if (!reason || !email) {
    alert('Please fill in all required fields.');
    return;
  }

  // Create report object
  const report = {
    id: Date.now().toString(),
    auctionId: auctionId,
    reporterEmail: email,
    reason: reason,
    description: description,
    evidence: evidence,
    timestamp: new Date().toISOString(),
    status: 'pending' // pending, investigating, resolved, dismissed
  };

  // Store report in localStorage (in production, this would go to a database)
  const reports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');
  reports.push(report);
  localStorage.setItem('artwork_reports', JSON.stringify(reports));

  console.log('Report submitted:', report);

  alert('Thank you for your report. We will investigate this matter and take appropriate action if necessary.');

  closeReportModal();
}

window.openBidModal = openBidModal;
window.closeBidModal = closeBidModal;

/* ======================================================
   AUCTION FILTERING SYSTEM
====================================================== */

// Global variables for filtering
let currentAuctions = [];
let filteredAuctions = [];
let currentFilters = {
  sortBy: 'ending-soon',
  search: '',
  minPrice: '',
  maxPrice: '',
  status: 'all'
};

// Debounced search function
let searchTimeout;
function debouncedSearch(callback, delay = 300) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(callback, delay);
}

// Initialize filters
function initFilters() {
  const sortBy = document.getElementById('sort-by');
  const searchInput = document.getElementById('search-artwork');
  const minPrice = document.getElementById('min-price');
  const maxPrice = document.getElementById('max-price');
  const statusFilter = document.getElementById('status-filter');
  const clearFilters = document.getElementById('clear-filters');

  if (!sortBy || !searchInput) return; // Not on auctions page

  // Load current auctions
  loadStoredAuctions().then(auctions => {
    currentAuctions = auctions;
    filteredAuctions = [...auctions];
    applyFilters();

    // Set up event listeners
    sortBy.addEventListener('change', (e) => {
      currentFilters.sortBy = e.target.value;
      applyFilters();
    });

    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.toLowerCase();
      debouncedSearch(() => applyFilters());
    });

    minPrice.addEventListener('input', (e) => {
      currentFilters.minPrice = e.target.value;
      debouncedSearch(() => applyFilters());
    });

    maxPrice.addEventListener('input', (e) => {
      currentFilters.maxPrice = e.target.value;
      debouncedSearch(() => applyFilters());
    });

    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      applyFilters();
    });

    clearFilters.addEventListener('click', () => {
      clearAllFilters();
    });
  });
}

function clearAllFilters() {
  currentFilters = {
    sortBy: 'ending-soon',
    search: '',
    minPrice: '',
    maxPrice: '',
    status: 'all'
  };

  // Reset form inputs
  document.getElementById('sort-by').value = 'ending-soon';
  document.getElementById('search-artwork').value = '';
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  document.getElementById('status-filter').value = 'all';

  applyFilters();
}

function applyFilters() {
  let filtered = [...currentAuctions];

  // Apply search filter
  if (currentFilters.search) {
    filtered = filtered.filter(auction =>
      auction.title.toLowerCase().includes(currentFilters.search) ||
      auction.artist.toLowerCase().includes(currentFilters.search)
    );
  }

  // Apply price filters
  if (currentFilters.minPrice) {
    const minPrice = parseInt(currentFilters.minPrice);
    filtered = filtered.filter(auction => {
      const highestBid = getHighestBid(auction.id);
      const currentPrice = highestBid ? highestBid.amount : (auction.currentBidINR || 0);
      return currentPrice >= minPrice;
    });
  }

  if (currentFilters.maxPrice) {
    const maxPrice = parseInt(currentFilters.maxPrice);
    filtered = filtered.filter(auction => {
      const highestBid = getHighestBid(auction.id);
      const currentPrice = highestBid ? highestBid.amount : (auction.currentBidINR || 0);
      return currentPrice <= maxPrice;
    });
  }

  // Apply status filter
  const now = Date.now();
  if (currentFilters.status === 'active') {
    filtered = filtered.filter(auction => {
      const endTime = Number(auction.endTime || 0);
      return endTime > now;
    });
  } else if (currentFilters.status === 'ended') {
    filtered = filtered.filter(auction => {
      const endTime = Number(auction.endTime || 0);
      return endTime <= now;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (currentFilters.sortBy) {
      case 'ending-soon':
        return (a.endTime || 0) - (b.endTime || 0);
      case 'newest':
        return (b.endTime || 0) - (a.endTime || 0); // Assuming endTime correlates with creation time
      case 'highest-bid': {
        const aBid = getHighestBid(a.id);
        const bBid = getHighestBid(b.id);
        const aPrice = aBid ? aBid.amount : (a.currentBidINR || 0);
        const bPrice = bBid ? bBid.amount : (b.currentBidINR || 0);
        return bPrice - aPrice;
      }
      case 'lowest-bid': {
        const aBid = getHighestBid(a.id);
        const bBid = getHighestBid(b.id);
        const aPrice = aBid ? aBid.amount : (a.currentBidINR || 0);
        const bPrice = bBid ? bBid.amount : (b.currentBidINR || 0);
        return aPrice - bPrice;
      }
      default:
        return 0;
    }
  });

  filteredAuctions = filtered;
  renderFilteredAuctions(filteredAuctions);
}

function renderFilteredAuctions(auctions) {
  // Update results count
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = `Showing ${auctions.length} of ${currentAuctions.length} auctions`;
  }

  // Re-render auctions
  renderAuctions(auctions);
}

/* ======================================================
   NOTIFICATION SYSTEM
====================================================== */

function showNotification(message, icon = '💰', duration = 5000) {
  const toast = document.getElementById('notification-toast');
  if (!toast) return;

  const textElement = toast.querySelector('.notification-text');
  const iconElement = toast.querySelector('.notification-icon');

  textElement.textContent = message;
  iconElement.textContent = icon;

  toast.classList.remove('hidden');
  toast.classList.add('show');

  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => {
      hideNotification();
    }, duration);
  }
}

function hideNotification() {
  const toast = document.getElementById('notification-toast');
  if (!toast) return;

  toast.classList.remove('show');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 300); // Match transition duration
}

/* ======================================================
   WATCHLIST/FAVORITES SYSTEM
====================================================== */

const WATCHLIST_KEY = "surrealbid_watchlist";

function getWatchlist() {
  try {
    const watchlist = localStorage.getItem(WATCHLIST_KEY);
    return watchlist ? JSON.parse(watchlist) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(watchlist) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.warn('Failed to save watchlist:', error);
  }
}

function isInWatchlist(auctionId) {
  const watchlist = getWatchlist();
  return watchlist.includes(auctionId);
}

function toggleWatchlist(auctionId) {
  const watchlist = getWatchlist();
  const index = watchlist.indexOf(auctionId);

  if (index > -1) {
    // Remove from watchlist
    watchlist.splice(index, 1);
    showNotification("Removed from watchlist", "💔", 3000);
  } else {
    // Add to watchlist
    watchlist.push(auctionId);
    showNotification("Added to watchlist", "❤️", 3000);
  }

  saveWatchlist(watchlist);
  updateWatchlistButtons();
}

function updateWatchlistButtons() {
  const watchlist = getWatchlist();
  const buttons = document.querySelectorAll('.watchlist-btn');

  buttons.forEach(button => {
    const auctionId = button.getAttribute('data-auction-id');
    const heartIcon = button.querySelector('.heart-icon');

    if (heartIcon) {
      heartIcon.textContent = watchlist.includes(auctionId) ? "❤️" : "🤍";
    }
  });
}

/* ======================================================
   IMAGE LIGHTBOX
====================================================== */

let currentLightboxIndex = 0;
let currentAuctionsList = [];

function openLightbox(auctionId) {
  // Find auction data
  loadStoredAuctions().then(auctions => {
    currentAuctionsList = auctions;
    currentLightboxIndex = auctions.findIndex(a => String(a.id) === String(auctionId));

    if (currentLightboxIndex === -1) return;

    showLightboxImage(auctions[currentLightboxIndex]);
  });
}

function showLightboxImage(auction) {
  const overlay = document.getElementById('image-lightbox');
  const image = document.getElementById('lightbox-image');
  const title = document.getElementById('lightbox-title');
  const artist = document.getElementById('lightbox-artist');
  const price = document.getElementById('lightbox-price');

  // Set image source
  if (auction.imageDataUrl) {
    image.src = auction.imageDataUrl;
  } else if (auction.imageUrl) {
    image.src = auction.imageUrl;
  } else {
    image.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
  }

  // Set auction info
  title.textContent = auction.title || 'Untitled';
  artist.textContent = `by ${auction.artist || 'Unknown Artist'}`;

  // Get current bid
  getHighestBid(auction.id).then(highestBid => {
    const currentAmount = highestBid ? highestBid.amount : (auction.currentBidINR || 0);
    const usdAmount = convertINRtoUSD(currentAmount);
    price.textContent = `Current bid: ₹${currentAmount.toLocaleString('en-IN')} (≈ $${usdAmount.toFixed(2)})`;
  });

  // Show lightbox
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('show'), 10);
}

function closeLightbox() {
  const overlay = document.getElementById('image-lightbox');
  overlay.classList.remove('show');
  setTimeout(() => overlay.classList.add('hidden'), 300);
}

function navigateLightbox(direction) {
  if (currentAuctionsList.length === 0) return;

  currentLightboxIndex += direction;

  // Wrap around
  if (currentLightboxIndex < 0) {
    currentLightboxIndex = currentAuctionsList.length - 1;
  } else if (currentLightboxIndex >= currentAuctionsList.length) {
    currentLightboxIndex = 0;
  }

  showLightboxImage(currentAuctionsList[currentLightboxIndex]);
}

// Close lightbox on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowLeft') {
    navigateLightbox(-1);
  } else if (e.key === 'ArrowRight') {
    navigateLightbox(1);
  }
});

// Close lightbox when clicking outside
document.getElementById('image-lightbox')?.addEventListener('click', (e) => {
  if (e.target.id === 'image-lightbox') {
    closeLightbox();
  }
});

/* ======================================================
   ANIMATED BID HISTORY
====================================================== */

async function toggleBidHistory(auctionId, button) {
  const container = document.getElementById(`history-${auctionId}`);
  const isVisible = container.classList.contains('visible');

  const bids = await loadBids();
  const auctionBids = bids[auctionId] || [];
  const bidCount = auctionBids.length;

  if (isVisible) {
    // Hide history
    container.classList.remove('visible');
    container.classList.add('hiding');
    button.textContent = `📊 View Bids ${bidCount > 0 ? `(${bidCount})` : ''}`;

    setTimeout(() => {
      container.classList.remove('hiding');
      container.innerHTML = '';
    }, 300);
  } else {
    // Show history
    if (auctionBids.length === 0) {
      container.innerHTML = '<div class="no-bids">No bids yet</div>';
    } else {
      // Show last 5 bids
      const recentBids = auctionBids.slice(-5).reverse();
      container.innerHTML = recentBids.map((bid, index) => `
        <div class="bid-entry animate-in" style="animation-delay: ${index * 0.1}s">
          <div class="bid-info">
            <span class="bid-amount">₹${bid.amount.toLocaleString('en-IN')}</span>
            <span class="bid-time">${formatTimeAgo(bid.timestamp)}</span>
          </div>
          <div class="bidder">${bid.bidderName || 'Anonymous'}</div>
        </div>
      `).join('');
    }

    container.classList.add('visible');
    button.textContent = "📊 Hide Bids";
  }
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function updateBidHistoryIfVisible(auctionId) {
  const container = document.getElementById(`history-${auctionId}`);
  const button = document.querySelector(`[data-auction-id="${auctionId}"].bid-history-btn`);

  if (container && container.classList.contains('visible') && button) {
    // Refresh the bid history display
    toggleBidHistory(auctionId, button);
    setTimeout(() => toggleBidHistory(auctionId, button), 100);
  }
}

function highlightNewBid(auctionId) {
  const container = document.getElementById(`history-${auctionId}`);
  if (container && container.classList.contains('visible')) {
    // Add a highlight effect to the latest bid entry
    const bidEntries = container.querySelectorAll('.bid-entry');
    if (bidEntries.length > 0) {
      const latestBid = bidEntries[0]; // First one is the most recent
      latestBid.classList.add('new-bid-highlight');

      // Remove highlight after animation
      setTimeout(() => {
        latestBid.classList.remove('new-bid-highlight');
      }, 3000);
    }

    // Add a pulse effect to the button
    const button = document.querySelector(`[data-auction-id="${auctionId}"].bid-history-btn`);
    if (button) {
      button.classList.add('pulse-notification');
      setTimeout(() => {
        button.classList.remove('pulse-notification');
      }, 2000);
    }
  }
}


// Initialize JSONBin.io bin if it doesn't exist
async function initializeJsonBin() {
  try {
    console.log('Checking JSONBin.io bin...');

    // Try to load existing data
    const existingData = await loadStoredAuctions();

    if (existingData.length === 0) {
      console.log('Bin is empty or doesn\'t exist, initializing with empty auctions array...');
      // Initialize with empty auctions array
      await saveStoredAuctions([]);
      console.log('✓ JSONBin.io bin initialized');
    } else {
      console.log('✓ JSONBin.io bin already contains data');
    }
  } catch (error) {
    console.error('Failed to initialize JSONBin.io:', error);
  }
}

// Run initialization on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeJsonBin, 500); // Initialize after short delay
  });
} else {
  setTimeout(initializeJsonBin, 500);
}

// ======================================================
// DAILY ACTIVITY STATS FUNCTIONS
// ======================================================

// Get today's date string (YYYY-MM-DD)
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Check if a timestamp is from today
function isToday(timestamp) {
  const today = getTodayString();
  const bidDate = new Date(timestamp).toISOString().split('T')[0];
  return bidDate === today;
}

// Count unique bidders today
async function getTodaysUniqueBidders() {
  try {
    const auctions = await loadStoredAuctions();
    const today = getTodayString();
    const uniqueBidders = new Set();

    auctions.forEach(auction => {
      if (auction.bids && Array.isArray(auction.bids)) {
        auction.bids.forEach(bid => {
          if (isToday(bid.timestamp)) {
            // Use bidder name or email as identifier
            const bidderId = bid.bidderName || bid.bidderEmail || 'Anonymous';
            uniqueBidders.add(bidderId);
          }
        });
      }
    });

    return uniqueBidders.size;
  } catch (error) {
    console.error('Error counting unique bidders:', error);
    return 0;
  }
}

// Count total bids today
async function getTodaysBidCount() {
  try {
    const auctions = await loadStoredAuctions();
    const today = getTodayString();
    let totalBids = 0;

    auctions.forEach(auction => {
      if (auction.bids && Array.isArray(auction.bids)) {
        auction.bids.forEach(bid => {
          if (isToday(bid.timestamp)) {
            totalBids++;
          }
        });
      }
    });

    return totalBids;
  } catch (error) {
    console.error('Error counting today\'s bids:', error);
    return 0;
  }
}

// Count active auctions
async function getActiveAuctionCount() {
  try {
    const auctions = await loadStoredAuctions();
    const now = Date.now();
    let activeCount = 0;

    auctions.forEach(auction => {
      if (!auction.ended && auction.endTime > now) {
        activeCount++;
      }
    });

    return activeCount;
  } catch (error) {
    console.error('Error counting active auctions:', error);
    return 0;
  }
}

// Calculate total value of today's bids
async function getTodaysTotalValue() {
  try {
    const auctions = await loadStoredAuctions();
    const today = getTodayString();
    let totalValue = 0;

    auctions.forEach(auction => {
      if (auction.bids && Array.isArray(auction.bids)) {
        auction.bids.forEach(bid => {
          if (isToday(bid.timestamp)) {
            totalValue += bid.amount;
          }
        });
      }
    });

    // Format as rupees (L for lakhs, K for thousands)
    if (totalValue >= 100000) {
      return `₹${(totalValue / 100000).toFixed(1)}L`;
    } else if (totalValue >= 1000) {
      return `₹${(totalValue / 1000).toFixed(0)}K`;
    } else {
      return `₹${totalValue.toLocaleString('en-IN')}`;
    }
  } catch (error) {
    console.error('Error calculating total value:', error);
    return '₹0';
  }
}

// Update daily stats display
async function updateDailyStats() {
  try {
    const [uniqueBidders, activeAuctions, totalValue] = await Promise.all([
      getTodaysUniqueBidders(),
      getActiveAuctionCount(),
      getTodaysTotalValue()
    ]);

    const bidsElement = document.getElementById('today-bids');
    const auctionsElement = document.getElementById('active-auctions');
    const valueElement = document.getElementById('total-value');

    if (bidsElement) {
      bidsElement.textContent = uniqueBidders;
      // Add animation for number changes
      bidsElement.style.animation = 'none';
      setTimeout(() => bidsElement.style.animation = '', 10);
    }

    if (auctionsElement) {
      auctionsElement.textContent = activeAuctions;
      auctionsElement.style.animation = 'none';
      setTimeout(() => auctionsElement.style.animation = '', 10);
    }

    if (valueElement) {
      valueElement.textContent = totalValue;
      valueElement.style.animation = 'none';
      setTimeout(() => valueElement.style.animation = '', 10);
    }

    console.log(`📊 Daily stats updated: ${uniqueBidders} unique bidders, ${activeAuctions} active auctions, ${totalValue} total value`);
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}

// ======================================================
// TOP BIDDERS TICKER FUNCTIONS
// ======================================================

// Get top bidders from all auctions
async function getTopBidders(limit = 15) {
  try {
    const auctions = await loadStoredAuctions();
    const biddersMap = new Map();

    // Collect all bids from all auctions
    auctions.forEach(auction => {
      if (auction.bids && Array.isArray(auction.bids)) {
        auction.bids.forEach(bid => {
          const bidderName = bid.bidderName || bid.bidderEmail || 'Anonymous';
          const currentAmount = biddersMap.get(bidderName) || 0;

          if (bid.amount > currentAmount) {
            biddersMap.set(bidderName, {
              name: bidderName,
              amount: bid.amount,
              lastBidTime: bid.timestamp,
              totalBids: (biddersMap.get(bidderName)?.totalBids || 0) + 1
            });
          } else if (bid.amount === currentAmount) {
            // Same amount, increment bid count
            const existing = biddersMap.get(bidderName);
            if (existing) {
              existing.totalBids = (existing.totalBids || 0) + 1;
            }
          }
        });
      }
    });

    // Convert to array and sort by amount (highest first)
    const topBidders = Array.from(biddersMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);

    return topBidders;
  } catch (error) {
    console.error('Error getting top bidders:', error);
    return [];
  }
}

// Animated counter function
function animateCounter(element, targetValue, duration = 1000) {
  if (!element) return;

  const startValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
  const difference = targetValue - startValue;

  if (difference === 0) return; // No change needed

  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (difference * easeOut));

    element.textContent = targetValue >= 1000 ?
      `₹${(currentValue / 100).toFixed(0)}` :
      `₹${currentValue.toLocaleString('en-IN')}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // Animation complete
      element.classList.add('updating');
      setTimeout(() => element.classList.remove('updating'), 600);
    }
  }

  requestAnimationFrame(update);
}

// Update bidders ticker display
async function updateBiddersTicker() {
  try {
    const topBidders = await getTopBidders(20); // Get more than displayed for variety
    const track = document.getElementById('bidders-track');
    const countElement = document.getElementById('active-bidders-count');

    if (!track) return;

    // Update active bidders count
    if (countElement) {
      const currentCount = parseInt(countElement.textContent) || 0;
      animateCounter(countElement, topBidders.length, 800);
    }

    // Create bidder items (duplicate for seamless scrolling)
    const bidderItems = topBidders.map((bidder, index) => {
      const rank = index + 1;
      const badge = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `Top ${rank}`;
      const avatarLetter = bidder.name.charAt(0).toUpperCase();

      return `
        <div class="bidder-item" data-bidder="${bidder.name}">
          <div class="bidder-avatar">${avatarLetter}</div>
          <span class="bidder-name">${bidder.name}</span>
          <span class="bidder-amount">₹${bidder.amount.toLocaleString('en-IN')}</span>
          <span class="bidder-badge">${badge}</span>
        </div>
      `;
    }).join('');

    // Duplicate items for seamless scrolling
    track.innerHTML = bidderItems + bidderItems;

    console.log(`🏆 Updated bidders ticker with ${topBidders.length} top bidders`);

  } catch (error) {
    console.error('Error updating bidders ticker:', error);
  }
}

// Initialize bidders ticker on auctions page
function initializeBiddersTicker() {
  // Update immediately
  updateBiddersTicker();

  // Update every 30 seconds
  setInterval(updateBiddersTicker, 30000);

  // Also update when auctions are refreshed
  const originalRenderAuctions = window.renderAuctions;
  if (originalRenderAuctions) {
    window.renderAuctions = function(...args) {
      originalRenderAuctions.apply(this, args);
      // Update ticker after auctions are rendered
      setTimeout(updateBiddersTicker, 500);
    };
  }
}

// Debug function to test JSONBin.io connection
async function debugJsonBinConnection() {
  console.log('🔍 Testing JSONBin.io connection...');
  console.log('Bin ID:', SHARED_STORAGE_BIN_ID);
  console.log('API Key length:', SHARED_STORAGE_API_KEY.length);
  console.log('API Key starts with:', SHARED_STORAGE_API_KEY.substring(0, 10));
  console.log('Current API URL:', `${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`);

  // Check if credentials look valid
  if (SHARED_STORAGE_API_KEY === '$2a$10$dwfI5DnmcSV.xrlrteOKBOW0qrUqwdylnR4Zz.AsmSbD9RAJM7yG6') {
    console.error('❌ ERROR: You are still using the placeholder API key!');
    console.error('Please update SHARED_STORAGE_API_KEY with your real API key from https://jsonbin.io/api-keys');
    return;
  }

  if (SHARED_STORAGE_BIN_ID === '699063ae43b1c97be97e71d0') {
    console.error('❌ ERROR: You are still using the placeholder bin ID!');
    console.error('Please update SHARED_STORAGE_BIN_ID with your real bin ID from the JSONBin.io URL');
    return;
  }

  if (!SHARED_STORAGE_API_KEY.startsWith('$2a$')) {
    console.error('❌ ERROR: API key format looks incorrect!');
    console.error('JSONBin.io API keys should start with "$2a$"');
    return;
  }

  console.log('🔄 Testing different API endpoints...');

  for (const apiUrl of ALTERNATIVE_APIS) {
    console.log(`\n📡 Testing endpoint: ${apiUrl}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout for testing

      const response = await fetch(`${apiUrl}/${SHARED_STORAGE_BIN_ID}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': SHARED_STORAGE_API_KEY,
          'X-Bin-Meta': 'false',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`Status: ${response.status}`);

      if (response.ok) {
        console.log(`✅ SUCCESS with endpoint: ${apiUrl}`);
        console.log('🎉 This endpoint works! Consider updating SHARED_STORAGE_API to:', apiUrl);

        const data = await response.json();
        console.log('Data preview:', data);
        return; // Stop testing other endpoints
      } else {
        console.log(`❌ Failed with ${apiUrl}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error with ${apiUrl}: ${error.message}`);
    }
  }

  console.log('\n❌ None of the API endpoints worked. Please check:');
  console.log('1. Your API key is correct and active');
  console.log('2. Your bin ID exists and is accessible');
  console.log('3. Your internet connection is working');
  console.log('4. JSONBin.io service is not down for maintenance');

  try {
    // Test 1: Check if bin exists
    console.log('📡 Test 1: Checking bin accessibility...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': SHARED_STORAGE_API_KEY,
        'X-Bin-Meta': 'false',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bin is accessible!');
      console.log('Current data:', data);

      // Test 2: Try to save test data
      console.log('📡 Test 2: Testing save functionality...');
      const testPayload = {
        auctions: [{ id: 'debug-test', title: 'Debug Test Auction', test: true }],
        updatedAt: Date.now(),
        debug: true
      };

      const saveController = new AbortController();
      const saveTimeoutId = setTimeout(() => saveController.abort(), 10000);

      const saveResponse = await fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': SHARED_STORAGE_API_KEY
        },
        body: JSON.stringify(testPayload),
        signal: saveController.signal
      });

      clearTimeout(saveTimeoutId);

      console.log('Save response status:', saveResponse.status);

      if (saveResponse.ok) {
        console.log('✅ Save functionality works!');
        console.log('🧪 Test data saved successfully. Your setup is working!');
      } else {
        const saveError = await saveResponse.text();
        console.error('❌ Save failed!');
        console.error('Error details:', saveError);
      }

    } else {
      const errorText = await response.text();
      console.error('❌ Bin access failed!');
      console.error('Error details:', errorText);

      if (response.status === 403) {
        console.error('🔐 AUTHENTICATION ERROR: Your API key is invalid or expired');
        console.error('SOLUTION: Get a fresh API key from https://jsonbin.io/api-keys');
      } else if (response.status === 404) {
        console.error('📁 BIN NOT FOUND: Your bin ID is incorrect or bin was deleted');
        console.error('SOLUTION: Create a new bin at https://jsonbin.io/bins and copy the ID');
      } else if (response.status === 429) {
        console.error('⏰ RATE LIMITED: Too many requests');
        console.error('SOLUTION: Wait a few minutes and try again');
      } else {
        console.error('❓ UNKNOWN ERROR:', response.status);
      }
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏰ REQUEST TIMED OUT');
      console.error('SOLUTION: Check your internet connection');
    } else {
      console.error('❌ Network error:', error.message);
    }
  }

  console.log('🔍 Debug complete. Check the messages above for solutions.');
}

// Export functions for global access
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;
window.toggleBidHistory = toggleBidHistory;
window.initializeJsonBin = initializeJsonBin;
window.debugJsonBinConnection = debugJsonBinConnection;

/* ======================================================
   THEME SYSTEM
====================================================== */

const THEME_KEY = "surrealbid_theme";

// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  setTheme(savedTheme);
  updateThemeToggleIcon(savedTheme);

  // Add event listener to theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeToggleIcon(theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  setTheme(newTheme);

  // Add a smooth transition effect
  document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
  setTimeout(() => {
    document.body.style.transition = '';
  }, 300);
}

function updateThemeToggleIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    themeIcon.style.transform = 'rotate(0deg)';
    setTimeout(() => {
      themeIcon.style.transform = 'rotate(360deg)';
    }, 50);
  }
}

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

/* ======================================================
   SKELETON LOADING SYSTEM
====================================================== */

function showSkeletonLoading() {
  const activeGrid = document.getElementById("active-auctions");
  const endedGrid = document.getElementById("ended-auctions");

  if (!activeGrid || !endedGrid) return;

  // Clear existing content
  activeGrid.innerHTML = "";
  endedGrid.innerHTML = "";

  // Add skeleton cards
  for (let i = 0; i < 6; i++) {
    const skeletonCard = createSkeletonCard();
    activeGrid.appendChild(skeletonCard);
  }

  for (let i = 0; i < 3; i++) {
    const skeletonCard = createSkeletonCard();
    endedGrid.appendChild(skeletonCard);
  }

  // Show filter skeletons
  showFilterSkeletons();
}

function hideSkeletonLoading() {
  // Remove all skeleton cards
  const skeletons = document.querySelectorAll('.auction-card-skeleton');
  skeletons.forEach(skeleton => skeleton.remove());

  // Hide filter skeletons
  hideFilterSkeletons();
}

function createSkeletonCard() {
  const card = document.createElement("article");
  card.className = "auction-card auction-card-skeleton";

  card.innerHTML = `
    <div class="skeleton-image"></div>
    <div class="auction-body">
      <div class="skeleton-title"></div>
      <div class="skeleton-artist"></div>
      <div class="skeleton-meta"></div>
      <div class="skeleton-timer"></div>
      <div class="skeleton-button"></div>
    </div>
  `;

  return card;
}

function showFilterSkeletons() {
  const filtersContainer = document.querySelector('.auction-filters');
  if (!filtersContainer) return;

  // Hide real filters initially
  const realFilters = filtersContainer.querySelectorAll('.filter-row');
  realFilters.forEach(filter => filter.style.display = 'none');

  // Add skeleton filters
  const skeletonFilters = document.createElement('div');
  skeletonFilters.className = 'filter-skeleton';
  skeletonFilters.innerHTML = `
    <div class="filter-skeleton-item"></div>
    <div class="filter-skeleton-item"></div>
    <div class="filter-skeleton-item"></div>
    <div class="filter-skeleton-item"></div>
    <div class="filter-skeleton-item"></div>
  `;

  filtersContainer.insertBefore(skeletonFilters, filtersContainer.firstChild);
}

function hideFilterSkeletons() {
  const skeletonFilters = document.querySelector('.filter-skeleton');
  if (skeletonFilters) {
    skeletonFilters.remove();
  }

  // Show real filters
  const realFilters = document.querySelectorAll('.auction-filters .filter-row');
  realFilters.forEach(filter => filter.style.display = '');
}

function showErrorState() {
  const activeGrid = document.getElementById("active-auctions");
  if (activeGrid) {
    activeGrid.innerHTML = `
      <div class="error-state">
        <h3>⚠️ JSONBin.io Connection Failed</h3>
        <p>This could be due to:</p>
        <ul style="text-align: left; margin: 10px 0;">
          <li>❌ Incorrect API key or bin ID</li>
          <li>🌐 Internet connection issues</li>
          <li>🚫 JSONBin.io service unavailable</li>
        </ul>
        <div style="margin: 15px 0;">
          <button onclick="debugJsonBinConnection()" class="btn" style="margin-right: 10px;">🔧 Debug Connection</button>
          <button onclick="location.reload()" class="btn">🔄 Retry</button>
        </div>
        <p style="font-size: 14px; margin-top: 15px;">
          <strong>To fix:</strong> Update <code>SHARED_STORAGE_BIN_ID</code> and <code>SHARED_STORAGE_API_KEY</code> in js/script.js
        </p>
      </div>
    `;
  }
}

// Enhanced bid system with notifications
async function addBidWithNotification(auctionId, amount, bidderName, bidderEmail) {
  const bids = await loadBids();
  const previousHighestBid = await getHighestBid(auctionId);

  if (!bids[auctionId]) bids[auctionId] = [];

  bids[auctionId].push({
    id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    bidderName: bidderName || 'Anonymous',
    bidderEmail: bidderEmail || '',
    timestamp: Date.now()
  });

  await saveBids(bids);

  // Update auction's current bid
  const auctions = await loadStoredAuctions();
  const auctionIndex = auctions.findIndex(a => String(a.id) === String(auctionId));
  if (auctionIndex !== -1) {
    auctions[auctionIndex].currentBidINR = amount;
    await saveStoredAuctions(auctions);
  }

  // Show notification if this is a new highest bid
  if (!previousHighestBid || amount > previousHighestBid.amount) {
    showNotification(
      `New highest bid: ₹${amount.toLocaleString('en-IN')} on "${auctions[auctionIndex]?.title || 'Unknown Auction'}"`,
      '🔥',
      6000
    );

    // Highlight the bid history if it's visible
    highlightNewBid(auctionId);
  }

  return bids[auctionId];
}


// console.log("SurrealBid loaded");

// /* ======================================================
//    CONFIG
// ====================================================== */

// const STORAGE_KEY = "surrealbid_auctions";
// const BIDS_STORAGE_KEY = "surrealbid_bids";

// const SHARED_STORAGE_API = "https://api.jsonbin.io/v3/b";
// const SHARED_STORAGE_BIN_ID = "699063ae43b1c97be97e71d0";
// const SHARED_STORAGE_API_KEY =
//   "$2a$10$dwfI5DnmcSV.xrlrteOKBOW0qrUqwdylnR4Zz.AsmSbD9RAJM7yG6";
// const USE_SHARED_STORAGE = true;

// /* ======================================================
//    EXCHANGE RATE SYSTEM
// ====================================================== */

// const EXCHANGE_RATE_CACHE_KEY = "surrealbid_exchange_rate";
// const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000;
// const DEFAULT_INR_PER_USD = 83;

// let currentExchangeRate = DEFAULT_INR_PER_USD;

// async function getLiveExchangeRate() {
//   try {
//     const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
//     if (cached) {
//       const { rate, timestamp } = JSON.parse(cached);
//       if (Date.now() - timestamp < EXCHANGE_RATE_CACHE_DURATION)
//         return rate;
//     }
//   } catch {}

//   try {
//     const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
//     if (!res.ok) throw new Error("API failed");

//     const data = await res.json();
//     const rate = data?.rates?.INR;

//     if (rate && rate > 70 && rate < 100) {
//       localStorage.setItem(
//         EXCHANGE_RATE_CACHE_KEY,
//         JSON.stringify({ rate, timestamp: Date.now() })
//       );
//       return rate;
//     }
//   } catch {}

//   return DEFAULT_INR_PER_USD;
// }

// async function initExchangeRate() {
//   const rate = await getLiveExchangeRate();
//   currentExchangeRate =
//     rate > 70 && rate < 100 ? rate : DEFAULT_INR_PER_USD;

//   refreshAllDisplayedPrices();
// }

// function convertINRtoUSD(inr) {
//   return inr / currentExchangeRate;
// }

// initExchangeRate();

// /* ======================================================
//    PRICE REFRESH
// ====================================================== */

// function refreshAllDisplayedPrices() {
//   const spans = document.querySelectorAll(".auction-price");

//   spans.forEach(span => {
//     const auctionId = span.dataset.auctionId;
//     if (!auctionId) return;

//     const highest = getHighestBid(auctionId);
//     const auctions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

//     const auction = auctions.find(
//       a => String(a.id) === String(auctionId)
//     );

//     const amount = highest
//       ? highest.amount
//       : auction?.currentBidINR || 0;

//     const usd = convertINRtoUSD(amount);

//     span.textContent =
//       `₹${amount.toLocaleString("en-IN")} (≈ $${usd.toFixed(2)})`;
//   });
// }

// /* ======================================================
//    STORAGE
// ====================================================== */

// async function loadStoredAuctions() {
//   let local = [];

//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (raw) local = JSON.parse(raw);
//   } catch {}

//   if (!USE_SHARED_STORAGE) return local;

//   try {
//     const res = await fetch(
//       `${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}/latest`,
//       {
//         headers: {
//           "X-Master-Key": SHARED_STORAGE_API_KEY,
//           "X-Bin-Meta": "false"
//         }
//       }
//     );

//     if (!res.ok) {
//       console.error("Load failed:", res.status);
//       return local;
//     }

//     const data = await res.json();

//     // 🔥 STRICT FORMAT CHECK
//     if (!data.record || !Array.isArray(data.record.auctions)) {
//       console.warn("JSONBin structure invalid:", data);
//       return local;
//     }

//     const remote = data.record.auctions;

//     // Merge local imageDataUrl
//     const merged = remote.map(r => {
//       const localMatch = local.find(a => a.id === r.id);
//       if (localMatch?.imageDataUrl) {
//         return { ...r, imageDataUrl: localMatch.imageDataUrl };
//       }
//       return r;
//     });

//     // Save merged locally
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

//     return merged;

//   } catch (err) {
//     console.error("Load error:", err);
//     return local;
//   }
// }



// async function saveStoredAuctions(list) {
//   console.log("🔥 saveStoredAuctions CALLED");

//   localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

//   if (!USE_SHARED_STORAGE) {
//     console.log("Shared storage disabled");
//     return;
//   }

//   try {
//     const cleaned = list.map(a => {
//       const copy = { ...a };
//       if (copy.imageDataUrl && copy.imageDataUrl.length > 500000) {
//         delete copy.imageDataUrl;
//       }
//       return copy;
//     });

//     const payload = {
//       auctions: cleaned,
//       updatedAt: Date.now()
//     };

//     console.log("🚀 Sending to JSONBin:", payload);

//     const response = await fetch(
//       `${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Master-Key": SHARED_STORAGE_API_KEY
//         },
//         body: JSON.stringify(payload)
//       }
//     );

//     console.log("📡 Response status:", response.status);

//     const text = await response.text();
//     console.log("📦 Response body:", text);

//   } catch (err) {
//     console.error("❌ JSONBin error:", err);
//   }
// }



// /* ======================================================
//    BIDDING SYSTEM
// ====================================================== */

// function loadBids() {
//   try {
//     return JSON.parse(localStorage.getItem(BIDS_STORAGE_KEY)) || {};
//   } catch {
//     return {};
//   }
// }

// function saveBids(bids) {
//   localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(bids));
// }

// function getHighestBid(id) {
//   const bids = loadBids()[id] || [];
//   if (!bids.length) return null;
//   return bids.reduce((a, b) => (b.amount > a.amount ? b : a));
// }

// async function addBid(id, amount, name, email) {
//   const bids = loadBids();
//   if (!bids[id]) bids[id] = [];

//   bids[id].push({
//     id: `bid-${Date.now()}`,
//     amount,
//     bidderName: name,
//     bidderEmail: email,
//     timestamp: Date.now()
//   });

//   saveBids(bids);

//   const auctions = await loadStoredAuctions();
//   const index = auctions.findIndex(a => a.id === id);
//   if (index !== -1) {
//     auctions[index].currentBidINR = amount;
//     saveStoredAuctions(auctions);
//   }
// }

// /* ======================================================
//    CREATE AUCTION FORM
// ====================================================== */

// /* ======================================================
//    CREATE AUCTION FORM (FIXED + PROPER SYNC)
// ====================================================== */

// /* ======================================================
//    CREATE AUCTION (FULLY FIXED)
// ====================================================== */

// document.addEventListener("DOMContentLoaded", function () {
//   const form = document.getElementById("auction-form");

//   if (!form) {
//     console.log("No auction form found on this page.");
//     return;
//   }

//   console.log("Auction form initialized.");

//   form.addEventListener("submit", async function (e) {
//     e.preventDefault();
//     console.log("🚀 Form submit triggered");

//     const title = document.getElementById("title")?.value.trim();
//     const artist = document.getElementById("artist")?.value.trim();
//     const startBid = Number(document.getElementById("startBid")?.value);
//     const duration = Number(document.getElementById("durationMinutes")?.value);
//     const imageFile = document.getElementById("imageFile")?.files[0];
//     const imageUrl = document.getElementById("imageUrl")?.value.trim();

//     if (!title || !artist || !startBid || !duration) {
//       alert("Please fill all required fields.");
//       return;
//     }

//     const now = Date.now();
//     const endTime = now + duration * 60 * 1000;

//     const newAuction = {
//       id: `auction-${now}`,
//       title,
//       artist,
//       currentBidINR: startBid,
//       endTime
//     };

//     // Load latest auctions first
//     let auctions = [];
//     try {
//       auctions = await loadStoredAuctions();
//     } catch (err) {
//       console.error("Load auctions failed:", err);
//     }

//     function finalizeSave() {
//       auctions.push(newAuction);

//       console.log("Saving auction:", newAuction);

//       saveStoredAuctions(auctions)
//         .then(() => {
//           console.log("✅ Auction saved & synced");
//           window.location.href = "auctions.html";
//         })
//         .catch(err => {
//           console.error("❌ Save failed:", err);
//           alert("Failed to save auction.");
//         });
//     }

//     // If image file uploaded
//     if (imageFile) {
//       const reader = new FileReader();
//       reader.onload = function () {
//         newAuction.imageDataUrl = reader.result;
//         finalizeSave();
//       };
//       reader.onerror = function () {
//         alert("Image reading failed.");
//       };
//       reader.readAsDataURL(imageFile);
//     }
//     // If image URL provided
//     else if (imageUrl) {
//       newAuction.imageUrl = imageUrl;
//       finalizeSave();
//     }
//     // No image
//     else {
//       finalizeSave();
//     }
//   });
// });

// /* ======================================================
//    AUCTION PAGE RENDER
// ====================================================== */

// (function initPage() {
//   const activeGrid = document.getElementById("active-auctions");
//   const endedGrid = document.getElementById("ended-auctions");
//   if (!activeGrid || !endedGrid) return;

//   async function render() {
//     const auctions = await loadStoredAuctions();
//     renderGrouped(auctions);
//   }

//   render();
//   if (USE_SHARED_STORAGE) setInterval(render, 10000);
// })();

// function renderGrouped(auctions) {
//   const activeGrid = document.getElementById("active-auctions");
//   const endedGrid = document.getElementById("ended-auctions");

//   activeGrid.innerHTML = "";
//   endedGrid.innerHTML = "";

//   const now = Date.now();

//   auctions.forEach(a => {
//     const endTime = Number(a.endTime || 0);
//     const isEnded = !endTime || now >= endTime;
//     const card = createCard(a, isEnded);
//     if (isEnded) endedGrid.appendChild(card);
//     else activeGrid.appendChild(card);
//   });
// }

// /* ======================================================
//    CARD CREATION
// ====================================================== */

// function createCard(auction, isEnded) {
//   const card = document.createElement("article");
//   card.className = "auction-card";

//   const img = document.createElement("div");
//   img.className = "auction-image";

//   if (auction.imageDataUrl)
//     img.style.backgroundImage = `url('${auction.imageDataUrl}')`;
//   else if (auction.imageUrl)
//     img.style.backgroundImage = `url('${auction.imageUrl}')`;
//   else img.classList.add("placeholder-image");

//   const body = document.createElement("div");
//   body.className = "auction-body";

//   const title = document.createElement("h2");
//   title.textContent = auction.title;

//   const artist = document.createElement("p");
//   artist.textContent = `by ${auction.artist}`;

//   const highest = getHighestBid(auction.id);
//   const bid = highest ? highest.amount : auction.currentBidINR || 0;
//   const usd = convertINRtoUSD(bid);

//   const price = document.createElement("p");
//   price.className = "auction-meta";
//   price.innerHTML = `
//     Current bid:
//     <span data-auction-id="${auction.id}" class="auction-price">
//       ₹${bid.toLocaleString("en-IN")}
//       (≈ $${usd.toFixed(2)})
//     </span>
//   `;

//   const timer = document.createElement("p");
//   timer.className = "auction-timer";

//   function format(ms) {
//     if (ms <= 0) return "Auction ended";
//     const s = Math.floor(ms / 1000);
//     const h = Math.floor(s / 3600);
//     const m = Math.floor((s % 3600) / 60);
//     const sec = s % 60;
//     if (h > 0) return `${h}h ${m}m ${sec}s left`;
//     if (m > 0) return `${m}m ${sec}s left`;
//     return `${sec}s left`;
//   }

//   if (!isEnded) {
//     setInterval(() => {
//       timer.textContent = format(auction.endTime - Date.now());
//     }, 1000);
//   }

//   timer.textContent = isEnded
//     ? "Auction ended"
//     : format(auction.endTime - Date.now());

//   const btn = document.createElement("button");
//   btn.className = "auction-btn";

//   if (isEnded) {
//     btn.disabled = true;
//     btn.textContent = "Auction ended";
//   } else {
//     btn.textContent = "Place Bid";
//     btn.onclick = () =>
//       openBidModal(auction.id, auction.title, auction.artist, bid);
//   }

//   body.appendChild(title);
//   body.appendChild(artist);
//   body.appendChild(price);
//   body.appendChild(timer);
//   body.appendChild(btn);

//   card.appendChild(img);
//   card.appendChild(body);

//   return card;
// }

// /* ======================================================
//    MODAL UI
// ====================================================== */

// function openBidModal(auctionId, title, artist, currentBid) {
//   const existingModal = document.getElementById("bid-modal");
//   if (existingModal) existingModal.remove();

//   const modal = document.createElement("div");
//   modal.id = "bid-modal";
//   modal.className = "bid-modal-overlay";

//   modal.innerHTML = `
//     <div class="bid-modal">
//       <div class="bid-modal-header">
//         <h2>Place Your Bid</h2>
//         <button class="bid-modal-close" onclick="closeBidModal()">&times;</button>
//       </div>
//       <div class="bid-modal-body">
//         <div class="bid-artwork-info">
//           <h3>${title}</h3>
//           <p>by ${artist}</p>
//           <p class="bid-current-price">
//             Current bid: ₹${currentBid.toLocaleString("en-IN")}
//           </p>
//         </div>

//         <form id="bid-form" class="bid-form">
//           <div class="form-row">
//             <label>Your Name</label>
//             <input id="bidder-name" type="text" required minlength="2" maxlength="100" />
//           </div>

//           <div class="form-row">
//             <label>Email (optional)</label>
//             <input id="bidder-email" type="email" maxlength="254" />
//           </div>

//           <div class="form-row">
//             <label>Your Bid Amount (INR)</label>
//             <input id="bid-amount" type="number" required min="${currentBid + 1}" />
//             <p class="form-hint">
//               Minimum bid: ₹${(currentBid + 1).toLocaleString("en-IN")}
//             </p>
//           </div>

//           <div class="bid-modal-actions">
//             <button type="button" class="btn btn-secondary" onclick="closeBidModal()">Cancel</button>
//             <button type="submit" class="btn">Place Bid</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   `;

//   document.body.appendChild(modal);

//   document.getElementById("bid-form").addEventListener("submit", function (e) {
//     e.preventDefault();

//     const amount = Math.floor(
//       Number(document.getElementById("bid-amount").value)
//     );
//     const name = document.getElementById("bidder-name").value.trim();
//     const email = document.getElementById("bidder-email").value.trim();

//     if (!amount || amount <= currentBid) {
//       alert("Bid must be higher than current bid.");
//       return;
//     }

//     addBid(auctionId, amount, name, email).then(() => {
//       refreshAllDisplayedPrices();
//       closeBidModal();
//     });
//   });

//   modal.addEventListener("click", function (e) {
//     if (e.target === modal) closeBidModal();
//   });
// }

// ======================================================
// CONTACT FORM FUNCTIONS
// ======================================================

// Initialize contact form when navigating to contact page
// Update navigateTo function to call this
if (path === '/contact') {
  setTimeout(() => {
    initContactForm();
  }, 100);
}

// Contact form initialization
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  console.log('Initializing contact form');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateContactForm()) {
      console.log('Contact form validation failed');
      return;
    }

    const submitBtn = document.getElementById('contact-submit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
      const formData = new FormData(form);
      const contactData = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        subject: formData.get('subject'),
        message: formData.get('message').trim(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        source: 'contact_form',
        status: 'unread'
      };

      console.log('Submitting contact form:', contactData);

      // Save to JSONBin.io
      await saveContactToJSONBin(contactData);

      console.log('Contact form submitted successfully');

      // Show success message
      form.style.display = 'none';
      document.getElementById('contact-success').style.display = 'block';

      // Track the event
      trackContactEvent('submitted', { subject: contactData.subject });

    } catch (error) {
      console.error('Contact form submission error:', error);
      alert('Sorry, there was an error sending your message. Please try again or contact us directly at hardiksingh850@gmail.com');
    } finally {
      // Reset loading state
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  });

  // Real-time validation
  form.addEventListener('input', function(e) {
    validateContactField(e.target);
  });

  form.addEventListener('change', function(e) {
    validateContactField(e.target);
  });
}

// Contact form validation
function validateContactForm() {
  const fields = ['contact-name', 'contact-email', 'contact-subject', 'contact-message'];
  let isValid = true;

  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!validateContactField(field)) {
      isValid = false;
    }
  });

  return isValid;
}

// Validate individual contact field
function validateContactField(field) {
  const value = field.value.trim();
  const errorElement = document.getElementById(field.id + '-error');

  if (!errorElement) return true;

  // Clear previous errors
  field.classList.remove('error');
  errorElement.textContent = '';

  // Required field validation
  if (field.hasAttribute('required') && !value) {
    field.classList.add('error');
    errorElement.textContent = 'This field is required';
    return false;
  }

  // Email validation
  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      field.classList.add('error');
      errorElement.textContent = 'Please enter a valid email address';
      return false;
    }
  }

  // Message length validation
  if (field.id === 'contact-message' && value && value.length < 10) {
    field.classList.add('error');
    errorElement.textContent = 'Please provide a more detailed message (at least 10 characters)';
    return false;
  }

  return true;
}

// Real-time validation for auction form
function initAuctionFormValidation() {
  const form = document.getElementById('auction-form');
  if (!form) return;

  // Add real-time validation to form fields
  const fields = ['title', 'artist', 'artistEmail', 'startBid', 'durationMinutes', 'auctionStartDate'];

  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => validateAuctionField(field));
      field.addEventListener('input', () => {
        // Clear error styling on input
        if (field.classList.contains('error')) {
          field.classList.remove('error');
          const errorElement = document.getElementById(field.id + '-error');
          if (errorElement) errorElement.textContent = '';
        }
      });
    }
  });
}

// Validate individual auction form field
function validateAuctionField(field) {
  const value = field.value.trim();
  const errorElement = document.getElementById(field.id + '-error');

  if (!errorElement) return true;

  // Clear previous errors
  field.classList.remove('error');
  errorElement.textContent = '';

  // Required field validation
  if (field.hasAttribute('required') && !value) {
    field.classList.add('error');
    errorElement.textContent = 'This field is required';
    return false;
  }

  // Title validation
  if (field.id === 'title') {
    if (value.length < 5) {
      field.classList.add('error');
      errorElement.textContent = 'Title must be at least 5 characters long';
      return false;
    }
    if (value.length > 100) {
      field.classList.add('error');
      errorElement.textContent = 'Title must be less than 100 characters';
      return false;
    }
  }

  // Artist validation
  if (field.id === 'artist') {
    if (value.length < 2) {
      field.classList.add('error');
      errorElement.textContent = 'Artist name must be at least 2 characters long';
      return false;
    }
    if (value.length > 50) {
      field.classList.add('error');
      errorElement.textContent = 'Artist name must be less than 50 characters';
      return false;
    }
  }

  // Email validation
  if (field.id === 'artistEmail') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      field.classList.add('error');
      errorElement.textContent = 'Please enter a valid email address';
      return false;
    }
  }

  // Bid validation
  if (field.id === 'startBid') {
    const bid = parseFloat(value);
    if (isNaN(bid) || bid < 100) {
      field.classList.add('error');
      errorElement.textContent = 'Starting bid must be at least ₹100';
      return false;
    }
    if (bid > 1000000) {
      field.classList.add('error');
      errorElement.textContent = 'Starting bid cannot exceed ₹10,00,000';
      return false;
    }
  }

  // Duration validation
  if (field.id === 'durationMinutes') {
    const duration = parseInt(value);
    if (isNaN(duration) || duration < 1) {
      field.classList.add('error');
      errorElement.textContent = 'Duration must be at least 1 minute';
      return false;
    }
  }

  return true;
}

// Reset contact form
function resetContactForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');

  if (form) {
    form.reset();
    form.style.display = 'block';

    // Clear validation errors
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  }

  if (success) {
    success.style.display = 'none';
  }
}

// Save contact to JSONBin.io
async function saveContactToJSONBin(contactData) {
  // Create a separate bin for contacts (you'll need to create this in JSONBin.io)
  // For now, we'll use the same API endpoint pattern as auctions
  // You'll need to create a new bin in JSONBin.io and update these values
  const CONTACT_BIN_ID = 'your-contact-bin-id'; // Replace with your contact bin ID
  const CONTACT_API_KEY = 'your-contact-api-key'; // Replace with your contact API key

  // For demo purposes, we'll save to localStorage first
  // In production, replace this with actual JSONBin.io calls

  console.log('Saving contact to storage...');

  // Get existing contacts from localStorage (temporary)
  let contacts = [];
  try {
    const stored = localStorage.getItem('surrealbid_contacts');
    if (stored) {
      contacts = JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Could not load contacts from storage:', error);
  }

  // Add new contact
  contacts.push(contactData);

  // Save back to localStorage (temporary)
  try {
    localStorage.setItem('surrealbid_contacts', JSON.stringify(contacts));
    console.log('Contact saved to localStorage (temporary)');
  } catch (error) {
    console.error('Could not save contact:', error);
    throw error;
  }

  // TODO: Replace with actual JSONBin.io implementation when you create the bin
  /*
  try {
    // First, try to get existing contacts
    const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${CONTACT_BIN_ID}`, {
      method: 'GET',
      headers: {
        'X-Master-Key': CONTACT_API_KEY
      }
    });

    let contacts = [];
    if (getResponse.ok) {
      const data = await getResponse.json();
      contacts = data.record || [];
    }

    // Add new contact
    contacts.push(contactData);

    // Save back to JSONBin
    const saveResponse = await fetch(`https://api.jsonbin.io/v3/b/${CONTACT_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONTACT_API_KEY
      },
      body: JSON.stringify(contacts)
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save contact message');
    }

    console.log('Contact saved to JSONBin.io');
  } catch (error) {
    console.error('JSONBin.io contact save error:', error);
    throw error;
  }
  */
}

// Track contact events
function trackContactEvent(event, data) {
  console.log(`Contact ${event}:`, data);
  // Here you can integrate with analytics services like Plausible
  // if (window.plausible) {
  //   window.plausible('Contact Form', { props: { event, ...data } });
  // }
}

// Make functions globally available
window.resetContactForm = resetContactForm;

// ======================================================
// ARTIST REGISTRATION SYSTEM
// ======================================================

// Initialize global state immediately
(function() {
  console.log('🎨 Initializing artist registration global state...');
  window.currentRegistrationStep = 1;
  window.artistPortfolioImages = [];
})();

// Global artist registration state (using var for better hoisting)
var currentRegistrationStep = 1;
var artistPortfolioImages = [];

// Initialize artist registration
function initArtistRegistration() {
  console.log('🎨 Initializing artist registration');

  // Reset form state
  currentRegistrationStep = 1;
  artistPortfolioImages = [];

  // Show first step
  showRegistrationStep(1);

  // Initialize portfolio upload
  initPortfolioUpload();

  // Clear any previous form data
  clearArtistRegistrationForm();

  // Test button functionality
  console.log('🔧 Testing button connections...');
  const nextButtons = document.querySelectorAll('button[onclick*="nextRegistrationStep"]');
  console.log('📋 Found next buttons:', nextButtons.length);

  const prevButtons = document.querySelectorAll('button[onclick*="prevRegistrationStep"]');
  console.log('📋 Found prev buttons:', prevButtons.length);
}

// Show specific registration step
function showRegistrationStep(step) {
  // Hide all steps
  document.querySelectorAll('.registration-step').forEach(stepEl => {
    stepEl.style.display = 'none';
  });

  // Show target step
  const targetStep = document.getElementById(`step-${getStepName(step)}`);
  if (targetStep) {
    targetStep.style.display = 'block';
    currentRegistrationStep = step;
  }
}

// Get step name from number
function getStepName(stepNumber) {
  const stepNames = ['', 'basic', 'artistic', 'identity', 'portfolio'];
  return stepNames[stepNumber] || 'basic';
}

// Navigate to next step
function nextRegistrationStep() {
  // Safety check - ensure variable exists
  if (typeof currentRegistrationStep === 'undefined') {
    console.error('❌ currentRegistrationStep not initialized, initializing now...');
    currentRegistrationStep = 1;
  }

  console.log('🔄 nextRegistrationStep called, current step:', currentRegistrationStep);

  const isValid = validateCurrentStep();
  console.log('✅ Validation result:', isValid);

  if (isValid) {
    if (currentRegistrationStep < 4) {
      const nextStep = currentRegistrationStep + 1;
      console.log('📈 Moving to step:', nextStep);
      showRegistrationStep(nextStep);
      updateStepIndicator(nextStep);
    } else {
      console.log('🏁 Already on final step');
    }
  } else {
    console.log('❌ Validation failed, staying on current step');
  }
}

// Navigate to previous step
function prevRegistrationStep() {
  if (currentRegistrationStep > 1) {
    const prevStep = currentRegistrationStep - 1;
    showRegistrationStep(prevStep);
    updateStepIndicator(prevStep);
  }
}

// Update step indicator
function updateStepIndicator(activeStep) {
  // Update all steps
  for (let i = 1; i <= 3; i++) {
    const stepElement = document.getElementById(`step-indicator-${i}`);
    const circleElement = stepElement.querySelector('.step-circle');

    stepElement.classList.remove('active');
    circleElement.classList.remove('active', 'completed', 'inactive');

    if (i < activeStep) {
      // Completed steps
      circleElement.classList.add('completed');
      stepElement.classList.add('completed');
    } else if (i === activeStep) {
      // Active step
      circleElement.classList.add('active');
      stepElement.classList.add('active');
    } else {
      // Inactive steps
      circleElement.classList.add('inactive');
    }
  }
}

// Validate current step
function validateCurrentStep() {
  console.log('🔍 Validating step:', currentRegistrationStep);

  switch (currentRegistrationStep) {
    case 1:
      return validateBasicInfoStep();
    case 2:
      return validateArtisticProfileStep();
    case 3:
      return validateIdentityStep();
    case 4:
      return validatePortfolioStep();
    default:
      console.log('❌ Invalid step number:', currentRegistrationStep);
      return false;
  }
}

// Validate basic info step
function validateBasicInfoStep() {
  console.log('🔍 Validating basic info step');

  const fullname = document.getElementById('artist-fullname').value.trim();
  const email = document.getElementById('artist-email').value.trim();
  const location = document.getElementById('artist-location').value.trim();
  const hasProfilePhoto = !!window.currentProfilePhoto;

  console.log('📝 Form values:', { fullname, email, location, hasProfilePhoto });

  // TEMPORARY: Make validation very lenient for testing
  // Just check if at least one field has content and profile photo is uploaded
  const hasContent = fullname.length > 0 || email.length > 0 || location.length > 0;
  const hasRequiredFields = hasContent && hasProfilePhoto;

  if (!hasRequiredFields) {
    console.log('⚠️ Missing required fields - profile photo required');
    if (!hasProfilePhoto) {
      alert('Please upload a profile photo to continue.');
    } else {
      alert('For testing: Please enter at least one field or click "Test Button" to verify JavaScript works');
    }
    return false;
  }

  console.log('✅ Basic validation passed (lenient mode)');
  return true;

  /*
  // ORIGINAL STRICT VALIDATION (commented out for testing)
  let isValid = true;

  // Clear previous errors
  clearStepErrors(1);

  // Full name validation
  if (!fullname || fullname.length < 2) {
    console.log('❌ Full name validation failed');
    showFieldError('fullname', 'Full name is required (minimum 2 characters)');
    isValid = false;
  } else {
    console.log('✅ Full name validation passed');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.log('❌ Email validation failed');
    showFieldError('email', 'Please enter a valid email address');
    isValid = false;
  } else {
    console.log('✅ Email validation passed');
  }

  // Location validation
  if (!location || location.length < 2) {
    console.log('❌ Location validation failed');
    showFieldError('location', 'Location is required');
    isValid = false;
  } else {
    console.log('✅ Location validation passed');
  }

  console.log('📊 Basic info validation result:', isValid);
  return isValid;
  */
}

// Validate artistic profile step
function validateArtisticProfileStep() {
  const bio = document.getElementById('artist-bio').value.trim();
  const style = document.getElementById('artist-style').value;
  const experience = document.getElementById('artist-experience').value;

  let isValid = true;

  // Clear previous errors
  clearStepErrors(2);

  // Bio validation (minimum 100 words)
  const wordCount = bio.split(/\s+/).filter(word => word.length > 0).length;
  if (!bio || wordCount < 100) {
    showFieldError('bio', `Bio is required (minimum 100 words, currently ${wordCount} words)`);
    isValid = false;
  }

  // Style validation
  if (!style || style.length === 0) {
    showFieldError('style', 'Please select at least one artistic style');
    isValid = false;
  }

  // Experience validation
  if (!experience) {
    showFieldError('experience', 'Please select your experience level');
    isValid = false;
  }

  return isValid;
}

// Validate portfolio step
// Validate identity step
function validateIdentityStep() {
  console.log('🔍 Validating identity step');

  let isValid = true;

  // Clear previous errors
  clearStepErrors(3);

  // Check ownership declaration
  const ownershipDeclaration = document.getElementById('ownership-declaration');
  if (!ownershipDeclaration.checked) {
    showFieldError('ownership-error', 'You must certify that you own the artwork you will upload.');
    isValid = false;
  }

  // Check identity consent
  const identityConsent = document.getElementById('identity-consent');
  if (!identityConsent.checked) {
    showFieldError('consent-error', 'You must consent to identity verification.');
    isValid = false;
  }

  // Optional: Validate at least one social media/website
  const website = document.getElementById('artist-website').value.trim();
  const instagram = document.getElementById('artist-instagram').value.trim();
  const social = document.getElementById('artist-social').value.trim();

  if (!website && !instagram && !social) {
    // This is just a warning, not an error - artists can still proceed
    console.log('⚠️ No social media/website provided - verification may be harder');
  }

  return isValid;
}

function validatePortfolioStep() {
  let isValid = true;

  // Clear previous errors
  clearStepErrors(4);

  // Check for at least 1 image (make it more flexible)
  if (artistPortfolioImages.length === 0) {
    const proceed = confirm('No portfolio images uploaded. You can still register, but admins may request images later. Continue?');
    if (!proceed) {
      isValid = false;
    }
  } else if (artistPortfolioImages.length > 5) {
    alert('Maximum 5 portfolio images allowed');
    isValid = false;
  }

  return isValid;
}

// Show field error
function showFieldError(fieldName, message) {
  const errorElement = document.getElementById(`${fieldName}-error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Add error class to field
    const field = document.getElementById(`artist-${fieldName}`);
    if (field) {
      field.classList.add('error');
    }
  }
}

// Clear step errors
function clearStepErrors(step) {
  const stepElement = document.getElementById(`step-${getStepName(step)}`);
  if (stepElement) {
    stepElement.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    stepElement.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });
  }
}

// Initialize portfolio upload
function initPortfolioUpload() {
  const fileInput = document.getElementById('portfolio-file-input');
  const portfolioGrid = document.getElementById('portfolio-grid');

  fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      if (validateImageFile(file)) {
        addPortfolioImage(file);
      }
    });

    // Clear input
    fileInput.value = '';
  });

  // Drag and drop support
  portfolioGrid.addEventListener('dragover', function(e) {
    e.preventDefault();
    portfolioGrid.classList.add('drag-over');
  });

  portfolioGrid.addEventListener('dragleave', function(e) {
    e.preventDefault();
    portfolioGrid.classList.remove('drag-over');
  });

  portfolioGrid.addEventListener('drop', function(e) {
    e.preventDefault();
    portfolioGrid.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (validateImageFile(file)) {
        addPortfolioImage(file);
      }
    });
  });
}

// Validate image file
function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    alert(`File type not supported: ${file.type}. Please use JPG, PNG, WebP, or GIF.`);
    return false;
  }

  if (file.size > maxSize) {
    alert(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 10MB.`);
    return false;
  }

  return true;
}

// Add portfolio image
function addPortfolioImage(file) {
  const portfolioGrid = document.getElementById('portfolio-grid');

  // Create image preview element
  const imageItem = document.createElement('div');
  imageItem.className = 'portfolio-item';

  const img = document.createElement('img');
  const reader = new FileReader();

  reader.onload = function(e) {
    img.src = e.target.result;
    imageItem.appendChild(img);

    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image-btn';
    removeBtn.textContent = '×';
    removeBtn.onclick = function() {
      removePortfolioImage(file);
      portfolioGrid.removeChild(imageItem);
    };
    imageItem.appendChild(removeBtn);

    portfolioGrid.appendChild(imageItem);
  };

  reader.readAsDataURL(file);

  // Store file reference
  artistPortfolioImages.push(file);
  updatePortfolioCounter();
}

// Remove portfolio image
function removePortfolioImage(file) {
  const index = artistPortfolioImages.indexOf(file);
  if (index > -1) {
    artistPortfolioImages.splice(index, 1);
    updatePortfolioCounter();
  }
}

// Update portfolio counter
function updatePortfolioCounter() {
  // Could add a counter display here
  console.log(`Portfolio images: ${artistPortfolioImages.length}`);
}

// Clear artist registration form
function clearArtistRegistrationForm() {
  // Clear all form fields
  const form = document.getElementById('artist-registration-form');
  if (form) {
    form.querySelectorAll('input, textarea, select').forEach(field => {
      field.value = '';
    });

    // Clear portfolio
    artistPortfolioImages = [];
    const portfolioGrid = document.getElementById('portfolio-grid');
    if (portfolioGrid) {
      portfolioGrid.innerHTML = '';
    }

    // Clear errors
    form.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    form.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });
  }

  // Hide success message
  const success = document.getElementById('artist-success');
  if (success) {
    success.style.display = 'none';
  }

  // Show registration form
  const formContainer = document.getElementById('artist-registration-form');
  if (formContainer) {
    formContainer.style.display = 'block';
  }
}

// Submit artist registration
async function submitArtistRegistration() {
  if (!validatePortfolioStep()) return;

  // Clear any remaining errors
  clearStepErrors(4);

  console.log('🎨 Submitting artist registration...');

  try {
    console.log('🔍 Validating all form data...');
    // Collect form data
    const formData = {
      fullName: document.getElementById('artist-fullname').value.trim(),
      email: document.getElementById('artist-email').value.trim(),
      phone: document.getElementById('artist-phone').value.trim(),
      location: document.getElementById('artist-location').value.trim(),
      profilePhoto: window.currentProfilePhoto || null,
      bio: document.getElementById('artist-bio').value.trim(),
      artisticStyle: Array.from(document.getElementById('artist-style').selectedOptions).map(opt => opt.value),
      yearsExperience: document.getElementById('artist-experience').value,
      education: document.getElementById('artist-education').value.trim(),
      awards: document.getElementById('artist-awards').value.trim(),
      exhibitions: document.getElementById('artist-exhibitions').value.trim(),
      website: document.getElementById('artist-website').value.trim(),
      instagram: document.getElementById('artist-instagram').value.trim(),
      socialMedia: document.getElementById('artist-social').value.trim(),
      // Identity verification data
      identityVerification: {
        website: document.getElementById('artist-website').value.trim(),
        instagram: document.getElementById('artist-instagram').value.trim(),
        otherSocialMedia: document.getElementById('artist-social').value.trim(),
        exhibitions: document.getElementById('artist-exhibitions').value.trim(),
        ownershipDeclaration: document.getElementById('ownership-declaration').checked,
        identityConsent: document.getElementById('identity-consent').checked
      },
      portfolioImages: artistPortfolioImages
    };

    console.log('📋 Collected form data:', formData);
    console.log('🎨 Creating artist profile...');

    // Create artist profile
    const artistProfile = await artistManager.createArtistProfile(formData);
    console.log('✅ Artist profile created:', artistProfile);

    // Generate and store verification token
    const verificationToken = generateVerificationToken();
    const artistId = `artist-${artistProfile.basicInfo.artistId}`;
    storeVerificationData(artistId, verificationToken, formData.email);

    // Try to send verification email (don't fail registration if it fails)
    try {
      await sendVerificationEmail(formData.email, artistId, verificationToken, `Welcome to SurrealBid, ${formData.fullName}!`);
      console.log('📧 Verification email sent successfully');
    } catch (emailError) {
      console.warn('⚠️ Email sending failed, but registration continues:', emailError);
      // Show verification link directly as fallback
      const baseUrl = window.location.origin;
      const verificationLink = `${baseUrl}/verify?token=${verificationToken}&auction=${artistId}`;
      alert(`Registration successful! Since email failed, here's your verification link:\n\n${verificationLink}\n\nPlease save this link and use it to verify your account.`);
    }

    // Show success message
    document.getElementById('artist-registration-form').style.display = 'none';
    document.getElementById('artist-success').style.display = 'block';

    console.log('✅ Artist registration submitted successfully');

  } catch (error) {
    console.error('❌ Artist registration failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Show more helpful error message
    let errorMessage = 'Registration failed. ';
    if (error.message.includes('fetch')) {
      errorMessage += 'Network error - please check your connection.';
    } else if (error.message.includes('email')) {
      errorMessage += 'Email service unavailable, but your registration was saved.';
    } else {
      errorMessage += 'Please try again or contact support.';
    }

    alert(errorMessage + '\n\nCheck the browser console for technical details.');
  }
}

// Show artist verification notice
function showArtistVerificationNotice(artistCheck) {
  const notice = document.getElementById('artist-verification-notice');
  const message = document.getElementById('verification-message');
  const actions = document.getElementById('verification-actions');

  if (notice && message && actions) {
    message.textContent = artistCheck.message;

    // Clear previous actions
    actions.innerHTML = '';

    // Add appropriate action button
    const actionBtn = document.createElement('a');
    actionBtn.className = 'btn';

    switch (artistCheck.action) {
      case 'register':
        actionBtn.href = '/artist-register';
        actionBtn.textContent = 'Register as Artist';
        actionBtn.onclick = () => navigateTo('/artist-register');
        break;
      case 'verify':
        actionBtn.href = '#';
        actionBtn.textContent = 'Resend Verification Email';
        actionBtn.onclick = () => resendVerificationEmail(artistCheck.email);
        break;
      case 'pending':
        actionBtn.href = '/auctions';
        actionBtn.textContent = 'Browse Auctions';
        actionBtn.onclick = () => navigateTo('/auctions');
        break;
      case 'revise':
        actionBtn.href = '/artist-register';
        actionBtn.textContent = 'Update Portfolio';
        actionBtn.onclick = () => navigateTo('/artist-register');
        break;
      default:
        actionBtn.href = '/artist-register';
        actionBtn.textContent = 'Register as Artist';
        actionBtn.onclick = () => navigateTo('/artist-register');
    }

    actions.appendChild(actionBtn);
    notice.style.display = 'block';

    // Scroll to notice
    notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // Fallback to alert
    alert('🎨 ' + artistCheck.message);
  }
}

// Hide artist verification notice
function hideArtistVerificationNotice() {
  const notice = document.getElementById('artist-verification-notice');
  if (notice) {
    notice.style.display = 'none';
  }
}

// Resend verification email
async function resendVerificationEmail(email) {
  try {
    const artists = JSON.parse(localStorage.getItem('artists') || '[]');
    const artist = artists.find(a => a.basicInfo.email === email);

    if (!artist) {
      alert('Artist profile not found. Please register first.');
      return;
    }

    const token = generateVerificationToken();
    const artistId = `artist-${artist.basicInfo.artistId}`;

    // Store verification data
    storeVerificationData(artistId, token, email);

    await sendVerificationEmail(email, artistId, token, `SurrealBid - Email Verification`);

    // Note: The verification link will be shown by sendVerificationEmail function
  } catch (error) {
    console.error('Resend verification error:', error);
    alert('Failed to resend verification email. Please try again later.');
  }
}

// Initialize auction form validation (hide verification notice on form changes)
function initAuctionFormValidation() {
  const form = document.getElementById('auction-form');
  if (!form) return;

  // Hide verification notice when form changes
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('input', hideArtistVerificationNotice);
    input.addEventListener('change', hideArtistVerificationNotice);
  });

  // Add field validation for auction form
  const fields = ['title', 'artist', 'artistEmail', 'startBid', 'durationMinutes', 'auctionStartDate'];

  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => validateAuctionField(field));
      field.addEventListener('input', () => {
        // Clear error styling on input
        if (field.classList.contains('error')) {
          field.classList.remove('error');
          const errorElement = document.getElementById(field.id + '-error');
          if (errorElement) errorElement.textContent = '';
        }
        // Hide verification notice
        hideArtistVerificationNotice();
      });
    }
  });
}

// Make functions globally available with safety checks
console.log('🔧 Attaching artist registration functions to window...');

window.nextRegistrationStep = nextRegistrationStep;
window.prevRegistrationStep = prevRegistrationStep;
window.submitArtistRegistration = submitArtistRegistration;
window.showArtistVerificationNotice = showArtistVerificationNotice;
window.hideArtistVerificationNotice = hideArtistVerificationNotice;

// Debug function for verification issues
window.debugVerification = function() {
  console.log('🔍 DEBUG: Verification Data in localStorage');
  console.log('All localStorage keys:', Object.keys(localStorage));

  const verificationKeys = Object.keys(localStorage).filter(key => key.startsWith('verification_'));
  console.log('Verification keys found:', verificationKeys);

  verificationKeys.forEach(key => {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`${key}:`, data);
  });

  return verificationKeys.length;
};

// Test verification function
window.testVerification = function() {
  console.log('🧪 TESTING VERIFICATION SYSTEM');

  // Generate a test token
  const testAuctionId = 'test-auction-123';
  const testToken = generateVerificationToken();

  console.log('Generated token:', testToken);

  // Store test data
  const testData = {
    token: testToken,
    email: 'test@example.com',
    auctionId: testAuctionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    attempts: 0
  };

  localStorage.setItem(`verification_${testAuctionId}`, JSON.stringify(testData));
  console.log('Stored test data:', testData);

  // Test verification
  const result = verifyEmailToken(testToken, testAuctionId);
  console.log('Verification result:', result);

  return result;
};


// Enhanced admin access with better UX – require password every time (no session persistence)
function initAdminPanel() {
  const wrap = document.getElementById('admin-dashboard-wrap');
  sessionStorage.removeItem('admin_authenticated');
  sessionStorage.removeItem('admin_login_time');

  // Always show login: hide dashboard until password is entered
  if (wrap) wrap.style.display = 'none';

  // Create a beautiful modal for password entry
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
    ">
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
        <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">Admin Access Required</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 30px 0; font-size: 16px;">
          Enter your administrator password to access the management dashboard.
        </p>
        <input
          type="password"
          id="admin-modal-password"
          placeholder="Enter admin password..."
          style="
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 20px;
            outline: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          "
          onkeypress="if(event.key === 'Enter') checkAdminPassword()"
        />
        <div style="display: flex; gap: 10px;">
          <button onclick="checkAdminPassword()" style="
            flex: 1;
            padding: 12px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
            Access Dashboard
          </button>
          <button onclick="cancelAdminAccess()" style="
            flex: 1;
            padding: 12px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
            Cancel
          </button>
        </div>
        <div id="admin-error-modal" style="color: #ff6b6b; margin-top: 15px; display: none;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Focus on password input
  setTimeout(() => {
    const passwordInput = document.getElementById('admin-modal-password');
    if (passwordInput) passwordInput.focus();
  }, 100);
}

function checkAdminPassword() {
  const password = document.getElementById('admin-modal-password').value;
  const errorDiv = document.getElementById('admin-error-modal');

  if (password === ADMIN_PASSWORD) {
    // Success – do not persist session; user must log in again next time
    // Remove modal, show dashboard, then load data
    document.body.removeChild(document.body.lastChild);
    const wrap = document.getElementById('admin-dashboard-wrap');
    if (wrap) wrap.style.display = 'block';
    loadAdminData();
  } else {
    // Error
    errorDiv.textContent = '❌ Incorrect password. Please try again.';
    errorDiv.style.display = 'block';

    // Shake animation
    const modal = document.querySelector('[style*="position: fixed"] > div');
    modal.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => modal.style.animation = '', 500);
  }
}

function cancelAdminAccess() {
  // Remove modal and go back to home
  document.body.removeChild(document.body.lastChild);
  navigateTo('/');
}

function logoutAdmin() {
  // Clear admin session
  sessionStorage.removeItem('admin_authenticated');
  sessionStorage.removeItem('admin_login_time');

  showNotification('👋 Successfully logged out from admin panel.', 'info');
  setTimeout(() => navigateTo('/'), 1000);
}

// Enhanced data management system

// Initialize IndexedDB
function initializeIndexedDB() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Initializing IndexedDB...');

    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

    request.onerror = () => {
      console.error('❌ IndexedDB initialization failed');
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexedDB initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      console.log('📦 Setting up IndexedDB stores...');
      const db = event.target.result;

      // Create object stores
      Object.values(DB_CONFIG.stores).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          console.log(`📁 Created store: ${storeName}`);
        }
      });

      // Migrate old localStorage data if exists
      migrateFromLocalStorage(db);
    };
  });
}

// Migrate data from localStorage to IndexedDB
function migrateFromLocalStorage(db) {
  try {
    // Check for old data
    const oldArtists = localStorage.getItem('artists');
    const oldAuctions = localStorage.getItem('auctions');
    const oldPendingAuctions = localStorage.getItem('pending_auctions');
    const oldReports = localStorage.getItem('artwork_reports');

    if (oldArtists || oldAuctions || oldPendingAuctions || oldReports) {
      console.log('🔄 Migrating data from localStorage to IndexedDB...');

      const transaction = db.transaction(Object.values(DB_CONFIG.stores), 'readwrite');

      if (oldArtists) {
        const artists = JSON.parse(oldArtists);
        const store = transaction.objectStore(DB_CONFIG.stores.artists);
        artists.forEach(artist => store.put(artist));
        console.log(`✅ Migrated ${artists.length} artists`);
      }

      if (oldAuctions) {
        const auctions = JSON.parse(oldAuctions);
        const store = transaction.objectStore(DB_CONFIG.stores.auctions);
        auctions.forEach(auction => store.put(auction));
        console.log(`✅ Migrated ${auctions.length} auctions`);
      }

      if (oldPendingAuctions) {
        const pendingAuctions = JSON.parse(oldPendingAuctions);
        const store = transaction.objectStore(DB_CONFIG.stores.auctions);
        pendingAuctions.forEach(auction => store.put(auction));
        console.log(`✅ Migrated ${pendingAuctions.length} pending auctions`);
      }

      if (oldReports) {
        const reports = JSON.parse(oldReports);
        const store = transaction.objectStore(DB_CONFIG.stores.reports);
        reports.forEach(report => store.put(report));
        console.log(`✅ Migrated ${reports.length} reports`);
      }

      // Store metadata
      const metadataStore = transaction.objectStore(DB_CONFIG.stores.metadata);
      metadataStore.put({
        id: 'app_metadata',
        version: '2.0',
        migratedFrom: 'localStorage',
        migrationDate: new Date().toISOString()
      });

      console.log('✅ Migration completed successfully');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Get all data from localStorage
function getAllData() {
  try {
    const data = JSON.parse(localStorage.getItem(DATA_STORAGE_KEY) || '{}');
    if (!data.metadata) {
      // Migrate old data format if needed
      return migrateOldData();
    }
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      artists: [],
      auctions: [],
      pendingAuctions: [],
      reports: [],
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }
}

// Migrate old data format
function migrateOldData() {
  const oldArtists = JSON.parse(localStorage.getItem('artists') || '[]');
  const oldAuctions = JSON.parse(localStorage.getItem('auctions') || '[]');
  const oldPendingAuctions = JSON.parse(localStorage.getItem('pending_auctions') || '[]');
  const oldReports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');

  const newData = {
    artists: oldArtists,
    auctions: oldAuctions,
    pendingAuctions: oldPendingAuctions,
    reports: oldReports,
    metadata: {
      version: '2.0',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      migrated: true
    }
  };

  saveAllData(newData);
  return newData;
}

// Save all data to localStorage
function saveAllData(data) {
  data.metadata.lastModified = new Date().toISOString();
  localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data, null, 2));
  console.log('💾 Data saved to localStorage');
}

// Enhanced artist management
function saveArtistProfile(profile) {
  const data = getAllData();
  const existingIndex = data.artists.findIndex(a => a.basicInfo.artistId === profile.basicInfo.artistId);

  if (existingIndex >= 0) {
    // Update existing profile
    data.artists[existingIndex] = profile;
  } else {
    // Add new profile
    data.artists.push(profile);
  }

  saveAllData(data);
  console.log('💾 Artist profile saved to storage');
}

function getAllArtists() {
  const data = getAllData();
  return data.artists;
}

function getArtistById(artistId) {
  const data = getAllData();
  return data.artists.find(a => a.basicInfo.artistId === artistId);
}

function getPendingArtists() {
  const data = getAllData();
  return data.artists.filter(artist =>
    !artist.verification.portfolioReviewed &&
    artist.verification.approved !== false
  );
}

// Alternative: Show all artists who haven't been reviewed yet (including those pending email verification)
function getAllPendingArtists() {
  const data = getAllData();
  return data.artists.filter(artist =>
    !artist.verification.portfolioReviewed &&
    artist.verification.approved !== false
  );
}

function exportData() {
  const data = getAllData();
  data.exportDate = new Date().toISOString();
  data.exportedFrom = 'localStorage';

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `surrealbid-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification('📊 All data exported successfully!', 'success');
}

// Export artists data only
function exportArtistsData() {
  const data = getAllData();
  const artistsData = {
    artists: data.artists,
    exportType: 'artists_only',
    exportDate: new Date().toISOString(),
    exportedFrom: 'localStorage',
    statistics: {
      totalArtists: data.artists.length,
      approvedArtists: data.artists.filter(a => a.verification.approved).length,
      pendingArtists: data.artists.filter(a => !a.verification.portfolioReviewed && a.verification.approved !== false).length,
      rejectedArtists: data.artists.filter(a => a.verification.approved === false).length
    }
  };

  const dataStr = JSON.stringify(artistsData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `surrealbid-artists-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification('👨‍🎨 Artist data exported successfully!', 'success');
}

// Import data functionality
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('⚠️ This will replace all current data. Make sure you have a backup! Continue?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);

        // Validate data structure
        if (!importedData.artists || !Array.isArray(importedData.artists)) {
          throw new Error('Invalid data format: missing artists array');
        }

        // Import new data
        saveAllData(importedData);

        showNotification('✅ Data imported successfully! Refreshing...', 'success');

        // Refresh admin panel
        setTimeout(() => {
          loadAdminData();
        }, 1000);

      } catch (error) {
        console.error('Import error:', error);
        showNotification(`❌ Import failed: ${error.message}`, 'error');
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// Load data management information
function loadDataManagement() {
  const data = getAllData();

  // Update storage information
  const storageUsed = JSON.stringify(data).length / 1024; // KB
  document.getElementById('storage-used').textContent = `${storageUsed.toFixed(1)} KB`;

  // Update last modified
  const lastModified = data.metadata.lastModified;
  document.getElementById('last-backup').textContent = lastModified ?
    new Date(lastModified).toLocaleDateString() : 'Never';

  // Update version
  document.getElementById('data-version').textContent = data.metadata.version || '2.0';

  // Show localStorage status
  console.log('💾 localStorage Status: Connected');
}

// Clear all data (dangerous operation)
function clearAllData() {
  if (!confirm('⚠️ WARNING: This will permanently delete ALL data including artists, auctions, and reports. This action CANNOT be undone! Are you absolutely sure?')) {
    return;
  }

  if (!confirm('🔴 FINAL WARNING: All data will be lost forever. Type "DELETE" to confirm:')) {
    return;
  }

  const confirmation = prompt('Type "DELETE" to confirm permanent data deletion:');
  if (confirmation !== 'DELETE') {
    showNotification('❌ Data deletion cancelled.', 'info');
    return;
  }

  // Clear all data
  localStorage.removeItem(DATA_STORAGE_KEY);

  // Clear old format data too
  localStorage.removeItem('artists');
  localStorage.removeItem('auctions');
  localStorage.removeItem('pending_auctions');
  localStorage.removeItem('artwork_reports');

  // Reinitialize
  initializeDataStorage();

  showNotification('🗑️ All data cleared successfully!', 'error');

  // Refresh the admin panel
  setTimeout(() => {
    loadAdminData();
  }, 1000);
}

// Profile photo upload handling
function handleProfilePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showNotification('Please select a valid image file.', 'error');
    return;
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    showNotification('Image size must be less than 5MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    // Compress the image
    compressImageData(e.target.result, 300, 0.8)
      .then(compressedDataUrl => {
        // Store the compressed image data
        window.currentProfilePhoto = compressedDataUrl;

        // Update preview
        const preview = document.getElementById('profile-photo-preview');
        const placeholder = document.querySelector('.photo-placeholder');
        const area = document.getElementById('profile-photo-area');

        preview.src = compressedDataUrl;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        area.style.borderColor = '#10b981';
        area.style.background = 'rgba(16, 185, 129, 0.05)';

        // Show remove button
        document.getElementById('remove-photo-btn').style.display = 'inline-block';

        showNotification('Profile photo uploaded successfully!', 'success');
      })
      .catch(error => {
        console.error('Image compression failed:', error);
        showNotification('Failed to process image. Please try again.', 'error');
      });
  };

  reader.readAsDataURL(file);
}

function removeProfilePhoto() {
  // Clear stored photo
  window.currentProfilePhoto = null;

  // Reset UI
  const preview = document.getElementById('profile-photo-preview');
  const placeholder = document.querySelector('.photo-placeholder');
  const area = document.getElementById('profile-photo-area');

  preview.style.display = 'none';
  placeholder.style.display = 'flex';
  area.style.borderColor = '#cbd5e1';
  area.style.background = '#f8fafc';

  // Hide remove button
  document.getElementById('remove-photo-btn').style.display = 'none';

  // Clear file input
  document.getElementById('artist-profile-photo').value = '';

  showNotification('Profile photo removed.', 'info');
}

// Clear all artists (admin function)
function clearAllArtists() {
  if (!confirm('⚠️ WARNING: This will delete ALL artist registrations permanently. This action cannot be undone! Continue?')) {
    return;
  }

  if (!confirm('🔴 FINAL CONFIRMATION: All artists will be permanently deleted. Type "DELETE" to confirm:')) {
    return;
  }

  const confirmation = prompt('Type "DELETE" to confirm permanent artist data deletion:');
  if (confirmation !== 'DELETE') {
    showNotification('❌ Artist deletion cancelled.', 'info');
    return;
  }

  const data = getAllData();
  const artistCount = data.artists.length;
  data.artists = [];

  saveAllData(data);

  showNotification(`🗑️ Deleted ${artistCount} artists permanently!`, 'error');

  // Refresh the admin panel
  setTimeout(() => {
    loadAdminData();
  }, 1000);
}

// Auto-refresh admin data when page becomes visible
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && window.location.pathname === '/admin') {
    console.log('🔄 Page became visible, refreshing admin data...');
    loadAdminData();
  }
});

// Initialize data storage on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeDataStorage();
  console.log('✅ Data storage initialized');
});

function showAdminTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.admin-tab-content');
  tabs.forEach(tab => tab.style.display = 'none');

  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.admin-tab');
  tabButtons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const selectedTab = document.getElementById(`admin-${tabName}`);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }

  // Add active class to selected button
  const selectedButton = Array.from(tabButtons).find(btn => btn.textContent.toLowerCase().includes(tabName.split('-')[0]));
  if (selectedButton) {
    selectedButton.classList.add('active');
  }

  // Load tab-specific data
  switch(tabName) {
    case 'artists':
      loadPendingArtists();
      break;
    case 'reports':
      loadArtworkReports();
      break;
    case 'auctions':
      loadAdminAuctions();
      break;
    case 'stats':
      loadDetailedStats();
      break;
    case 'data':
      loadDataManagement();
      break;
  }
}

function loadAdminData() {
  // Update quick stats
  updateQuickStats();

  // Initialize with artists tab
  showAdminTab('artists');
}

function updateQuickStats() {
  const data = getAllData();
  const artists = data.artists;
  const reports = data.reports;
  const auctions = data.auctions;

  document.getElementById('quick-artists').textContent = artists.length;
  document.getElementById('quick-pending').textContent = artists.filter(a => !a.verification.portfolioReviewed).length;
  document.getElementById('quick-reports').textContent = reports.filter(r => r.status === 'pending').length;
  document.getElementById('quick-auctions').textContent = auctions.filter(a => a.status === 'active').length;

  // Update tab counts
  document.getElementById('artists-count').textContent = artists.filter(a => !a.verification.portfolioReviewed).length;
  document.getElementById('reports-count').textContent = reports.filter(r => r.status === 'pending').length;
  document.getElementById('auctions-count').textContent = auctions.filter(a => a.status === 'active').length;
}

function refreshAdminData() {
  updateQuickStats();
  // Refresh current tab
  const activeTab = document.querySelector('.admin-tab.active');
  if (activeTab) {
    const tabName = activeTab.textContent.toLowerCase().split(' ')[0];
    showAdminTab(tabName);
  }
}

function loadPendingArtists() {
  // Get pending artists
  const pendingArtists = getPendingArtists();
  const container = document.getElementById('pending-artists');
  const noArtistsMsg = document.getElementById('no-pending-artists');

  if (pendingArtists.length === 0) {
    container.innerHTML = '';
    noArtistsMsg.style.display = 'block';
    return;
  }

  noArtistsMsg.style.display = 'none';

  const escape = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  container.innerHTML = pendingArtists.map(artist => {
    const name = escape(artist.basicInfo.fullName);
    const email = escape(artist.basicInfo.email);
    const location = escape(artist.basicInfo.location || '');
    const bio = escape(artist.artisticProfile.bio || '').substring(0, 160);
    const bioSuffix = (artist.artisticProfile.bio || '').length > 160 ? '…' : '';
    const styles = (artist.artisticProfile.artisticStyle || []).join(', ') || '—';
    const website = escape(artist.identityVerification?.website || 'Not provided');
    const instagram = escape(artist.identityVerification?.instagram || 'Not provided');
    const id = escape(artist.basicInfo.artistId);
    const photo = artist.basicInfo.profilePhoto;
    return `
    <article class="admin-artist-card" data-artist-id="${id}">
      <div class="admin-artist-card-inner">
        <div class="admin-artist-card-main">
          <div class="admin-artist-card-avatar">
            ${photo ? `<img src="${photo}" alt="${name}" />` : '<span class="admin-artist-avatar-placeholder">👤</span>'}
          </div>
          <div class="admin-artist-card-info">
            <h3 class="admin-artist-name">${name}</h3>
            <a href="mailto:${email}" class="admin-artist-email">${email}</a>
            ${location ? `<span class="admin-artist-location">${location}</span>` : ''}
            <div class="admin-artist-meta">
              <span class="admin-artist-meta-item"><strong>Style</strong> ${styles}</span>
              <span class="admin-artist-meta-item"><strong>Website</strong> ${website}</span>
              <span class="admin-artist-meta-item"><strong>Instagram</strong> ${instagram}</span>
            </div>
          </div>
        </div>
        <div class="admin-artist-card-bio">
          <p>${bio}${bioSuffix}</p>
        </div>
        <div class="admin-artist-card-actions">
          <button type="button" class="admin-btn admin-btn-approve" onclick="approveArtist('${id}')">Approve</button>
          <button type="button" class="admin-btn admin-btn-reject" onclick="rejectArtist('${id}')">Reject</button>
          <button type="button" class="admin-btn admin-btn-ghost" onclick="viewArtistDetails('${id}')">View details</button>
        </div>
      </div>
    </article>
    `;
  }).join('');
}

function loadArtworkReports() {
  const reports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');

  const container = document.getElementById('artwork-reports');
  const noReportsMsg = document.getElementById('no-reports');

  if (reports.length === 0) {
    container.innerHTML = '';
    noReportsMsg.style.display = 'block';
    return;
  }

  noReportsMsg.style.display = 'none';

  container.innerHTML = reports.map(report => `
    <div class="admin-report-card">
      <div class="report-header">
        <h4>Report #${report.id}</h4>
        <span class="report-status status-${report.status}">${report.status}</span>
      </div>

      <div class="report-details">
        <p><strong>Auction ID:</strong> ${report.auctionId}</p>
        <p><strong>Reporter:</strong> ${report.reporterEmail}</p>
        <p><strong>Reason:</strong> ${report.reason}</p>
        <p><strong>Description:</strong> ${report.description || 'No description provided'}</p>
        <p><strong>Evidence:</strong> ${report.evidence || 'No evidence provided'}</p>
        <p><strong>Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
      </div>

      <div class="report-actions">
        <button class="btn" onclick="resolveReport('${report.id}')">✅ Resolve</button>
        <button class="btn-secondary" onclick="dismissReport('${report.id}')">❌ Dismiss</button>
        <button class="btn-secondary" onclick="investigateReport('${report.id}')">🔍 Investigate</button>
      </div>
    </div>
  `).join('');
}

function loadAdminAuctions() {
  const auctions = JSON.parse(localStorage.getItem('auctions') || '[]');
  const pendingAuctions = JSON.parse(localStorage.getItem('pending_auctions') || '[]');

  const container = document.getElementById('admin-auctions-list');
  const noAuctionsMsg = document.getElementById('no-auctions');

  // Combine live and pending auctions
  const allAuctions = [...auctions, ...pendingAuctions];

  if (allAuctions.length === 0) {
    container.innerHTML = '';
    noAuctionsMsg.style.display = 'block';
    return;
  }

  noAuctionsMsg.style.display = 'none';

  container.innerHTML = allAuctions.map(auction => `
    <div class="admin-auction-card">
      <div class="auction-header">
        <h4>"${auction.title}"</h4>
        <span class="auction-status status-${auction.status || 'pending'}">${auction.status || 'pending'}</span>
      </div>

      <div class="auction-details">
        <p><strong>Artist:</strong> ${auction.artist}</p>
        <p><strong>Starting Bid:</strong> ₹${auction.currentBidINR || auction.startBidINR}</p>
        <p><strong>Duration:</strong> ${auction.durationMinutes || 60} minutes</p>
        <p><strong>Created:</strong> ${new Date(auction.createdAt || Date.now()).toLocaleDateString()}</p>
      </div>

      <div class="auction-actions">
        ${auction.status === 'active' ? '<button class="btn-warning" onclick="pauseAuction(\'' + auction.id + '\')">⏸️ Pause</button>' : ''}
        ${auction.status === 'pending' ? '<button class="btn" onclick="activateAuction(\'' + auction.id + '\')">✅ Activate</button>' : ''}
        <button class="btn-danger" onclick="deleteAuction('${auction.id}')">🗑️ Delete</button>
        <button class="btn-secondary" onclick="viewAuctionDetails('${auction.id}')">👁️ Details</button>
      </div>
    </div>
  `).join('');
}

function filterReports(status) {
  loadArtworkReports(status);
}

function loadArtworkReports(filterStatus = 'all') {
  const reports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');
  const filteredReports = filterStatus === 'all' ? reports : reports.filter(r => r.status === filterStatus);

  const container = document.getElementById('artwork-reports');
  const noReportsMsg = document.getElementById('no-reports');

  if (filteredReports.length === 0) {
    container.innerHTML = '';
    noReportsMsg.style.display = 'block';
    return;
  }

  noReportsMsg.style.display = 'none';

  container.innerHTML = filteredReports.map(report => `
    <div class="admin-report-card">
      <div class="report-header">
        <h4>Report #${report.id}</h4>
        <span class="report-status status-${report.status}">${report.status}</span>
      </div>

      <div class="report-details">
        <p><strong>Auction ID:</strong> ${report.auctionId}</p>
        <p><strong>Reporter:</strong> ${report.reporterEmail}</p>
        <p><strong>Reason:</strong> ${report.reason}</p>
        <p><strong>Description:</strong> ${report.description || 'No description provided'}</p>
        <p><strong>Evidence:</strong> ${report.evidence || 'No evidence provided'}</p>
        <p><strong>Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
      </div>

      <div class="report-actions">
        ${report.status === 'pending' ? '<button class="btn" onclick="resolveReport(\'' + report.id + '\')">✅ Resolve</button>' : ''}
        ${report.status === 'pending' ? '<button class="btn-warning" onclick="investigateReport(\'' + report.id + '\')">🔍 Investigate</button>' : ''}
        ${report.status !== 'dismissed' ? '<button class="btn-secondary" onclick="dismissReport(\'' + report.id + '\')">❌ Dismiss</button>' : ''}
      </div>
    </div>
  `).join('');
}

function loadDetailedStats() {
  const data = getAllData();
  const artists = data.artists;
  const reports = data.reports;
  const auctions = data.auctions;
  const pendingAuctions = data.pendingAuctions;

  // Artist stats
  document.getElementById('total-artists').textContent = artists.length;
  document.getElementById('verified-artists').textContent = artists.filter(a => a.verification.approved).length;
  document.getElementById('stat-pending-artists').textContent = artists.filter(a => !a.verification.portfolioReviewed && a.verification.approved !== false).length;
  document.getElementById('rejected-artists').textContent = artists.filter(a => a.verification.approved === false).length;

  // Auction stats
  document.getElementById('active-auctions').textContent = auctions.length + pendingAuctions.length;

  // Report stats
  document.getElementById('total-reports').textContent = reports.length;
  document.getElementById('resolved-reports').textContent = reports.filter(r => r.status === 'resolved').length;
  document.getElementById('dismissed-reports').textContent = reports.filter(r => r.status === 'dismissed').length;
}

function loadAdminStats() {
  // This function is kept for backward compatibility
  loadDetailedStats();
}

function approveArtist(artistId) {
  if (!confirm('Are you sure you want to approve this artist? They will be able to create auctions.')) {
    return;
  }

  const data = getAllData();
  const artist = data.artists.find(a => a.basicInfo.artistId === artistId);

  if (artist) {
    artist.verification.portfolioReviewed = true;
    artist.verification.approved = true;
    artist.verification.approvedAt = new Date().toISOString();
    artist.verification.reviewedAt = new Date().toISOString();
    artist.verification.verificationLevel = 'verified';

    saveAllData(data);

    // Show success message
    showNotification(`✅ Artist ${artist.basicInfo.fullName} has been approved!`, 'success');

    // Refresh the admin data
    loadAdminData();
  }
}

function rejectArtist(artistId) {
  if (!confirm('Are you sure you want to reject this artist? This action cannot be undone.')) {
    return;
  }

  // Create a better rejection dialog
  const reason = prompt('Please provide a detailed reason for rejection (this will be shown to the artist):');
  if (!reason || reason.trim() === '') {
    alert('Please provide a reason for rejection.');
    return;
  }

  const data = getAllData();
  const artist = data.artists.find(a => a.basicInfo.artistId === artistId);

  if (artist) {
    artist.verification.portfolioReviewed = false;
    artist.verification.approved = false;
    artist.verification.rejectionReason = reason.trim();
    artist.verification.rejectedAt = new Date().toISOString();
    artist.verification.reviewedAt = new Date().toISOString();

    saveAllData(data);

    // Show success message
    showNotification(`❌ Artist ${artist.basicInfo.fullName} has been rejected.`, 'error');

    // Refresh the admin data
    loadAdminData();
  }
}

function resolveReport(reportId) {
  const reports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');
  const report = reports.find(r => r.id === reportId);

  if (report) {
    report.status = 'resolved';
    localStorage.setItem('artwork_reports', JSON.stringify(reports));
    alert('Report marked as resolved.');
    loadArtworkReports();
  }
}

function dismissReport(reportId) {
  const reports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');
  const report = reports.find(r => r.id === reportId);

  if (report) {
    report.status = 'dismissed';
    localStorage.setItem('artwork_reports', JSON.stringify(reports));
    alert('Report dismissed.');
    loadArtworkReports();
  }
}

function viewArtistDetails(artistId) {
  const artists = JSON.parse(localStorage.getItem('artists') || '[]');
  const artist = artists.find(a => a.basicInfo.artistId === artistId);

  if (artist) {
    alert(`Artist Details:\n\nName: ${artist.basicInfo.fullName}\nEmail: ${artist.basicInfo.email}\nBio: ${artist.artisticProfile.bio}\nWebsite: ${artist.identityVerification?.website || 'Not provided'}\nInstagram: ${artist.identityVerification?.instagram || 'Not provided'}`);
  }
}

function investigateReport(reportId) {
  const reports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');
  const report = reports.find(r => r.id === reportId);

  if (report) {
    // Update status to investigating
    report.status = 'investigating';
    localStorage.setItem('artwork_reports', JSON.stringify(reports));

    alert(`Report #${report.id} marked as under investigation.\n\nDetails:\nAuction ID: ${report.auctionId}\nReporter: ${report.reporterEmail}\nReason: ${report.reason}\nDescription: ${report.description}\nEvidence: ${report.evidence}`);

    loadArtworkReports();
  }
}

function activateAuction(auctionId) {
  const pendingAuctions = JSON.parse(localStorage.getItem('pending_auctions') || '[]');
  const auctionIndex = pendingAuctions.findIndex(a => a.id === auctionId);

  if (auctionIndex !== -1) {
    const auction = pendingAuctions[auctionIndex];
    auction.status = 'active';

    // Move to live auctions
    const liveAuctions = JSON.parse(localStorage.getItem('auctions') || '[]');
    liveAuctions.push(auction);
    localStorage.setItem('auctions', JSON.stringify(liveAuctions));

    // Remove from pending
    pendingAuctions.splice(auctionIndex, 1);
    localStorage.setItem('pending_auctions', JSON.stringify(pendingAuctions));

    alert(`Auction "${auction.title}" has been activated!`);
    loadAdminAuctions();
    updateQuickStats();
  }
}

function pauseAuction(auctionId) {
  const auctions = JSON.parse(localStorage.getItem('auctions') || '[]');
  const auction = auctions.find(a => a.id === auctionId);

  if (auction) {
    auction.status = 'paused';
    localStorage.setItem('auctions', JSON.stringify(auctions));

    alert(`Auction "${auction.title}" has been paused.`);
    loadAdminAuctions();
    updateQuickStats();
  }
}

function deleteAuction(auctionId) {
  if (!confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
    return;
  }

  // Remove from live auctions
  let auctions = JSON.parse(localStorage.getItem('auctions') || '[]');
  auctions = auctions.filter(a => a.id !== auctionId);

  // Remove from pending auctions
  let pendingAuctions = JSON.parse(localStorage.getItem('pending_auctions') || '[]');
  pendingAuctions = pendingAuctions.filter(a => a.id !== auctionId);

  localStorage.setItem('auctions', JSON.stringify(auctions));
  localStorage.setItem('pending_auctions', JSON.stringify(pendingAuctions));

  alert('Auction deleted successfully.');
  loadAdminAuctions();
  updateQuickStats();
}

function viewAuctionDetails(auctionId) {
  const auctions = JSON.parse(localStorage.getItem('auctions') || '[]');
  const pendingAuctions = JSON.parse(localStorage.getItem('pending_auctions') || '[]');
  const auction = [...auctions, ...pendingAuctions].find(a => a.id === auctionId);

  if (auction) {
    alert(`Auction Details:\n\nTitle: ${auction.title}\nArtist: ${auction.artist}\nDescription: ${auction.description || 'No description'}\nStarting Bid: ₹${auction.startBidINR}\nDuration: ${auction.durationMinutes} minutes\nStatus: ${auction.status}\nCreated: ${new Date(auction.createdAt || Date.now()).toLocaleString()}`);
  }
}

function exportData() {
  const data = {
    artists: JSON.parse(localStorage.getItem('artists') || '[]'),
    auctions: JSON.parse(localStorage.getItem('auctions') || '[]'),
    pendingAuctions: JSON.parse(localStorage.getItem('pending_auctions') || '[]'),
    reports: JSON.parse(localStorage.getItem('artwork_reports') || '[]'),
    bids: JSON.parse(localStorage.getItem('auction_bids') || '{}'),
    exportDate: new Date().toISOString()
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `surrealbid-data-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  alert('Data exported successfully!');
}

function generateReport() {
  const artists = JSON.parse(localStorage.getItem('artists') || '[]');
  const auctions = JSON.parse(localStorage.getItem('auctions') || '[]');
  const reports = JSON.parse(localStorage.getItem('artwork_reports') || '[]');

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalArtists: artists.length,
      verifiedArtists: artists.filter(a => a.verification.emailVerified).length,
      approvedArtists: artists.filter(a => a.verification.portfolioReviewed).length,
      totalAuctions: auctions.length,
      activeAuctions: auctions.filter(a => a.status === 'active').length,
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length
    },
    recentActivity: {
      artistsLast7Days: artists.filter(a => {
        const created = new Date(a.createdAt || 0);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created > weekAgo;
      }).length,
      auctionsLast7Days: auctions.filter(a => {
        const created = new Date(a.createdAt || 0);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created > weekAgo;
      }).length,
      reportsLast7Days: reports.filter(r => {
        const created = new Date(r.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created > weekAgo;
      }).length
    }
  };

  alert(`📊 Platform Report Generated:\n\n👥 Artists: ${report.summary.totalArtists} total (${report.summary.verifiedArtists} verified, ${report.summary.approvedArtists} approved)\n\n🎯 Auctions: ${report.summary.totalAuctions} total (${report.summary.activeAuctions} active)\n\n🚨 Reports: ${report.summary.totalReports} total (${report.summary.pendingReports} pending)\n\n📈 Recent Activity (7 days):\n- ${report.recentActivity.artistsLast7Days} new artists\n- ${report.recentActivity.auctionsLast7Days} new auctions\n- ${report.recentActivity.reportsLast7Days} new reports`);
}


// Verify functions are attached
console.log('✅ Functions attached:', {
  nextRegistrationStep: typeof window.nextRegistrationStep,
  currentRegistrationStep: typeof currentRegistrationStep,
  debugVerification: typeof window.debugVerification
});

// function closeBidModal() {
//   const modal = document.getElementById("bid-modal");
//   if (modal) modal.remove();
// }

// window.openBidModal = openBidModal;
// window.closeBidModal = closeBidModal;

