// ======================================================
// Account pages: dashboard, checkout, email confirmation, password reset.
// ======================================================

const PAYMENT_LABELS = { none: 'Awaiting payment', pending: 'Payment started', paid: 'Paid' };

function auctionStatusLabel(a) {
  const now = Date.now();
  if (a.status === 'paused') return 'Paused';
  if (a.status === 'ended' || now >= a.endTime) return a.winner ? 'Ended · sold' : 'Ended · no bids';
  if (now < a.startTime) return `Starts ${formatDateTime(a.startTime)}`;
  return `Live · ends ${formatDateTime(a.endTime)}`;
}

// ---------------- DASHBOARD ----------------
onPage('/dashboard', async () => {
  const root = $('#dashboard-content');
  if (!session.user) {
    root.innerHTML = `<div class="dash-empty"><h2>Sign in to see your dashboard</h2><p>Your bids, wins and artist listings live here.</p>
      <button type="button" class="btn apply-next" onclick="openAuthDialog('signin')">Sign in <b aria-hidden="true">→</b></button></div>`;
    return;
  }

  root.innerHTML = '<p class="dash-loading">Loading your dashboard…</p>';
  await refreshSession();
  const user = session.user;
  if (!user) return;
  const artist = session.artist;

  const [bidding, mine] = await Promise.all([
    api('GET', '/api/auctions/bidding').then(d => d.auctions).catch(() => []),
    artist?.status === 'approved' ? api('GET', '/api/auctions/mine').then(d => d.auctions).catch(() => []) : Promise.resolve([]),
  ]);

  root.innerHTML = `
    <header class="dash-header">
      <div>
        <p class="about-kicker">Your account</p>
        <h1>Hello, <em>${esc(user.name.split(' ')[0])}.</em></h1>
        <p class="dash-email">${esc(user.email)} ${user.emailVerified ? '<span class="dash-badge ok">Email confirmed</span>' : '<span class="dash-badge warn">Email not confirmed</span>'}</p>
      </div>
      <div class="dash-header-actions">
        ${user.emailVerified ? '' : '<button type="button" class="btn apply-next" onclick="resendVerification(this)">Resend confirmation <b aria-hidden="true">↻</b></button>'}
        <button type="button" class="apply-text-btn" onclick="signOut()">Sign out</button>
      </div>
    </header>
    ${renderArtistSection(artist, mine)}
    ${renderCollectorSection(bidding)}`;
});

function renderArtistSection(artist, auctions) {
  if (!artist) {
    return `<section class="dash-section"><div class="dash-section-head"><p class="about-kicker">For artists</p><h2>Sell your work here</h2></div>
      <p class="dash-copy">Apply once. After approval you can list artwork for auction.</p>
      <button type="button" class="btn apply-next" onclick="navigateTo('/artist-register')">Apply as an artist <b aria-hidden="true">→</b></button></section>`;
  }
  if (artist.status === 'pending') {
    return `<section class="dash-section"><div class="dash-section-head"><p class="about-kicker">Artist application</p><h2>Under review</h2></div>
      <p class="dash-copy">Submitted ${esc(new Date(artist.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }))}. We’ll email you with our decision.</p></section>`;
  }
  if (artist.status === 'rejected') {
    return `<section class="dash-section"><div class="dash-section-head"><p class="about-kicker">Artist application</p><h2>Not approved yet</h2></div>
      <p class="dash-copy">${artist.rejectionReason ? `Reviewer note: “${esc(artist.rejectionReason)}”. ` : ''}You can update your application and apply again.</p>
      <button type="button" class="btn apply-next" onclick="navigateTo('/artist-register')">Update application <b aria-hidden="true">→</b></button></section>`;
  }

  const rows = auctions.map(a => {
    const shipping = a.payment?.shipping;
    return `<tr>
      <td><strong>${esc(a.title)}</strong><small>${a.bids.length} bid${a.bids.length === 1 ? '' : 's'}</small></td>
      <td>${esc(auctionStatusLabel(a))}</td>
      <td>${formatINR(a.currentBidINR)}</td>
      <td>${a.winner ? `${esc(PAYMENT_LABELS[a.payment.status] || '')}${shipping ? `<small>Ship to ${esc(shipping.name)}, ${esc(shipping.phone)}<br>${esc(shipping.address)}</small>` : ''}` : '—'}</td>
    </tr>`;
  }).join('');

  return `<section class="dash-section">
    <div class="dash-section-head"><p class="about-kicker">Your listings</p><h2>As an artist</h2>
      <button type="button" class="btn apply-next" onclick="navigateTo('/submit')">List an artwork <b aria-hidden="true">+</b></button></div>
    ${auctions.length ? `<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Artwork</th><th>Status</th><th>Price</th><th>Sale</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : '<p class="dash-copy">You haven’t listed anything yet.</p>'}
  </section>`;
}

function renderCollectorSection(auctions) {
  const now = Date.now();
  const won = auctions.filter(a => a.won);
  const open = auctions.filter(a => !a.won && a.status !== 'ended' && now < a.endTime);
  const lost = auctions.filter(a => !a.won && (a.status === 'ended' || now >= a.endTime));

  const wonRows = won.map(a => `<li class="dash-item">
      <div><strong>${esc(a.title)}</strong><small>by ${esc(a.artist)} · won at ${formatINR(a.winner?.amount || a.myHighestBid)}</small></div>
      ${a.paymentStatus === 'paid' ? '<span class="dash-badge ok">Paid</span>'
        : `<button type="button" class="btn apply-next" onclick="navigateTo('/checkout?auction=${encodeURIComponent(a.id)}')">Pay now <b aria-hidden="true">→</b></button>`}
    </li>`).join('');
  const openRows = open.map(a => `<li class="dash-item">
      <div><strong>${esc(a.title)}</strong><small>Your bid ${formatINR(a.myHighestBid)} · ${esc(formatRemaining(a.endTime - now))}</small></div>
      ${a.leading ? '<span class="dash-badge ok">Highest bid</span>' : `<button type="button" class="apply-text-btn" onclick="navigateTo('/auctions')">Outbid · bid again</button>`}
    </li>`).join('');
  const lostRows = lost.map(a => `<li class="dash-item muted"><div><strong>${esc(a.title)}</strong><small>Your bid ${formatINR(a.myHighestBid)} · sold for ${formatINR(a.winner?.amount || a.currentBidINR)}</small></div></li>`).join('');

  return `<section class="dash-section">
    <div class="dash-section-head"><p class="about-kicker">Collecting</p><h2>Your bids</h2></div>
    ${auctions.length ? `
      ${won.length ? `<h3 class="dash-subhead">Won</h3><ul class="dash-list">${wonRows}</ul>` : ''}
      ${open.length ? `<h3 class="dash-subhead">Live</h3><ul class="dash-list">${openRows}</ul>` : ''}
      ${lost.length ? `<h3 class="dash-subhead">Ended</h3><ul class="dash-list">${lostRows}</ul>` : ''}`
      : `<p class="dash-copy">You haven’t bid on anything yet.</p><button type="button" class="apply-text-btn" onclick="navigateTo('/auctions')">Browse auctions</button>`}
  </section>`;
}

// ---------------- CHECKOUT ----------------
onPage('/checkout', async params => {
  const root = $('#checkout-content');
  const auctionId = params.get('auction') || '';
  if (!session.user) {
    root.innerHTML = `<h2>Sign in to complete your purchase</h2><p class="dash-copy">Use the account you bid with.</p>
      <button type="button" class="btn apply-next" onclick="openAuthDialog('signin', { reason: 'Checkout' })">Sign in <b aria-hidden="true">→</b></button>`;
    return;
  }

  root.innerHTML = '<p class="dash-loading">Loading your purchase…</p>';
  let data;
  try {
    data = await api('GET', `/api/payments/auction/${encodeURIComponent(auctionId)}`);
  } catch (err) {
    root.innerHTML = `<h2>We couldn’t open this checkout</h2><p class="dash-copy">${esc(err.message)}</p>
      <button type="button" class="apply-text-btn" onclick="navigateTo('/dashboard')">Back to your dashboard</button>`;
    return;
  }

  const { auction, payment, enabled } = data;
  const summary = `<div class="checkout-summary-card">
      ${auction.imageUrl ? `<div class="checkout-art" style="background-image:url('${encodeURI(auction.imageUrl)}')"></div>` : ''}
      <div><p class="about-kicker">Your winning bid</p><h2>${esc(auction.title)}</h2><p>by ${esc(auction.artist)}</p>
      <p class="checkout-total">${formatINR(auction.amountINR)} <small>≈ $${convertINRtoUSD(auction.amountINR).toFixed(0)}</small></p></div>
    </div>`;

  if (payment.status === 'paid') {
    root.innerHTML = `${summary}<div class="checkout-done"><h3>Payment received. <em>Thank you.</em></h3>
      <p>Reference ${esc(payment.paymentId)}. The artist will contact you about delivery.</p>
      <button type="button" class="btn apply-next" onclick="navigateTo('/dashboard')">Back to your dashboard <b aria-hidden="true">→</b></button></div>`;
    return;
  }
  if (!enabled) {
    root.innerHTML = `${summary}<div class="checkout-done"><h3>Online payment isn’t live yet</h3>
      <p>Please <a href="/contact" onclick="navigateTo('/contact'); return false;">contact us</a> and we’ll arrange payment for this artwork directly.</p></div>`;
    return;
  }

  root.innerHTML = `${summary}
    <form id="checkout-form" class="sb-form checkout-form" novalidate>
      <h3>Delivery details</h3>
      <div class="form-row"><label for="checkout-name">Recipient name</label><input id="checkout-name" type="text" autocomplete="name" value="${esc(session.user.name)}" required /></div>
      <div class="form-row"><label for="checkout-phone">Phone</label><input id="checkout-phone" type="tel" autocomplete="tel" placeholder="+91 98765 43210" required /></div>
      <div class="form-row"><label for="checkout-address">Shipping address</label><textarea id="checkout-address" rows="3" autocomplete="street-address" required></textarea></div>
      <p class="sb-form-error" role="alert"></p>
      <button type="submit" class="btn apply-next">Pay ${formatINR(auction.amountINR)} <b aria-hidden="true">↗</b></button>
      <p class="form-hint">Payments are processed securely by Razorpay. See our <a href="/fees" onclick="navigateTo('/fees'); return false;">fees and refunds</a>.</p>
    </form>`;

  $('#checkout-form').addEventListener('submit', e => startPayment(e, auction));
});

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Couldn’t load the payment window. Check your connection and try again.'));
    document.head.appendChild(script);
  });
}

async function startPayment(event, auction) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorEl = $('.sb-form-error', form);
  const button = $('button[type="submit"]', form);
  errorEl.textContent = '';
  setBusy(button, true, 'Opening payment…');

  try {
    const [order] = await Promise.all([
      api('POST', '/api/payments/order', {
        auctionId: auction.id,
        name: $('#checkout-name').value.trim(),
        phone: $('#checkout-phone').value.trim(),
        address: $('#checkout-address').value.trim(),
      }),
      loadRazorpay(),
    ]);

    const checkout = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'SurrealBid',
      description: `${order.title} by ${order.artist}`,
      prefill: order.prefill,
      theme: { color: '#dc94c1' },
      modal: { ondismiss: () => setBusy(button, false) },
      handler: async response => {
        try {
          await api('POST', '/api/payments/verify', { auctionId: auction.id, ...response });
          toast('Payment confirmed. Thank you!', 'success', 7000);
          rerenderCurrentPage();
        } catch (err) {
          errorEl.textContent = err.message;
          setBusy(button, false);
        }
      },
    });
    checkout.on('payment.failed', resp => {
      errorEl.textContent = resp.error?.description || 'The payment didn’t go through. You haven’t been charged.';
      setBusy(button, false);
    });
    checkout.open();
  } catch (err) {
    errorEl.textContent = err.message;
    setBusy(button, false);
  }
}

// ---------------- EMAIL CONFIRMATION ----------------
onPage('/verify-email', async params => {
  const token = params.get('token');
  const set = state => $$('#verify-email-page .verification-status').forEach(el => { el.hidden = el.dataset.state !== state; });
  if (!token) { set('error'); return; }

  set('loading');
  try {
    await api('POST', '/api/auth/verify-email', { token });
    history.replaceState(null, '', '/verify-email');
    await refreshSession();
    set('success');
  } catch (err) {
    $('#verify-error-text').textContent = err.message;
    set('error');
  }
});

// ---------------- PASSWORD RESET ----------------
onPage('/reset-password', params => {
  const form = $('#reset-password-form');
  form.dataset.token = params.get('token') || '';
  if (form.dataset.bound) return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = $('.sb-form-error', form);
    const password = $('#reset-password').value;
    const confirm = $('#reset-password-confirm').value;
    errorEl.textContent = '';
    if (password.length < 8) { errorEl.textContent = 'Password must be at least 8 characters.'; return; }
    if (password !== confirm) { errorEl.textContent = 'The passwords don’t match.'; return; }

    const button = $('button[type="submit"]', form);
    setBusy(button, true, 'Saving…');
    try {
      const data = await api('POST', '/api/auth/reset-password', { token: form.dataset.token, password });
      setSession(data);
      form.reset();
      toast('Your password has been updated.', 'success');
      navigateTo('/dashboard');
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      setBusy(button, false);
    }
  });
});
