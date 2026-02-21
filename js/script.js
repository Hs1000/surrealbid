// ===== CLIENT-SIDE ROUTING SYSTEM =====
let currentPage = '/';

// Route definitions
const routes = {
  '/': 'home-page',
  '/auctions': 'auctions-page',
  '/submit': 'submit-page',
  '/about': 'home-page', // About section is in home page
  '/payment-success': 'payment-success-page'
};

// Navigation function
function navigateTo(path) {
  console.log('Navigating to:', path);

  // Prevent navigation if already on the same page
  if (currentPage === path) {
    console.log('Already on page:', path);
    return;
  }

  // Update current page
  currentPage = path;

  // Hide all pages with smooth transition
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show target page
  const targetPage = routes[path];
  if (targetPage) {
    const pageElement = document.getElementById(targetPage);
    if (pageElement) {
      // Use setTimeout for smooth transition
      setTimeout(() => {
        pageElement.classList.add('active');
        console.log('Showing page:', targetPage);
      }, 50);
    } else {
      console.error('Page element not found:', targetPage);
      // Fallback to home
      setTimeout(() => {
        document.getElementById('home-page').classList.add('active');
      }, 50);
    }
  } else {
    console.error('Route not found:', path);
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

      // Validate required fields
      if (!title || !artist) {
        alert('Please fill in title and artist name');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Create auction';
        }
        return;
      }

      const startBidINR = Math.max(0, Math.floor(Number(startBidRaw || "0") || 0));
      const durationMinutes = Math.max(1, Number(durationRaw || "0") || 0);

      if (startBidINR <= 0) {
        alert('Please enter a valid starting bid');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Create auction';
        }
        return;
      }

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

      // Helper to finalize save + redirect
      function finishSave(extra) {
        console.log('🏗️ finishSave called with extra:', extra);

        const newAuction = {
          id: `user-${now}`,
          title,
          artist,
          currentBidINR: startBidINR,
          startTime,
          endTime,
          ...extra
        };
        // Only add imageUrl if it's not empty (don't save empty strings)
        if (imageUrl && imageUrl.trim().length > 0) {
          newAuction.imageUrl = imageUrl.trim();
          console.log('🖼️ Added imageUrl to auction:', imageUrl);
        } else {
          console.log('⚠️ No imageUrl to add to auction');
        }

        console.log('📝 Final new auction object:', newAuction);
        console.log('📝 Auction keys:', Object.keys(newAuction));
        console.log('📝 Has imageDataUrl:', !!newAuction.imageDataUrl);
        console.log('📝 Has imageUrl:', !!newAuction.imageUrl);
        console.log('📝 Start time in auction:', newAuction.startTime);
        console.log('📝 End time in auction:', newAuction.endTime);
        console.log('📝 Start time readable:', new Date(newAuction.startTime).toLocaleString());
        console.log('📝 End time readable:', new Date(newAuction.endTime).toLocaleString());

        // Show summary of what will be saved
        let imageSummary = '';
        if (newAuction.imageDataUrl) {
          imageSummary = `Uploaded image (${(newAuction.imageDataUrl.length / 1024).toFixed(1)}KB compressed)`;
        } else if (newAuction.imageUrl) {
          imageSummary = `Image URL: ${newAuction.imageUrl.substring(0, 50)}${newAuction.imageUrl.length > 50 ? '...' : ''}`;
        } else {
          imageSummary = 'No image (will show placeholder)';
        }

        console.log('📋 Auctions before push:', auctions.length, 'items');
        console.log('🖼️ Image summary:', imageSummary);

        auctions.push(newAuction);

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

// function closeBidModal() {
//   const modal = document.getElementById("bid-modal");
//   if (modal) modal.remove();
// }

// window.openBidModal = openBidModal;
// window.closeBidModal = closeBidModal;

