// ======================================================
// Auctions: catalogue, cards, countdowns, bidding, reports, watchlist, lightbox, ticker.
// ======================================================

let allAuctions = [];
let visibleAuctions = [];
let auctionsPoll = null;
const filters = { sortBy: 'ending-soon', search: '', minPrice: '', maxPrice: '', status: 'all' };

async function fetchAuctions() {
  const data = await api('GET', '/api/auctions');
  allAuctions = data.auctions || [];
  return allAuctions;
}

function auctionState(auction, now = Date.now()) {
  if (auction.status === 'ended' || now >= auction.endTime) return 'ended';
  if (now < auction.startTime) return 'upcoming';
  return 'active';
}

// ---------------- HOME: UPCOMING ----------------
const UPCOMING_EMPTY = '<div class="upcoming-empty"><span>✦</span><div><strong>The next drop is taking shape.</strong><p>New works will appear here as soon as their auction dates are announced.</p></div></div>';

onPage('/', async () => {
  const container = $('#home-upcoming-auctions');
  if (!container) return;
  try {
    const now = Date.now();
    const upcoming = (await fetchAuctions())
      .filter(a => auctionState(a, now) === 'upcoming')
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 3);

    if (!upcoming.length) { container.innerHTML = UPCOMING_EMPTY; return; }
    container.replaceChildren(...upcoming.map((auction, index) => {
      const card = document.createElement('article');
      card.className = 'upcoming-auction-card';
      const date = new Date(auction.startTime);
      card.innerHTML = `
        <div class="upcoming-artwork upcoming-artwork-${(index % 3) + 1}"></div>
        <div class="upcoming-auction-meta"><span>${esc(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))} · ${esc(date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))}</span><span>Upcoming</span></div>
        <h3>${esc(auction.title)}</h3>
        <p>by ${esc(auction.artist)}</p>
        <p class="upcoming-bid">Starting at ${formatINR(auction.startingBidINR)}</p>`;
      if (auction.imageUrl) {
        const art = $('.upcoming-artwork', card);
        art.style.backgroundImage = `url("${encodeURI(auction.imageUrl)}")`;
        art.classList.add('has-upcoming-image');
      }
      return card;
    }));
  } catch {
    container.innerHTML = UPCOMING_EMPTY;
  }
});

// ---------------- AUCTIONS PAGE ----------------
onPage('/auctions', async () => {
  bindFilters();
  showSkeletonLoading();
  try {
    await fetchAuctions();
    applyFilters();
    updateBiddersTicker();
  } catch (err) {
    showErrorState(err.message);
  }

  clearInterval(auctionsPoll);
  auctionsPoll = setInterval(refreshAuctions, 15000);
});

document.addEventListener('sb:leave', e => {
  if (e.detail.path === '/auctions') clearInterval(auctionsPoll);
});

async function refreshAuctions() {
  try {
    await fetchAuctions();
    applyFilters();
    updateBiddersTicker();
  } catch { /* keep showing the last good data */ }
}

function bindFilters() {
  const sortBy = $('#sort-by');
  if (!sortBy || sortBy.dataset.bound) return;
  sortBy.dataset.bound = 'true';

  let debounce;
  const later = () => { clearTimeout(debounce); debounce = setTimeout(applyFilters, 250); };
  sortBy.addEventListener('change', e => { filters.sortBy = e.target.value; applyFilters(); });
  $('#status-filter').addEventListener('change', e => { filters.status = e.target.value; applyFilters(); });
  $('#search-artwork').addEventListener('input', e => { filters.search = e.target.value.trim().toLowerCase(); later(); });
  $('#min-price').addEventListener('input', e => { filters.minPrice = e.target.value; later(); });
  $('#max-price').addEventListener('input', e => { filters.maxPrice = e.target.value; later(); });
  $('#clear-filters').addEventListener('click', clearAllFilters);
}

function clearAllFilters() {
  Object.assign(filters, { sortBy: 'ending-soon', search: '', minPrice: '', maxPrice: '', status: 'all' });
  $('#sort-by').value = 'ending-soon';
  $('#status-filter').value = 'all';
  ['#search-artwork', '#min-price', '#max-price'].forEach(id => { $(id).value = ''; });
  applyFilters();
}

function applyFilters() {
  const now = Date.now();
  let list = [...allAuctions];

  if (filters.search) {
    list = list.filter(a => a.title.toLowerCase().includes(filters.search) || a.artist.toLowerCase().includes(filters.search));
  }
  if (filters.minPrice !== '') list = list.filter(a => a.currentBidINR >= Number(filters.minPrice));
  if (filters.maxPrice !== '') list = list.filter(a => a.currentBidINR <= Number(filters.maxPrice));
  if (filters.status === 'active') list = list.filter(a => auctionState(a, now) !== 'ended');
  if (filters.status === 'ended') list = list.filter(a => auctionState(a, now) === 'ended');

  const sorters = {
    'ending-soon': (a, b) => a.endTime - b.endTime,
    newest: (a, b) => b.submittedAt - a.submittedAt,
    'highest-bid': (a, b) => b.currentBidINR - a.currentBidINR,
    'lowest-bid': (a, b) => a.currentBidINR - b.currentBidINR,
  };
  list.sort(sorters[filters.sortBy] || sorters['ending-soon']);

  visibleAuctions = list;
  const count = $('#results-count');
  if (count) count.textContent = `Showing ${list.length} of ${allAuctions.length} auctions`;
  renderAuctions(list);
}

function renderAuctions(list) {
  const grids = { upcoming: $('#upcoming-auctions'), active: $('#active-auctions'), ended: $('#ended-auctions') };
  if (!grids.active) return;
  hideSkeletonLoading();

  const openHistory = new Set($$('.bid-history-container.visible').map(el => el.dataset.auctionId));
  const groups = { upcoming: [], active: [], ended: [] };
  const now = Date.now();
  list.forEach(a => groups[auctionState(a, now)].push(a));

  const empty = {
    upcoming: 'No future drops have been announced yet.',
    active: 'The next live auction is being prepared.',
    ended: 'When auctions close, their stories will live here.',
  };
  Object.entries(groups).forEach(([state, items]) => {
    const grid = grids[state];
    grid.replaceChildren(...items.map(a => createAuctionCard(a, state)));
    if (!items.length) grid.innerHTML = `<div class="auction-empty-state"><span>✦</span><p>${empty[state]}</p></div>`;
  });

  openHistory.forEach(id => {
    const button = $(`.bid-history-btn[data-auction-id="${CSS.escape(id)}"]`);
    if (button) toggleBidHistory(id, button);
  });
  tickCountdowns();
}

function createAuctionCard(auction, state) {
  const card = document.createElement('article');
  card.className = `auction-card auction-${state}`;
  card.dataset.auctionId = auction.id;

  const label = { upcoming: 'Upcoming', active: 'Live now', ended: auction.sold ? 'Sold' : 'Archived' }[state];
  const bidCount = auction.bids.length;
  const priceLabel = state === 'ended' ? (auction.winner ? 'Winning bid' : 'No bids') : bidCount ? 'Current bid' : 'Starting bid';

  card.innerHTML = `
    <div class="auction-image ${auction.imageUrl ? 'has-image' : 'placeholder-image'}" role="button" tabindex="0" aria-label="View ${esc(auction.title)}">
      <button class="watchlist-btn" data-auction-id="${esc(auction.id)}" aria-label="Save to watchlist"><span class="heart-icon">${isInWatchlist(auction.id) ? '❤️' : '🤍'}</span></button>
      <span class="auction-state-label">${label}</span>
    </div>
    <div class="auction-body">
      <h2>${esc(auction.title)}</h2>
      <p>by ${esc(auction.artist)}</p>
      <p class="auction-meta"><span>${priceLabel}</span><strong>${formatINR(auction.currentBidINR)}</strong><small>≈ $${convertINRtoUSD(auction.currentBidINR).toFixed(0)}</small></p>
      ${state === 'active' ? '<div class="auction-progress normal"><div class="auction-progress-bar"></div></div>' : ''}
      <p class="auction-timer" data-start="${auction.startTime}" data-end="${auction.endTime}" data-state="${state}"></p>
      <button class="bid-history-btn" data-auction-id="${esc(auction.id)}">View bids${bidCount ? ` (${bidCount})` : ''}</button>
      <div class="bid-history-container" data-auction-id="${esc(auction.id)}"></div>
      ${state === 'active' ? '<button class="auction-btn" data-action="bid">Place bid</button>' : ''}
      ${state === 'ended' ? `<button class="auction-btn" disabled>${auction.winner ? `Won by ${esc(auction.winner.name)}` : 'Auction ended'}</button>` : ''}
      <button class="report-btn" data-action="report">Report</button>
    </div>`;

  const image = $('.auction-image', card);
  if (auction.imageUrl) image.style.backgroundImage = `url("${encodeURI(auction.imageUrl)}")`;
  image.addEventListener('click', () => openLightbox(auction.id));
  image.addEventListener('keydown', e => { if (e.key === 'Enter') openLightbox(auction.id); });
  $('.watchlist-btn', card).addEventListener('click', e => { e.stopPropagation(); toggleWatchlist(auction.id); });
  $('.bid-history-btn', card).addEventListener('click', e => toggleBidHistory(auction.id, e.currentTarget));
  $('[data-action="bid"]', card)?.addEventListener('click', () => openBidModal(auction.id));
  $('[data-action="report"]', card).addEventListener('click', () => openReportModal(auction.id));
  return card;
}

// One shared timer updates every countdown on the page (cards re-render without leaking intervals).
function formatRemaining(ms) {
  if (ms <= 0) return 'Auction ended';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m ${s % 60}s left`;
  if (m > 0) return `${m}m ${s % 60}s left`;
  return `${s}s left`;
}

function formatUntil(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  if (d > 0) return `Starts in ${d}d ${h}h`;
  if (h > 0) return `Starts in ${h}h ${m % 60}m`;
  return m > 0 ? `Starts in ${m}m` : 'Starting now';
}

let refreshQueued = false;
function tickCountdowns() {
  const now = Date.now();
  $$('.auction-timer[data-end]').forEach(timer => {
    const start = Number(timer.dataset.start);
    const end = Number(timer.dataset.end);
    const state = timer.dataset.state;
    if (state === 'ended') { timer.textContent = 'Auction ended'; return; }
    if (state === 'upcoming') {
      timer.textContent = formatUntil(start - now);
      if (now >= start) queueRefresh();
      return;
    }
    const remaining = end - now;
    timer.textContent = formatRemaining(remaining);
    const progress = timer.parentElement.querySelector('.auction-progress');
    if (progress) {
      progress.querySelector('.auction-progress-bar').style.width = `${Math.max(0, Math.min(100, (remaining / (end - start)) * 100))}%`;
      progress.className = `auction-progress ${remaining < 300000 ? 'urgent' : remaining < 1800000 ? 'warning' : 'normal'}`;
    }
    if (remaining <= 0) queueRefresh();
  });
}

function queueRefresh() {
  if (refreshQueued || currentPath !== '/auctions') return;
  refreshQueued = true;
  setTimeout(async () => { await refreshAuctions(); refreshQueued = false; }, 1500);
}

setInterval(tickCountdowns, 1000);

// ---------------- BID HISTORY ----------------
function toggleBidHistory(auctionId, button) {
  const container = $(`.bid-history-container[data-auction-id="${CSS.escape(auctionId)}"]`);
  const auction = allAuctions.find(a => a.id === auctionId);
  if (!container || !auction) return;
  const count = auction.bids.length;

  if (container.classList.contains('visible')) {
    container.classList.remove('visible');
    container.innerHTML = '';
    button.textContent = `View bids${count ? ` (${count})` : ''}`;
    return;
  }
  container.innerHTML = count
    ? auction.bids.slice(-5).reverse().map((bid, i) => `
        <div class="bid-entry animate-in" style="animation-delay:${i * 0.08}s">
          <div class="bid-info"><span class="bid-amount">${formatINR(bid.amount)}</span><span class="bid-time">${formatTimeAgo(bid.timestamp)}</span></div>
          <div class="bidder">${esc(bid.bidderName)}</div>
        </div>`).join('')
    : '<div class="no-bids">No bids yet</div>';
  container.classList.add('visible');
  button.textContent = 'Hide bids';
}

// ---------------- TICKER ----------------
function updateBiddersTicker() {
  const track = $('#bidders-track');
  if (!track) return;
  const best = new Map();
  allAuctions.forEach(a => a.bids.forEach(bid => {
    const current = best.get(bid.bidderName);
    if (!current || bid.amount > current.amount) best.set(bid.bidderName, { name: bid.bidderName, amount: bid.amount });
  }));
  const top = [...best.values()].sort((a, b) => b.amount - a.amount).slice(0, 20);
  const count = $('#active-bidders-count');
  if (count) count.textContent = `${top.length} active`;

  if (!top.length) {
    track.classList.add("static");
    track.innerHTML = '<div class="bidder-item"><span class="bidder-name">Be the first to bid</span></div>';
    return;
  }
  const items = top.map((bidder, i) => `
    <div class="bidder-item">
      <div class="bidder-avatar">${esc(bidder.name.charAt(0).toUpperCase())}</div>
      <span class="bidder-name">${esc(bidder.name)}</span>
      <span class="bidder-amount">${formatINR(bidder.amount)}</span>
      <span class="bidder-badge">${i < 3 ? ['🥇', '🥈', '🥉'][i] : `Top ${i + 1}`}</span>
    </div>`).join('');
  // Scroll only when there are enough bidders to fill the strip; otherwise show a static row.
  const scrolling = top.length >= 6;
  track.classList.toggle("static", !scrolling);
  track.innerHTML = scrolling ? items + items : items;
}

// ---------------- LOADING / ERRORS ----------------
function showSkeletonLoading() {
  ['#active-auctions', '#upcoming-auctions'].forEach(id => {
    const grid = $(id);
    if (grid && !grid.children.length) {
      grid.innerHTML = Array.from({ length: 3 }, () => `
        <article class="auction-card auction-card-skeleton"><div class="skeleton-image"></div>
          <div class="auction-body"><div class="skeleton-title"></div><div class="skeleton-artist"></div><div class="skeleton-meta"></div><div class="skeleton-button"></div></div>
        </article>`).join('');
    }
  });
}

function hideSkeletonLoading() {
  $$('.auction-card-skeleton').forEach(el => el.remove());
}

function showErrorState(message) {
  hideSkeletonLoading();
  const grid = $('#active-auctions');
  if (grid) {
    grid.innerHTML = `<div class="auction-empty-state"><span>!</span><p>${esc(message || 'We couldn’t load auctions right now.')} <button class="sb-link" onclick="refreshAuctions()">Try again</button></p></div>`;
  }
}

// ---------------- BIDDING ----------------
async function openBidModal(auctionId) {
  const user = await requireVerified('Sign in to bid');
  if (!user) return;
  const auction = allAuctions.find(a => a.id === auctionId);
  if (!auction) return;
  const minimum = auction.currentBidINR + 1;

  const { body, close } = openDialog({ title: 'Place your bid', kicker: 'Live auction' });
  body.innerHTML = `
    <div class="sb-bid-summary">
      <h3>${esc(auction.title)}</h3>
      <p>by ${esc(auction.artist)}</p>
      <p class="sb-bid-current"><span>${auction.bids.length ? 'Current bid' : 'Starting bid'}</span>${formatINR(auction.currentBidINR)}</p>
    </div>
    <form class="sb-form" novalidate>
      <div class="form-row">
        <label for="bid-amount">Your bid (INR)</label>
        <input id="bid-amount" type="number" inputmode="numeric" min="${minimum}" step="1" value="${minimum}" required />
        <p class="form-hint">Minimum ${formatINR(minimum)}. Bidding as ${esc(user.name)}. A winning bid is a commitment to buy.</p>
      </div>
      <p class="sb-form-error" role="alert"></p>
      <div class="sb-dialog-actions"><button type="button" class="sb-btn-ghost" data-cancel>Cancel</button><button type="submit" class="sb-btn">Place bid</button></div>
    </form>`;
  $('[data-cancel]', body).addEventListener('click', close);

  $('form', body).addEventListener('submit', async e => {
    e.preventDefault();
    const amount = Math.floor(Number($('#bid-amount', body).value));
    const errorEl = $('.sb-form-error', body);
    if (!amount || amount < minimum) { errorEl.textContent = `Your bid must be at least ${formatINR(minimum)}.`; return; }

    const button = $('button[type="submit"]', body);
    setBusy(button, true, 'Placing bid…');
    try {
      const data = await api('POST', `/api/auctions/${encodeURIComponent(auctionId)}/bids`, { amount });
      close();
      toast(`You’re the highest bidder on “${data.auction.title}” at ${formatINR(amount)}.`, 'bid', 6000);
      const index = allAuctions.findIndex(a => a.id === auctionId);
      if (index !== -1) allAuctions[index] = data.auction;
      applyFilters();
      updateBiddersTicker();
    } catch (err) {
      errorEl.textContent = err.message;
      setBusy(button, false);
      refreshAuctions();
    }
  });
}

// ---------------- REPORTS ----------------
function openReportModal(auctionId) {
  const auction = allAuctions.find(a => a.id === auctionId);
  if (!auction) return;
  const { body, close } = openDialog({ title: 'Report this artwork', kicker: `“${auction.title}” by ${auction.artist}` });
  body.innerHTML = `
    <form class="sb-form" novalidate>
      <div class="form-row"><label for="report-reason">Reason</label>
        <select id="report-reason" required>
          <option value="">Choose a reason</option>
          <option value="copyright">Copyright infringement or stolen artwork</option>
          <option value="fake">Fake or misrepresented artwork</option>
          <option value="inappropriate">Inappropriate content</option>
          <option value="spam">Spam or misleading listing</option>
          <option value="other">Something else</option>
        </select></div>
      <div class="form-row"><label for="report-description">Details (optional)</label><textarea id="report-description" rows="3" placeholder="Anything that will help us look into this"></textarea></div>
      <div class="form-row"><label for="report-evidence">Evidence links (optional)</label><textarea id="report-evidence" rows="2" placeholder="Links to the original work, copyright records…"></textarea></div>
      ${session.user?.email ? '' : '<div class="form-row"><label for="report-email">Your email</label><input id="report-email" type="email" placeholder="So we can follow up" required /></div>'}
      <p class="form-hint">We review every report. Knowingly false reports may lead to account restrictions.</p>
      <p class="sb-form-error" role="alert"></p>
      <div class="sb-dialog-actions"><button type="button" class="sb-btn-ghost" data-cancel>Cancel</button><button type="submit" class="sb-btn">Submit report</button></div>
    </form>`;
  $('[data-cancel]', body).addEventListener('click', close);

  $('form', body).addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = $('.sb-form-error', body);
    const reason = $('#report-reason', body).value;
    if (!reason) { errorEl.textContent = 'Please choose a reason.'; return; }
    const button = $('button[type="submit"]', body);
    setBusy(button, true, 'Sending…');
    try {
      await api('POST', '/api/reports', {
        auctionId,
        reason,
        description: $('#report-description', body).value,
        evidence: $('#report-evidence', body).value,
        reporterEmail: $('#report-email', body)?.value || '',
      });
      close();
      toast('Thank you. We’ll look into this report.', 'success');
    } catch (err) {
      errorEl.textContent = err.message;
      setBusy(button, false);
    }
  });
}

// ---------------- WATCHLIST (per device) ----------------
const WATCHLIST_KEY = 'surrealbid_watchlist';

function getWatchlist() {
  try { return JSON.parse(storage.get(WATCHLIST_KEY) || '[]'); } catch { return []; }
}

function isInWatchlist(id) {
  return getWatchlist().includes(id);
}

function toggleWatchlist(id) {
  const list = getWatchlist();
  const index = list.indexOf(id);
  if (index > -1) list.splice(index, 1); else list.push(id);
  storage.set(WATCHLIST_KEY, JSON.stringify(list));
  toast(index > -1 ? 'Removed from your watchlist' : 'Saved to your watchlist', 'info', 2500);
  $$(`.watchlist-btn[data-auction-id="${CSS.escape(id)}"] .heart-icon`).forEach(icon => { icon.textContent = index > -1 ? '🤍' : '❤️'; });
}

// ---------------- LIGHTBOX ----------------
let lightboxIndex = 0;

function openLightbox(auctionId) {
  lightboxIndex = visibleAuctions.findIndex(a => a.id === auctionId);
  if (lightboxIndex === -1) return;
  showLightboxImage(visibleAuctions[lightboxIndex]);
}

function showLightboxImage(auction) {
  const overlay = $('#image-lightbox');
  const image = $('#lightbox-image');
  image.src = auction.imageUrl || '';
  image.alt = auction.title;
  image.hidden = !auction.imageUrl;
  $('#lightbox-title').textContent = auction.title;
  $('#lightbox-artist').textContent = `by ${auction.artist}`;
  $('#lightbox-price').textContent = `${auction.bids.length ? 'Current bid' : 'Starting bid'}: ${formatINR(auction.currentBidINR)} (≈ $${convertINRtoUSD(auction.currentBidINR).toFixed(0)})`;
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('show'), 10);
}

function closeLightbox() {
  const overlay = $('#image-lightbox');
  overlay.classList.remove('show');
  setTimeout(() => overlay.classList.add('hidden'), 300);
}

function navigateLightbox(direction) {
  if (!visibleAuctions.length) return;
  lightboxIndex = (lightboxIndex + direction + visibleAuctions.length) % visibleAuctions.length;
  showLightboxImage(visibleAuctions[lightboxIndex]);
}

document.addEventListener('keydown', e => {
  if ($('#image-lightbox')?.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') navigateLightbox(-1);
  else if (e.key === 'ArrowRight') navigateLightbox(1);
});

document.addEventListener('DOMContentLoaded', () => {
  $('#image-lightbox')?.addEventListener('click', e => { if (e.target.id === 'image-lightbox') closeLightbox(); });
});
