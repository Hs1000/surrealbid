console.log("SurrealBid top-tier UI loaded.");

const STORAGE_KEY = "surrealbid_auctions";
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

  // Some default demo auctions so the page doesn't look empty
  const demoNow = Date.now();
  const demoAuctions = [
    {
      id: "demo-1",
      title: "Echoes of a Dream",
      artist: "Aria Nocturne",
      imageClass: "image-1",
      currentBidINR: 240000,
      endTime: demoNow + 45 * 1000
    },
    {
      id: "demo-2",
      title: "Gravity for Sale",
      artist: "Luka Meridian",
      imageClass: "image-2",
      currentBidINR: 95000,
      endTime: demoNow + 90 * 1000
    },
    {
      id: "demo-3",
      title: "Rooms Between Clouds",
      artist: "Mina Sol",
      imageClass: "image-3",
      currentBidINR: 410000,
      endTime: demoNow + 150 * 1000
    }
  ];

  const allAuctions = [...demoAuctions, ...stored];

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
    const inr =
      typeof auction.currentBidINR === "number"
        ? auction.currentBidINR
        : Number(auction.currentBid || 0) * 240000; // fallback for old ETH-style data
    const usd = inr / INR_PER_USD;
    priceSpan.textContent = `₹${inr.toLocaleString("en-IN")} (≈ $${usd.toFixed(0)})`;
    metaEl.textContent = "Current bid: ";
    metaEl.appendChild(priceSpan);

    const timerEl = document.createElement("p");
    timerEl.className = "auction-timer";
    timerEl.dataset.countdown = "true";
    timerEl.textContent = "Loading timer…";

    const btn = document.createElement("button");
    btn.className = "auction-btn";
    btn.disabled = true;
    btn.textContent = "Real-time bidding coming soon";

    body.appendChild(titleEl);
    body.appendChild(artistEl);
    body.appendChild(metaEl);
    body.appendChild(timerEl);
    body.appendChild(btn);

    card.appendChild(imageDiv);
    card.appendChild(body);

    grid.appendChild(card);
  });

  if (!allAuctions.length) return;

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
})();
