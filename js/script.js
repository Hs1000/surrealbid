console.log("SurrealBid top-tier UI loaded.");

const EXCHANGE_RATE_CACHE_KEY = "surrealbid_exchange_rate";
const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_INR_PER_USD = 83; // Fallback rate if API fails

// Shared storage configuration - JSONBin.io is now the ONLY storage mechanism
const SHARED_STORAGE_API = 'https://api.jsonbin.io/v3/b';
const SHARED_STORAGE_BIN_ID = '699063ae43b1c97be97e71d0'; // Auctions bin
const BIDS_BIN_ID = '699063ae43b1c97be97e71d0'; // Using same bin for bids for simplicity (you may want separate bins later)
const SHARED_STORAGE_API_KEY = '$2a$10$dwfI5DnmcSV.xrlrteOKBOW0qrUqwdylnR4Zz.AsmSbD9RAJM7yG6';
const USE_SHARED_STORAGE = true; // Always true - no localStorage fallback

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
  if (!USE_SHARED_STORAGE || !SHARED_STORAGE_BIN_ID) {
    console.warn('Shared storage not configured');
    return [];
  }

  try {
    console.log('Loading auctions from JSONBin.io...');
    const startTime = Date.now();

    // Increased timeout for reliability (20 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        reject(new Error(`Load timeout after ${elapsed}ms`));
      }, 20000)
    );

    const fetchPromise = fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': SHARED_STORAGE_API_KEY,
        'X-Bin-Meta': 'false'
      }
    }).catch(fetchError => {
      console.error('Network error:', fetchError);
      throw new Error(`Network error: ${fetchError.message}`);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    const elapsed = Date.now() - startTime;
    console.log(`JSONBin.io response received in ${elapsed}ms, status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('Raw response data:', data);

      // Handle different possible data structures
      let auctions = [];
      if (data.record) {
        // JSONBin.io v3 format: { record: { auctions: [...] } }
        auctions = Array.isArray(data.record) ? data.record : (data.record.auctions || []);
      } else if (data.auctions) {
        // Direct format: { auctions: [...] }
        auctions = Array.isArray(data.auctions) ? data.auctions : [];
      } else if (Array.isArray(data)) {
        // Direct array format: [...]
        auctions = data;
      }

      if (Array.isArray(auctions)) {
        console.log(`✓ Successfully loaded ${auctions.length} auctions from JSONBin.io`);

        // Clean up any empty imageUrl strings
        const cleanedAuctions = auctions.map(auction => {
          const cleaned = { ...auction };
          if (cleaned.imageUrl && cleaned.imageUrl.trim().length === 0) {
            delete cleaned.imageUrl;
          }
          return cleaned;
        });

        return cleanedAuctions;
      } else {
        console.warn('Invalid data structure from JSONBin.io:', data);
        return [];
      }
    } else {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error(`JSONBin.io returned error ${response.status}:`, errorText);
      throw new Error(`API error ${response.status}: ${errorText.substring(0, 100)}`);
    }
  } catch (error) {
    console.error('Failed to load auctions from JSONBin.io:', error.message);
    console.error('Full error details:', error);
    return [];
  }
}



// Helper function to compress base64 image data
function compressImageData(imageDataUrl, maxWidth = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let newWidth = maxWidth;
        let newHeight = maxWidth / aspectRatio;

        if (newHeight > maxWidth) {
          newHeight = maxWidth;
          newWidth = maxWidth * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    img.src = imageDataUrl;
  });
}

// Helper function to prepare auctions for shared storage
async function prepareAuctionsForSync(auctions) {
  const processedAuctions = [];

  for (const auction of auctions) {
    if (auction.imageDataUrl && auction.imageDataUrl.length > 100000) { // Only compress large images
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
  if (!USE_SHARED_STORAGE || !SHARED_STORAGE_BIN_ID) {
    console.warn('Shared storage not configured - cannot save auctions');
    throw new Error('Shared storage not configured');
  }

  try {
    // Prepare auctions for JSONBin.io (compress images if needed)
    const auctionsForSync = await prepareAuctionsForSync(list);
    const payload = { auctions: auctionsForSync, updatedAt: Date.now() };
    const payloadSize = JSON.stringify(payload).length;
    const payloadSizeKB = (payloadSize / 1024).toFixed(2);
    console.log(`Saving ${auctionsForSync.length} auctions to JSONBin.io (payload: ${payloadSizeKB}KB)...`);

    // Increased timeout for saving (15 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Save timeout')), 15000)
    );

    const fetchPromise = fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': SHARED_STORAGE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error('Failed to save to JSONBin.io. Status:', response.status, 'Error:', errorText);
      throw new Error(`Save failed: ${response.status} - ${errorText}`);
    } else {
      console.log('✓ Successfully saved auctions to JSONBin.io');
    }
  } catch (error) {
    console.error('Failed to save auctions to JSONBin.io:', error.message);
    throw error; // Re-throw so calling code knows save failed
  }
}



// Bidding system functions (JSONBin.io only)
async function loadBids() {
  if (!USE_SHARED_STORAGE || !BIDS_BIN_ID) {
    console.warn('Bids storage not configured');
    return {};
  }

  try {
    const response = await fetch(`${SHARED_STORAGE_API}/${BIDS_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': SHARED_STORAGE_API_KEY,
        'X-Bin-Meta': 'false'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.record?.bids || data.bids || {};
    }
  } catch (error) {
    console.error('Failed to load bids:', error);
  }
  return {};
}

async function saveBids(bids) {
  if (!USE_SHARED_STORAGE || !BIDS_BIN_ID) {
    console.warn('Bids storage not configured');
    return;
  }

  try {
    const response = await fetch(`${SHARED_STORAGE_API}/${BIDS_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': SHARED_STORAGE_API_KEY
      },
      body: JSON.stringify({ bids, updatedAt: Date.now() })
    });

    if (!response.ok) {
      console.error('Failed to save bids');
    } else {
      console.log('✓ Bids saved to JSONBin.io');
    }
  } catch (error) {
    console.error('Error saving bids:', error);
  }
}

async function getHighestBid(auctionId) {
  const bids = await loadBids();
  const auctionBids = bids[auctionId] || [];
  if (auctionBids.length === 0) return null;
  return auctionBids.reduce((highest, bid) =>
    bid.amount > highest.amount ? bid : highest, auctionBids[0]
  );
}

async function addBid(auctionId, amount, bidderName, bidderEmail) {
  const bids = await loadBids();
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
    console.log('Form submitted');

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

      console.log('Form values:', { title, artist, startBidRaw, durationRaw });

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

      const now = Date.now();
      const endTime = now + durationMinutes * 60 * 1000;

      console.log('Loading current auctions from JSONBin.io...');
      // Load directly from JSONBin.io
      let auctions = [];
      try {
        auctions = await loadStoredAuctions();
        console.log('Loaded', auctions.length, 'auctions from JSONBin.io');
      } catch (error) {
        console.error('Failed to load auctions:', error);
        auctions = [];
      }

      console.log('Current auctions array:', auctions.length);

      const file = imageFileInput?.files && imageFileInput.files[0];

      // Helper to finalize save + redirect
      async function finishSave(extra) {
        console.log('🔄 Creating new auction with extra data:', Object.keys(extra));
        const newAuction = {
          id: `user-${now}`,
          title,
          artist,
          currentBidINR: startBidINR,
          endTime,
          ...extra
        };
        // Only add imageUrl if it's not empty (don't save empty strings)
        if (imageUrl && imageUrl.trim().length > 0) {
          newAuction.imageUrl = imageUrl.trim();
        }
        auctions.push(newAuction);
        console.log('✅ New auction object created:', {
          id: newAuction.id,
          title: newAuction.title,
          hasImageDataUrl: !!newAuction.imageDataUrl,
          hasImageUrl: !!newAuction.imageUrl,
          imageDataUrlSize: newAuction.imageDataUrl ? (newAuction.imageDataUrl.length / 1024).toFixed(1) + 'KB' : 'N/A'
        });
        console.log('📊 Total auctions to save:', auctions.length);

        // Save directly to JSONBin.io
        try {
          await saveStoredAuctions(auctions);
          console.log('✓ Successfully saved auction to JSONBin.io');
          console.log('✓ New auction ID:', newAuction.id);
          console.log('Redirecting to auctions page...');
          window.location.href = "auctions.html";
        } catch (error) {
          console.error('✗ Failed to save auction to JSONBin.io:', error);
          alert('Error creating auction. Please try again.');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create auction';
          }
        }
      }

      if (file) {
        console.log('Reading and compressing image file...');
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = typeof reader.result === "string" ? reader.result : "";
            console.log('Image read, size:', (dataUrl.length / 1024).toFixed(1), 'KB');

            // Only compress if image is large (>100KB)
            if (dataUrl.length > 100000) {
              console.log('Compressing large image...');
              const compressedDataUrl = await compressImageData(dataUrl, 600, 0.8);
              const compressionRatio = ((dataUrl.length - compressedDataUrl.length) / dataUrl.length * 100).toFixed(1);
              console.log(`Image compressed: ${compressionRatio}% size reduction (${(compressedDataUrl.length/1024).toFixed(1)}KB)`);
              await finishSave({ imageDataUrl: compressedDataUrl });
            } else {
              console.log('Image is small enough, skipping compression');
              await finishSave({ imageDataUrl: dataUrl });
            }
          } catch (error) {
            console.error('Image processing failed:', error);
            alert('Error processing image. Please try again.');
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = 'Create auction';
            }
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
        console.log('No file, saving with URL or no image');
        await finishSave({});
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

  // Load auctions asynchronously
  loadStoredAuctions().then(stored => {
    renderAuctions(stored);
    
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
            console.log('New auctions detected! Reloading page...', {
              current: allAuctions.length,
              updated: updatedAuctions.length,
              new: newAuctions.length
            });
            allAuctions = updatedAuctions;
            location.reload();
          }
        } catch (error) {
          console.warn('Error polling for new auctions:', error);
        }
      }, 10000);
    }
  });
})();

/* ======================================================
   RENDER AUCTIONS (FIXED PROPERLY)
====================================================== */

async function renderAuctions(allAuctions) {
  const activeGrid = document.getElementById("active-auctions");
  const endedGrid = document.getElementById("ended-auctions");

  if (!activeGrid || !endedGrid) return;

  activeGrid.innerHTML = "";
  endedGrid.innerHTML = "";

  const now = Date.now();

  const inProgress = [];
  const ended = [];

  allAuctions.forEach(auction => {
    const endTime = Number(auction.endTime || 0);
    const isEnded = endTime && now >= endTime;

    if (isEnded) ended.push(auction);
    else inProgress.push(auction);
  });

  // Render active auctions
  for (const a of inProgress) {
    const card = await createAuctionCard(a, false);
    activeGrid.appendChild(card);
  }

  // Render ended auctions
  for (const a of ended) {
    const card = await createAuctionCard(a, true);
    endedGrid.appendChild(card);
  }
}

/* ======================================================
   CREATE CARD
====================================================== */

async function createAuctionCard(auction, isEnded) {
  const card = document.createElement("article");
  card.className = "auction-card";

  const imageDiv = document.createElement("div");
  imageDiv.className = "auction-image";

  console.log(`Auction ${auction.id} image debug:`, {
    hasImageDataUrl: !!auction.imageDataUrl,
    hasImageUrl: !!auction.imageUrl,
    imageDataUrlLength: auction.imageDataUrl ? auction.imageDataUrl.length : 0,
    imageUrlPreview: auction.imageUrl ? auction.imageUrl.substring(0, 50) + '...' : null
  });

  if (auction.imageDataUrl && auction.imageDataUrl.trim() !== '') {
    imageDiv.style.backgroundImage = `url('${auction.imageDataUrl}')`;
    console.log(`✓ Set background image for auction ${auction.id} using imageDataUrl`);
  } else if (auction.imageUrl && auction.imageUrl.trim() !== '') {
    imageDiv.style.backgroundImage = `url('${auction.imageUrl}')`;
    console.log(`✓ Set background image for auction ${auction.id} using imageUrl`);
  } else {
    imageDiv.classList.add("placeholder-image");
    console.log(`⚠ No image data for auction ${auction.id}, using placeholder`);
  }

  const body = document.createElement("div");
  body.className = "auction-body";

  const titleEl = document.createElement("h2");
  titleEl.textContent = auction.title;

  const artistEl = document.createElement("p");
  artistEl.textContent = `by ${auction.artist}`;

  const metaEl = document.createElement("p");
  metaEl.className = "auction-meta";

  const highestBid = await getHighestBid(auction.id);
  const currentBidAmount = highestBid
    ? highestBid.amount
    : auction.currentBidINR || 0;

  const usd = convertINRtoUSD(currentBidAmount);

  metaEl.innerHTML =
    `Current bid: ₹${currentBidAmount.toLocaleString("en-IN")} (≈ $${usd.toFixed(2)})`;

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

  if (!isEnded) {
    const interval = setInterval(() => {
      const remaining = auction.endTime - Date.now();
      timerEl.textContent = formatRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        loadStoredAuctions().then(renderAuctions); // move automatically
      }
    }, 1000);
  }

  timerEl.textContent = isEnded
    ? "Auction ended"
    : formatRemaining(auction.endTime - Date.now());

  const btn = document.createElement("button");
  btn.className = "auction-btn";

  if (isEnded) {
    btn.disabled = true;
    btn.textContent = "Auction ended";
    btn.style.opacity = "0.5";
  } else {
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
  body.appendChild(timerEl);
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

    addBid(auctionId, amount, name, email)
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

