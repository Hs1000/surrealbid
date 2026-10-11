// ======================================================
// SurrealBid core: API client, session, dialogs, toasts, routing.
// All data lives on the server; the browser keeps only the login token,
// theme, watchlist and a cached exchange rate.
// ======================================================

// ---------------- SMALL HELPERS ----------------
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function formatINR(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDateTime(ms) {
  return new Date(Number(ms)).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function formatTimeAgo(timestamp) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const storage = {
  get(key, area = localStorage) { try { return area.getItem(key); } catch { return null; } },
  set(key, value, area = localStorage) { try { area.setItem(key, value); } catch { /* storage unavailable */ } },
  remove(key, area = localStorage) { try { area.removeItem(key); } catch { /* storage unavailable */ } },
};

// ---------------- API CLIENT ----------------
const TOKEN_KEY = 'sb_token';
const ADMIN_TOKEN_KEY = 'sb_admin_token';

async function api(method, path, body, { admin = false } = {}) {
  const token = admin ? storage.get(ADMIN_TOKEN_KEY, sessionStorage) : storage.get(TOKEN_KEY);
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error('Unable to reach SurrealBid. Check your connection and try again.'), { status: 0 });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) {
      if (admin) storage.remove(ADMIN_TOKEN_KEY, sessionStorage);
      else clearSession();
    }
    throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { status: response.status });
  }
  return data;
}

// ---------------- TOASTS ----------------
const TOAST_ICONS = { success: '✓', error: '!', info: '✦', bid: '₹' };
let toastTimer;

function toast(message, type = 'info', duration = 4500) {
  const el = $('#notification-toast');
  if (!el) return;
  $('.notification-text', el).textContent = message;
  $('.notification-icon', el).textContent = TOAST_ICONS[type] || TOAST_ICONS.info;
  el.dataset.type = type;
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  if (duration > 0) toastTimer = setTimeout(hideNotification, duration);
}

function hideNotification() {
  const el = $('#notification-toast');
  if (!el) return;
  el.classList.remove('show');
  setTimeout(() => el.classList.add('hidden'), 300);
}

// ---------------- DIALOGS ----------------
// One accessible modal used for sign-in, bids, reports, confirmations and admin prompts.
function openDialog({ title, kicker = '', body = '', wide = false, onClose } = {}) {
  closeDialog();
  const overlay = document.createElement('div');
  overlay.className = 'sb-dialog-overlay';
  overlay.id = 'sb-dialog';
  overlay.innerHTML = `
    <div class="sb-dialog${wide ? ' sb-dialog-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="sb-dialog-title">
      <button type="button" class="sb-dialog-close" aria-label="Close">×</button>
      ${kicker ? `<p class="about-kicker">${esc(kicker)}</p>` : ''}
      <h2 id="sb-dialog-title">${esc(title)}</h2>
      <div class="sb-dialog-body"></div>
    </div>`;
  const bodyEl = $('.sb-dialog-body', overlay);
  if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);

  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  $('.sb-dialog-close', overlay).addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  overlay.close = close;

  document.body.appendChild(overlay);
  setTimeout(() => { const first = $('input, select, textarea, button:not(.sb-dialog-close)', bodyEl); if (first) first.focus(); }, 30);
  return { overlay, body: bodyEl, close };
}

function closeDialog() {
  const existing = $('#sb-dialog');
  if (existing) existing.close();
}

function confirmDialog(message, { title = 'Are you sure?', confirmLabel = 'Confirm', danger = false } = {}) {
  return new Promise(resolve => {
    let answered = false;
    const { body, close } = openDialog({ title, onClose: () => { if (!answered) resolve(false); } });
    body.innerHTML = `<p class="sb-dialog-text">${esc(message)}</p>
      <div class="sb-dialog-actions">
        <button type="button" class="sb-btn-ghost" data-answer="no">Cancel</button>
        <button type="button" class="sb-btn${danger ? ' sb-btn-danger' : ''}" data-answer="yes">${esc(confirmLabel)}</button>
      </div>`;
    $$('[data-answer]', body).forEach(btn => btn.addEventListener('click', () => {
      answered = true;
      resolve(btn.dataset.answer === 'yes');
      close();
    }));
  });
}

function promptDialog({ title, label, placeholder = '', confirmLabel = 'Submit', required = true, multiline = true }) {
  return new Promise(resolve => {
    let answered = false;
    const { body, close } = openDialog({ title, onClose: () => { if (!answered) resolve(null); } });
    const field = multiline
      ? `<textarea id="sb-prompt-input" rows="4" placeholder="${esc(placeholder)}"></textarea>`
      : `<input id="sb-prompt-input" type="text" placeholder="${esc(placeholder)}" />`;
    body.innerHTML = `<form class="sb-form" novalidate>
        <div class="form-row"><label for="sb-prompt-input">${esc(label)}</label>${field}<span class="error-message" id="sb-prompt-error"></span></div>
        <div class="sb-dialog-actions"><button type="button" class="sb-btn-ghost" data-cancel>Cancel</button><button type="submit" class="sb-btn">${esc(confirmLabel)}</button></div>
      </form>`;
    $('[data-cancel]', body).addEventListener('click', close);
    $('form', body).addEventListener('submit', e => {
      e.preventDefault();
      const value = $('#sb-prompt-input', body).value.trim();
      if (required && !value) { $('#sb-prompt-error', body).textContent = 'This field is required.'; return; }
      answered = true;
      resolve(value);
      close();
    });
  });
}

function setBusy(button, busy, busyLabel = 'Working…') {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.textContent = busyLabel;
  } else {
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}

// ---------------- SESSION ----------------
const session = { user: null, artist: null, ready: null };

function setSession({ token, user, artist }) {
  if (token) storage.set(TOKEN_KEY, token);
  session.user = user || null;
  session.artist = artist || null;
  updateAccountNav();
}

function clearSession() {
  storage.remove(TOKEN_KEY);
  session.user = null;
  session.artist = null;
  updateAccountNav();
}

async function loadSession() {
  if (!storage.get(TOKEN_KEY)) return null;
  try {
    const data = await api('GET', '/api/auth/me');
    setSession(data);
  } catch {
    clearSession();
  }
  return session.user;
}

async function refreshSession() {
  session.ready = loadSession();
  return session.ready;
}

function signOut() {
  clearSession();
  toast('You’ve been signed out.', 'info');
  navigateTo('/');
}

function updateAccountNav() {
  const link = $('#nav-account');
  if (!link) return;
  if (session.user) {
    link.textContent = session.user.name.split(' ')[0];
    link.setAttribute('href', '/dashboard');
    link.onclick = e => { e.preventDefault(); navigateTo('/dashboard'); };
    link.classList.toggle('nav-account-unverified', !session.user.emailVerified);
    link.title = session.user.emailVerified ? 'Your account' : 'Your account — email not confirmed yet';
  } else {
    link.textContent = 'Sign in';
    link.setAttribute('href', '/dashboard');
    link.onclick = e => { e.preventDefault(); openAuthDialog('signin'); };
    link.classList.remove('nav-account-unverified');
    link.title = 'Sign in or create an account';
  }
}

// ---------------- SIGN IN / SIGN UP ----------------
function openAuthDialog(mode = 'signin', { reason = '', onSuccess } = {}) {
  const titles = { signin: 'Welcome back', signup: 'Create your account', forgot: 'Reset your password' };
  const { body, close } = openDialog({ title: titles[mode], kicker: reason || 'SurrealBid account' });

  const nameField = mode === 'signup' ? `
    <div class="form-row"><label for="auth-name">Your name</label><input id="auth-name" type="text" autocomplete="name" placeholder="Your full name" required /></div>` : '';
  const passwordField = mode !== 'forgot' ? `
    <div class="form-row"><label for="auth-password">Password</label>
      <input id="auth-password" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" placeholder="${mode === 'signup' ? 'At least 8 characters' : 'Your password'}" required minlength="8" /></div>` : '';
  const submitLabel = { signin: 'Sign in', signup: 'Create account', forgot: 'Send reset link' }[mode];
  const footer = {
    signin: `<button type="button" class="sb-link" data-mode="forgot">Forgot password?</button><span>New here? <button type="button" class="sb-link" data-mode="signup">Create an account</button></span>`,
    signup: `<span>Already have an account? <button type="button" class="sb-link" data-mode="signin">Sign in</button></span>`,
    forgot: `<span><button type="button" class="sb-link" data-mode="signin">Back to sign in</button></span>`,
  }[mode];

  body.innerHTML = `
    ${mode !== 'forgot' ? '<div class="sb-google" hidden><div class="sb-google-button"></div><p class="sb-or"><span>or use email</span></p></div>' : ''}
    <form class="sb-form" novalidate>
      ${mode === 'forgot' ? '<p class="sb-dialog-text">Enter your email and we’ll send you a link to choose a new password.</p>' : ''}
      ${nameField}
      <div class="form-row"><label for="auth-email">Email address</label><input id="auth-email" type="email" autocomplete="email" placeholder="your.email@example.com" required /></div>
      ${passwordField}
      <p class="sb-form-error" role="alert"></p>
      <button type="submit" class="sb-btn sb-btn-block">${submitLabel}</button>
      ${mode === 'signup' ? '<p class="sb-fine-print">By creating an account you agree to our <a href="/terms" onclick="closeDialog(); navigateTo(\'/terms\'); return false;">terms</a> and <a href="/privacy" onclick="closeDialog(); navigateTo(\'/privacy\'); return false;">privacy policy</a>.</p>' : ''}
      <div class="sb-dialog-footer">${footer}</div>
    </form>`;

  if (mode !== 'forgot') {
    renderGoogleButton(body, mode, async credential => {
      const data = await api('POST', '/api/auth/google', { credential });
      setSession(data);
      close();
      toast(`Welcome, ${data.user.name.split(' ')[0]}.`, 'success');
      if (onSuccess) onSuccess(data.user);
      rerenderCurrentPage();
    });
  }

  $$('[data-mode]', body).forEach(btn => btn.addEventListener('click', () => openAuthDialog(btn.dataset.mode, { reason, onSuccess })));

  $('form', body).addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = $('.sb-form-error', body);
    const button = $('button[type="submit"]', body);
    errorEl.textContent = '';
    const email = $('#auth-email', body).value.trim();
    const password = $('#auth-password', body)?.value || '';
    const name = $('#auth-name', body)?.value.trim() || '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = 'Please enter a valid email address.'; return; }
    if (mode === 'signup' && name.length < 2) { errorEl.textContent = 'Please enter your name.'; return; }
    if (mode !== 'forgot' && password.length < 8) { errorEl.textContent = 'Password must be at least 8 characters.'; return; }

    setBusy(button, true);
    try {
      if (mode === 'forgot') {
        const data = await api('POST', '/api/auth/forgot-password', { email });
        body.innerHTML = `<p class="sb-dialog-text">${esc(data.message)}</p><div class="sb-dialog-actions"><button type="button" class="sb-btn" data-done>Done</button></div>`;
        $('[data-done]', body).addEventListener('click', close);
        return;
      }
      const data = await api('POST', mode === 'signup' ? '/api/auth/signup' : '/api/auth/login', { name, email, password });
      setSession(data);
      close();
      if (mode === 'signup') {
        toast(`Welcome, ${data.user.name.split(' ')[0]}! Check your inbox to confirm your email.`, 'success', 7000);
      } else {
        toast(`Welcome back, ${data.user.name.split(' ')[0]}.`, 'success');
      }
      if (onSuccess) onSuccess(data.user);
      rerenderCurrentPage();
    } catch (err) {
      errorEl.textContent = err.message;
      setBusy(button, false);
    }
  });
}

// ---------------- GOOGLE SIGN-IN ----------------
// Uses Google Identity Services; shown only when the server has GOOGLE_CLIENT_ID set.
let googleSetup = null;
let googleCallback = null;

function loadGoogle() {
  if (!googleSetup) {
    googleSetup = api('GET', '/api/auth/google/config').then(({ clientId }) => {
      if (!clientId) return null;
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: response => googleCallback && googleCallback(response.credential),
            ux_mode: 'popup',
          });
          resolve(window.google);
        };
        script.onerror = () => reject(new Error('Google sign-in couldn’t load.'));
        document.head.appendChild(script);
      });
    }).catch(() => null);
  }
  return googleSetup;
}

async function renderGoogleButton(dialogBody, mode, onCredential) {
  const google = await loadGoogle();
  const wrap = $('.sb-google', dialogBody);
  if (!google || !wrap || !document.body.contains(wrap)) return;
  googleCallback = async credential => {
    const errorEl = $('.sb-form-error', dialogBody);
    try {
      await onCredential(credential);
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message;
    }
  };
  google.accounts.id.renderButton($('.sb-google-button', wrap), {
    theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'outline' : 'filled_black',
    size: 'large',
    shape: 'pill',
    text: mode === 'signup' ? 'signup_with' : 'continue_with',
    width: Math.min(376, wrap.clientWidth || 376),
  });
  wrap.hidden = false;
}

/** Resolves with the signed-in user, opening the sign-in dialog first if needed (null if dismissed). */
function requireSignIn(reason) {
  if (session.user) return Promise.resolve(session.user);
  return new Promise(resolve => {
    let done = false;
    openAuthDialog('signin', { reason, onSuccess: user => { done = true; resolve(user); } });
    const overlay = $('#sb-dialog');
    // Resolve null if the dialog is closed without signing in.
    const observer = new MutationObserver(() => {
      if (!document.getElementById('sb-dialog') && !done) { observer.disconnect(); resolve(null); }
      else if (done) observer.disconnect();
    });
    if (overlay) observer.observe(document.body, { childList: true });
  });
}

/** Like requireSignIn, but also requires a confirmed email. */
async function requireVerified(reason) {
  const user = await requireSignIn(reason);
  if (!user) return null;
  if (user.emailVerified) return user;
  showVerifyEmailDialog();
  return null;
}

function showVerifyEmailDialog() {
  const { body, close } = openDialog({ title: 'Confirm your email first', kicker: 'One more step' });
  body.innerHTML = `
    <p class="sb-dialog-text">We sent a confirmation link to <strong>${esc(session.user?.email)}</strong>. Open it to start bidding and applying.</p>
    <div class="sb-dialog-actions"><button type="button" class="sb-btn-ghost" data-close>Close</button><button type="button" class="sb-btn" data-resend>Resend email</button></div>`;
  $('[data-close]', body).addEventListener('click', close);
  $('[data-resend]', body).addEventListener('click', e => resendVerification(e.currentTarget));
}

async function resendVerification(button) {
  setBusy(button, true, 'Sending…');
  try {
    await api('POST', '/api/auth/resend-verification');
    toast('A new confirmation link is on its way.', 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setBusy(button, false);
  }
}

// ---------------- IMAGES ----------------
// Resizes an image file to a JPEG data URL before upload (keeps uploads small and strips EXIF data).
function compressImageFile(file, maxSize = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file isn’t a readable image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function validateImageFile(file, maxMB = 10) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) return 'Please use a JPG, PNG, WebP or GIF image.';
  if (file.size > maxMB * 1024 * 1024) return `Images must be under ${maxMB}MB.`;
  return '';
}

// ---------------- EXCHANGE RATE ----------------
const RATE_KEY = 'sb_inr_per_usd';
let inrPerUsd = 83;

(function loadExchangeRate() {
  try {
    const cached = JSON.parse(storage.get(RATE_KEY) || 'null');
    if (cached && cached.rate > 60 && cached.rate < 120) inrPerUsd = cached.rate;
    if (cached && Date.now() - cached.at < 60 * 60 * 1000) return;
  } catch { /* ignore bad cache */ }
  fetch('https://api.exchangerate-api.com/v4/latest/USD')
    .then(r => r.json())
    .then(data => {
      const rate = data?.rates?.INR;
      if (rate > 60 && rate < 120) {
        inrPerUsd = rate;
        storage.set(RATE_KEY, JSON.stringify({ rate, at: Date.now() }));
      }
    })
    .catch(() => { /* keep fallback rate */ });
})();

function convertINRtoUSD(inr) {
  return Number(inr || 0) / inrPerUsd;
}

// ---------------- THEME ----------------
const THEME_KEY = 'surrealbid_theme';

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  storage.set(THEME_KEY, theme);
  const icon = $('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}

// ---------------- ROUTER ----------------
// Page hooks are registered by the feature scripts (auctions.js, artist.js, account.js, admin.js, contact.js).
const routes = {
  '/': { page: 'home-page' },
  '/auctions': { page: 'auctions-page' },
  '/submit': { page: 'submit-page' },
  '/contact': { page: 'contact-page' },
  '/about': { page: 'about-page' },
  '/artist-register': { page: 'artist-register-page' },
  '/admin': { page: 'admin-page' },
  '/dashboard': { page: 'dashboard-page' },
  '/checkout': { page: 'checkout-page' },
  '/verify-email': { page: 'verify-email-page' },
  '/reset-password': { page: 'reset-password-page' },
  '/terms': { page: 'terms-page' },
  '/privacy': { page: 'privacy-page' },
  '/fees': { page: 'fees-page' },
};
const routeAliases = { '/verify': '/verify-email' };
const pageHooks = {};
let currentPath = null;

function onPage(path, hook) {
  pageHooks[path] = hook;
}

function showPage(path, { push = true, scroll = true } = {}) {
  const url = new URL(path, window.location.origin);
  let pathname = routeAliases[url.pathname] || url.pathname;
  if (!routes[pathname]) pathname = '/';

  const leaving = currentPath;
  currentPath = pathname;
  document.dispatchEvent(new CustomEvent('sb:leave', { detail: { path: leaving } }));

  $$('.page').forEach(page => page.classList.remove('active'));
  const pageEl = document.getElementById(routes[pathname].page);
  if (pageEl) pageEl.classList.add('active');

  $$('.nav-link').forEach(link => link.classList.toggle('nav-link-active', link.getAttribute('href') === pathname));

  const target = pathname + url.search;
  if (push && target !== window.location.pathname + window.location.search) history.pushState(null, '', target);
  else if (!push && target !== window.location.pathname + window.location.search) history.replaceState(null, '', target);

  if (scroll) window.scrollTo({ top: 0 });
  const hook = pageHooks[pathname];
  if (hook) Promise.resolve(session.ready).then(() => hook(url.searchParams));
}

function navigateTo(path) {
  showPage(path);
}

function rerenderCurrentPage() {
  if (currentPath) showPage(currentPath + window.location.search, { push: false, scroll: false });
}

window.addEventListener('popstate', () => showPage(window.location.pathname + window.location.search, { push: false, scroll: false }));

document.addEventListener('DOMContentLoaded', () => {
  setTheme(storage.get(THEME_KEY) || 'dark');
  $('#theme-toggle')?.addEventListener('click', toggleTheme);
  updateAccountNav();
  session.ready = loadSession();
  showPage(window.location.pathname + window.location.search, { push: false });
});
