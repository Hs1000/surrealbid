console.log("SurrealBid top-tier UI loaded.");

const STORAGE_KEY = "surrealbid_auctions";
const BIDS_STORAGE_KEY = "surrealbid_bids";
const INR_PER_USD = 83; // rough static conversion; adjust as needed

function loadStoredAuctions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveStoredAuctions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

// Bidding system functions
function loadBids() {
  try {
    const raw = localStorage.getItem(BIDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveBids(bids) {
  try {
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(bids));
  } catch {
    // ignore
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

function addBid(auctionId, amount, bidderName, bidderEmail) {
  const bids = loadBids();
  if (!bids[auctionId]) bids[auctionId] = [];
  
  bids[auctionId].push({
    id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    bidderName: bidderName || 'Anonymous',
    bidderEmail: bidderEmail || '',
    timestamp: Date.now()
  });
  
  saveBids(bids);
  
  // Update auction's current bid
  const auctions = loadStoredAuctions();
  const auctionIndex = auctions.findIndex(a => String(a.id) === String(auctionId));
  if (auctionIndex !== -1) {
    auctions[auctionIndex].currentBidINR = amount;
    saveStoredAuctions(auctions);
  }
  
  return bids[auctionId];
}

// Handle submit-auction.html form
(function handleAuctionForm() {
  const form = document.getElementById("auction-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = /** @type {HTMLInputElement} */ (document.getElementById("title")).value.trim();
    const artist = /** @type {HTMLInputElement} */ (document.getElementById("artist")).value.trim();
    const imageUrl = /** @type {HTMLInputElement} */ (document.getElementById("imageUrl")).value.trim();
    const imageFileInput = /** @type {HTMLInputElement} */ (document.getElementById("imageFile"));
    const startBidRaw = /** @type {HTMLInputElement} */ (document.getElementById("startBid")).value;
    const durationRaw = /** @type {HTMLInputElement} */ (document.getElementById("durationMinutes")).value;

    const startBidINR = Math.max(0, Math.floor(Number(startBidRaw || "0") || 0));
    const durationMinutes = Math.max(1, Number(durationRaw || "0") || 0);

    const now = Date.now();
    const endTime = now + durationMinutes * 60 * 1000;

    const auctions = loadStoredAuctions();

    const file = imageFileInput?.files && imageFileInput.files[0];

    // Helper to finalize save + redirect
    function finishSave(extra) {
      auctions.push({
        id: `user-${now}`,
        title,
        artist,
        imageUrl,
        currentBidINR: startBidINR,
        endTime,
        ...extra
      });
      saveStoredAuctions(auctions);
      window.location.href = "auctions.html";
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        finishSave({ imageDataUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    } else {
      finishSave({});
    }
  });
})();

// Render auctions and run countdowns on auctions.html
(function handleAuctionsPage() {
  const grid = document.querySelector(".auctions-grid");
  if (!grid) return;

  const stored = loadStoredAuctions();
  const allAuctions = stored;

  // Show empty state if no auctions
  if (allAuctions.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <h2 style="font-size: 24px; margin-bottom: 12px; opacity: 0.9;">No auctions yet</h2>
        <p style="opacity: 0.7; margin-bottom: 24px;">Be the first to submit an artwork!</p>
        <a href="submit-auction.html" class="btn">Submit Artwork</a>
      </div>
    `;
    return;
  }

  const nowForButtons = Date.now();
  
  allAuctions.forEach((auction) => {
    const card = document.createElement("article");
    card.className = "auction-card";
    card.dataset.auctionId = String(auction.id);
    card.dataset.endTime = String(auction.endTime);

    const imageDiv = document.createElement("div");
    imageDiv.className = "auction-image";
    if ("imageClass" in auction && auction.imageClass) {
      imageDiv.classList.add("placeholder-image", auction.imageClass);
    } else if (auction.imageDataUrl) {
      imageDiv.style.backgroundImage = `url('${auction.imageDataUrl}')`;
    } else if (auction.imageUrl) {
      imageDiv.style.backgroundImage = `url('${auction.imageUrl}')`;
    }

    const body = document.createElement("div");
    body.className = "auction-body";

    const titleEl = document.createElement("h2");
    titleEl.className = "auction-title";
    titleEl.textContent = auction.title;

    const artistEl = document.createElement("p");
    artistEl.className = "auction-artist";
    artistEl.textContent = `by ${auction.artist}`;

    const metaEl = document.createElement("p");
    metaEl.className = "auction-meta";
    const priceSpan = document.createElement("span");
    priceSpan.className = "auction-price";
    priceSpan.dataset.auctionId = String(auction.id);
    priceSpan.dataset.priceElement = "true";
    
    // Get highest bid or use auction's starting bid
    const highestBid = getHighestBid(auction.id);
    let currentBidAmount = highestBid ? highestBid.amount : 
      (typeof auction.currentBidINR === "number" ? auction.currentBidINR : 
       Number(auction.currentBid || 0) * 240000);
    
    const usd = currentBidAmount / INR_PER_USD;
    priceSpan.textContent = `₹${currentBidAmount.toLocaleString("en-IN")} (≈ $${usd.toFixed(0)})`;
    metaEl.textContent = "Current bid: ";
    metaEl.appendChild(priceSpan);
    
    // Show bid count if there are bids
    if (highestBid) {
      const bids = loadBids();
      const bidCount = (bids[auction.id] || []).length;
      if (bidCount > 0) {
        const bidCountEl = document.createElement("p");
        bidCountEl.className = "auction-bid-count";
        bidCountEl.textContent = `${bidCount} bid${bidCount !== 1 ? 's' : ''}`;
        bidCountEl.style.fontSize = "12px";
        bidCountEl.style.opacity = "0.7";
        bidCountEl.style.marginTop = "4px";
        metaEl.appendChild(bidCountEl);
      }
    }

    const timerEl = document.createElement("p");
    timerEl.className = "auction-timer";
    timerEl.dataset.countdown = "true";
    timerEl.textContent = "Loading timer…";

    const btn = document.createElement("button");
    btn.className = "auction-btn";
    const inrForBtn =
      typeof auction.currentBidINR === "number"
        ? auction.currentBidINR
        : Number(auction.currentBid || 0) * 240000;
    
    // Check if auction has ended
    const endTime = auction.endTime || 0;
    const hasEnded = endTime > 0 && nowForButtons > endTime;
    
    if (hasEnded) {
      btn.disabled = true;
      btn.textContent = "Auction ended";
      btn.style.opacity = "0.5";
    } else {
      btn.textContent = "Place Bid";
      btn.onclick = () => {
        openBidModal(auction.id, auction.title, auction.artist, currentBidAmount);
      };
    }

    body.appendChild(titleEl);
    body.appendChild(artistEl);
    body.appendChild(metaEl);
    body.appendChild(timerEl);
    body.appendChild(btn);

    card.appendChild(imageDiv);
    card.appendChild(body);

    grid.appendChild(card);
  });

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

  function tick() {
    const now = Date.now();
    document.querySelectorAll(".auction-card").forEach((card) => {
      const endTime = Number(card.dataset.endTime || 0);
      const display = card.querySelector("[data-countdown]");
      if (!display || !endTime) return;
      const remaining = endTime - now;
      display.textContent = formatRemaining(remaining);
      if (remaining <= 0) {
        card.classList.add("auction-ended");
      }
    });
  }

  tick();
  setInterval(tick, 1000);
  
  // Poll for bid updates every 3 seconds
  setInterval(() => {
    updateBidPrices();
  }, 3000);
  
  // Initial price update
  updateBidPrices();
})();

// Bidding modal and functions
function openBidModal(auctionId, title, artist, currentBid) {
  // Remove existing modal if any
  const existingModal = document.getElementById('bid-modal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'bid-modal';
  modal.className = 'bid-modal-overlay';
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
          <p class="bid-current-price">Current bid: ₹${currentBid.toLocaleString('en-IN')}</p>
        </div>
        <form id="bid-form" class="bid-form">
          <div class="form-row">
            <label for="bidder-name">Your Name</label>
            <input id="bidder-name" type="text" required minlength="2" maxlength="100" 
                   placeholder="Enter your name" />
          </div>
          <div class="form-row">
            <label for="bidder-email">Email (optional)</label>
            <input id="bidder-email" type="email" maxlength="254" 
                   placeholder="your@email.com" />
          </div>
          <div class="form-row">
            <label for="bid-amount">Your Bid Amount (INR)</label>
            <input id="bid-amount" type="number" required min="${currentBid + 1}" 
                   step="1" placeholder="Enter amount" />
            <p class="form-hint">Minimum bid: ₹${(currentBid + 1).toLocaleString('en-IN')}</p>
          </div>
          <div class="bid-modal-actions">
            <button type="button" class="btn btn-secondary" onclick="closeBidModal()">Cancel</button>
            <button type="submit" class="btn">Place Bid</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle form submission
  const form = document.getElementById('bid-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bidAmount = Math.floor(Number(document.getElementById('bid-amount').value));
    const bidderName = document.getElementById('bidder-name').value.trim();
    const bidderEmail = document.getElementById('bidder-email').value.trim();
    
    if (bidAmount <= currentBid) {
      alert(`Your bid must be higher than the current bid of ₹${currentBid.toLocaleString('en-IN')}`);
      return;
    }
    
    if (bidAmount < 1) {
      alert('Please enter a valid bid amount');
      return;
    }
    
    // Add the bid
    addBid(auctionId, bidAmount, bidderName, bidderEmail);
    
    // Show success message
    alert(`Bid placed successfully! Your bid: ₹${bidAmount.toLocaleString('en-IN')}`);
    
    // Update the price display immediately
    updateBidPrice(auctionId);
    
    // Close modal
    closeBidModal();
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeBidModal();
    }
  });
}

function closeBidModal() {
  const modal = document.getElementById('bid-modal');
  if (modal) modal.remove();
}

function updateBidPrice(auctionId) {
  const highestBid = getHighestBid(auctionId);
  if (!highestBid) return;
  
  const priceSpan = document.querySelector(`[data-price-element="true"][data-auction-id="${auctionId}"]`);
  if (priceSpan) {
    const usd = highestBid.amount / INR_PER_USD;
    priceSpan.textContent = `₹${highestBid.amount.toLocaleString('en-IN')} (≈ $${usd.toFixed(0)})`;
    
    // Add animation to show price update
    priceSpan.style.transition = 'all 0.3s ease';
    priceSpan.style.color = '#4ade80';
    setTimeout(() => {
      priceSpan.style.color = '';
    }, 1000);
  }
  
  // Update bid count
  const bids = loadBids();
  const bidCount = (bids[auctionId] || []).length;
  const metaEl = priceSpan?.parentElement;
  if (metaEl) {
    let bidCountEl = metaEl.querySelector('.auction-bid-count');
    if (bidCountEl) {
      bidCountEl.textContent = `${bidCount} bid${bidCount !== 1 ? 's' : ''}`;
    } else if (bidCount > 0) {
      bidCountEl = document.createElement("p");
      bidCountEl.className = "auction-bid-count";
      bidCountEl.textContent = `${bidCount} bid${bidCount !== 1 ? 's' : ''}`;
      bidCountEl.style.fontSize = "12px";
      bidCountEl.style.opacity = "0.7";
      bidCountEl.style.marginTop = "4px";
      metaEl.appendChild(bidCountEl);
    }
  }
}

function updateBidPrices() {
  const cards = document.querySelectorAll('.auction-card');
  cards.forEach((card) => {
    const auctionId = card.dataset.auctionId;
    if (auctionId) {
      updateBidPrice(auctionId);
    }
  });
}

// Make functions globally accessible
window.openBidModal = openBidModal;
window.closeBidModal = closeBidModal;
