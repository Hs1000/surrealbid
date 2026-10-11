// ======================================================
// Admin panel (/admin). Uses a separate admin token kept in sessionStorage.
// ======================================================

const adminApi = (method, path, body) => api(method, `/api/admin${path}`, body, { admin: true });
let adminTab = 'artists';
let adminArtists = [];

onPage('/admin', () => {
  if (storage.get(ADMIN_TOKEN_KEY, sessionStorage)) {
    showAdminDashboard();
  } else {
    $('#admin-dashboard-wrap').style.display = 'none';
    openAdminLogin();
  }
});

function openAdminLogin() {
  const { body, close } = openDialog({ title: 'Admin sign-in', kicker: 'Restricted', onClose: () => { if (!storage.get(ADMIN_TOKEN_KEY, sessionStorage)) navigateTo('/'); } });
  body.innerHTML = `
    <form class="sb-form" novalidate>
      <div class="form-row"><label for="admin-password">Admin password</label><input id="admin-password" type="password" autocomplete="current-password" required /></div>
      <p class="sb-form-error" role="alert"></p>
      <button type="submit" class="sb-btn sb-btn-block">Open dashboard</button>
    </form>`;
  $('form', body).addEventListener('submit', async e => {
    e.preventDefault();
    const button = $('button[type="submit"]', body);
    setBusy(button, true, 'Checking…');
    try {
      const data = await api('POST', '/api/admin/login', { password: $('#admin-password', body).value });
      storage.set(ADMIN_TOKEN_KEY, data.token, sessionStorage);
      close();
      showAdminDashboard();
    } catch (err) {
      $('.sb-form-error', body).textContent = err.message;
      setBusy(button, false);
    }
  });
}

function logoutAdmin() {
  storage.remove(ADMIN_TOKEN_KEY, sessionStorage);
  navigateTo('/');
}

async function showAdminDashboard() {
  $('#admin-dashboard-wrap').style.display = 'block';
  await updateAdminStats();
  showAdminTab(adminTab);
}

function handleAdminError(err) {
  if (err.status === 401) {
    $('#admin-dashboard-wrap').style.display = 'none';
    openAdminLogin();
  } else {
    toast(err.message, 'error');
  }
}

function showAdminTab(tab) {
  adminTab = tab;
  $$('.admin-tab-content').forEach(el => { el.style.display = el.id === `admin-${tab}` ? 'block' : 'none'; });
  $$('.admin-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  ({ artists: loadPendingArtists, reports: loadArtworkReports, auctions: loadAdminAuctions, messages: loadAdminMessages, stats: updateAdminStats })[tab]();
}

async function updateAdminStats() {
  try {
    const { stats } = await adminApi('GET', '/stats');
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set('total-artists', stats.artists.total);
    set('verified-artists', stats.artists.verified);
    set('stat-pending-artists', stats.artists.pending);
    set('rejected-artists', stats.artists.rejected);
    set('stat-live-auctions', stats.auctions.active);
    set('stat-paid-auctions', stats.auctions.paid);
    set('total-reports', stats.reports.total);
    set('stat-users', stats.users.total);
  } catch (err) {
    handleAdminError(err);
  }
}

// ---------------- ARTISTS ----------------
async function loadPendingArtists() {
  const container = $('#pending-artists');
  const empty = $('#no-pending-artists');
  try {
    adminArtists = (await adminApi('GET', '/artists?status=pending')).artists;
  } catch (err) {
    return handleAdminError(err);
  }

  empty.style.display = adminArtists.length ? 'none' : 'block';
  container.innerHTML = adminArtists.map(artist => {
    const info = artist.basicInfo;
    const profile = artist.artisticProfile;
    const id = esc(info.artistId);
    const bio = profile.bio || '';
    return `
    <article class="admin-artist-card">
      <div class="admin-artist-card-inner">
        <div class="admin-artist-card-main">
          <div class="admin-artist-card-avatar">${info.profilePhoto ? `<img src="${esc(info.profilePhoto)}" alt="" />` : '<span class="admin-artist-avatar-placeholder">👤</span>'}</div>
          <div class="admin-artist-card-info">
            <h3 class="admin-artist-name">${esc(info.fullName)}</h3>
            <a href="mailto:${esc(info.email)}" class="admin-artist-email">${esc(info.email)}</a>
            ${info.location ? `<span class="admin-artist-location">${esc(info.location)}</span>` : ''}
            <div class="admin-artist-meta">
              <span class="admin-artist-meta-item"><strong>Style</strong> ${esc((profile.artisticStyle || []).join(', ') || '—')}</span>
              <span class="admin-artist-meta-item"><strong>Portfolio</strong> ${artist.portfolio.images.length} image${artist.portfolio.images.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>
        <div class="admin-artist-card-bio"><p>${esc(bio.slice(0, 180))}${bio.length > 180 ? '…' : ''}</p></div>
        <div class="admin-artist-card-actions">
          <button type="button" class="admin-btn admin-btn-approve" onclick="approveArtist('${id}')">Approve</button>
          <button type="button" class="admin-btn admin-btn-reject" onclick="rejectArtist('${id}')">Reject</button>
          <button type="button" class="admin-btn admin-btn-ghost" onclick="viewArtistDetails('${id}')">Review application</button>
        </div>
      </div>
    </article>`;
  }).join('');
  $('#artists-count').textContent = adminArtists.length;
}

function viewArtistDetails(artistId) {
  const a = adminArtists.find(x => x.basicInfo.artistId === artistId);
  if (!a) return;
  const iv = a.identityVerification;
  const link = url => (/^https?:\/\//i.test(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>` : esc(url) || '—');
  const { body } = openDialog({ title: a.basicInfo.fullName, kicker: 'Artist application', wide: true });
  body.innerHTML = `
    <dl class="admin-detail">
      <dt>Email</dt><dd>${esc(a.basicInfo.email)}</dd>
      <dt>Phone</dt><dd>${esc(a.basicInfo.phone) || '—'}</dd>
      <dt>Location</dt><dd>${esc(a.basicInfo.location)}</dd>
      <dt>Experience</dt><dd>${esc(a.artisticProfile.yearsExperience)}</dd>
      <dt>Training</dt><dd>${esc(a.artisticProfile.education) || '—'}</dd>
      <dt>Website</dt><dd>${link(iv.website)}</dd>
      <dt>Instagram</dt><dd>${esc(iv.instagram) || '—'}</dd>
      <dt>Other</dt><dd>${esc(iv.otherSocialMedia) || '—'}</dd>
      <dt>Exhibitions</dt><dd>${esc(a.artisticProfile.exhibitions) || '—'}</dd>
      <dt>Awards</dt><dd>${esc(a.artisticProfile.awards) || '—'}</dd>
    </dl>
    <h3 class="admin-detail-head">Statement</h3>
    <p class="admin-detail-bio">${esc(a.artisticProfile.bio)}</p>
    <h3 class="admin-detail-head">Portfolio</h3>
    <div class="admin-portfolio">${a.portfolio.images.map(src => `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" /></a>`).join('') || '<p>No images submitted.</p>'}</div>
    <div class="sb-dialog-actions">
      <button type="button" class="sb-btn-ghost" onclick="rejectArtist('${esc(artistId)}')">Reject</button>
      <button type="button" class="sb-btn" onclick="approveArtist('${esc(artistId)}')">Approve</button>
    </div>`;
}

async function approveArtist(artistId) {
  const ok = await confirmDialog('They’ll be able to list artwork for auction straight away.', { title: 'Approve this artist?', confirmLabel: 'Approve' });
  if (!ok) return;
  try {
    await adminApi('POST', `/artists/${encodeURIComponent(artistId)}/approve`);
    toast('Artist approved. They’ve been emailed.', 'success');
    updateAdminStats();
    loadPendingArtists();
  } catch (err) {
    handleAdminError(err);
  }
}

async function rejectArtist(artistId) {
  const reason = await promptDialog({ title: 'Reject application', label: 'Note for the artist (included in their email)', placeholder: 'What would make this application stronger?', confirmLabel: 'Reject' });
  if (reason === null) return;
  try {
    await adminApi('POST', `/artists/${encodeURIComponent(artistId)}/reject`, { reason });
    toast('Application rejected. The artist has been emailed.', 'info');
    updateAdminStats();
    loadPendingArtists();
  } catch (err) {
    handleAdminError(err);
  }
}

// ---------------- REPORTS ----------------
async function loadArtworkReports() {
  const container = $('#artwork-reports');
  let reports;
  try {
    reports = (await adminApi('GET', '/reports')).reports;
  } catch (err) {
    return handleAdminError(err);
  }
  $('#no-reports').style.display = reports.length ? 'none' : 'block';
  $('#reports-count').textContent = reports.filter(r => r.status === 'pending').length;
  container.innerHTML = reports.map(r => `
    <div class="admin-report-card">
      <div class="report-header"><h4>${esc(r.reason)}</h4><span class="report-status status-${esc(r.status)}">${esc(r.status)}</span></div>
      <div class="report-details">
        <p><strong>Auction:</strong> ${esc(r.auctionId)}</p>
        <p><strong>Reporter:</strong> ${esc(r.reporterEmail)}</p>
        <p><strong>Details:</strong> ${esc(r.description) || '—'}</p>
        <p><strong>Evidence:</strong> ${esc(r.evidence) || '—'}</p>
        <p><strong>Date:</strong> ${esc(new Date(r.createdAt || r.timestamp).toLocaleString())}</p>
      </div>
      <div class="report-actions">
        <button class="admin-btn admin-btn-approve" onclick="setReportStatus('${esc(r.id)}', 'resolved')">Resolve</button>
        <button class="admin-btn admin-btn-ghost" onclick="setReportStatus('${esc(r.id)}', 'investigating')">Investigating</button>
        <button class="admin-btn admin-btn-reject" onclick="setReportStatus('${esc(r.id)}', 'dismissed')">Dismiss</button>
      </div>
    </div>`).join('');
}

async function setReportStatus(id, status) {
  try {
    await adminApi('PATCH', `/reports/${encodeURIComponent(id)}`, { status });
    toast(`Report marked ${status}.`, 'success');
    loadArtworkReports();
  } catch (err) {
    handleAdminError(err);
  }
}

// ---------------- AUCTIONS ----------------
async function loadAdminAuctions() {
  const container = $('#admin-auctions-list');
  let auctions;
  try {
    auctions = (await adminApi('GET', '/auctions')).auctions;
  } catch (err) {
    return handleAdminError(err);
  }
  $('#no-auctions').style.display = auctions.length ? 'none' : 'block';
  $('#auctions-count').textContent = auctions.length;
  container.innerHTML = auctions.map(a => {
    const id = esc(a.id);
    return `
    <div class="admin-auction-card">
      <div class="auction-header"><h4>${esc(a.title)}</h4><span class="auction-status status-${esc(a.status)}">${esc(a.status)}</span></div>
      <div class="auction-details">
        <p><strong>Artist:</strong> ${esc(a.artist)}</p>
        <p><strong>Price:</strong> ${formatINR(a.currentBidINR)} · ${a.bids.length} bids</p>
        <p><strong>Runs:</strong> ${esc(formatDateTime(a.startTime))} → ${esc(formatDateTime(a.endTime))}</p>
        ${a.winner ? `<p><strong>Winner:</strong> ${esc(a.winner.name)} · ${esc(a.payment?.status || 'none')}</p>` : ''}
      </div>
      <div class="auction-actions">
        ${a.status === 'active' ? `<button class="admin-btn admin-btn-ghost" onclick="setAuctionStatus('${id}', 'paused')">Pause</button>` : ''}
        ${a.status === 'paused' || a.status === 'pending' || a.status === 'pending_verification' ? `<button class="admin-btn admin-btn-approve" onclick="setAuctionStatus('${id}', 'active')">Activate</button>` : ''}
        ${a.payment?.status === 'paid' ? '' : `<button class="admin-btn admin-btn-reject" onclick="deleteAuction('${id}')">Delete</button>`}
      </div>
    </div>`;
  }).join('');
}

async function setAuctionStatus(id, status) {
  try {
    await adminApi('PATCH', `/auctions/${encodeURIComponent(id)}`, { status });
    toast(status === 'paused' ? 'Auction paused and hidden from the catalogue.' : 'Auction is live.', 'success');
    loadAdminAuctions();
    updateAdminStats();
  } catch (err) {
    handleAdminError(err);
  }
}

async function deleteAuction(id) {
  const ok = await confirmDialog('This permanently removes the auction and its bids.', { title: 'Delete auction?', confirmLabel: 'Delete', danger: true });
  if (!ok) return;
  try {
    await adminApi('DELETE', `/auctions/${encodeURIComponent(id)}`);
    toast('Auction deleted.', 'info');
    loadAdminAuctions();
    updateAdminStats();
  } catch (err) {
    handleAdminError(err);
  }
}

// ---------------- MESSAGES ----------------
async function loadAdminMessages() {
  const container = $('#admin-messages-list');
  let messages;
  try {
    messages = (await adminApi('GET', '/messages')).messages;
  } catch (err) {
    return handleAdminError(err);
  }
  container.innerHTML = messages.length
    ? messages.map(m => `
      <div class="admin-report-card">
        <div class="report-header"><h4>${esc(m.name)} · ${esc(m.subject)}</h4><span class="report-status">${esc(new Date(m.createdAt).toLocaleDateString())}</span></div>
        <div class="report-details"><p><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></p><p>${esc(m.message)}</p></div>
      </div>`).join('')
    : '<p class="admin-empty-text">No messages yet.</p>';
}
