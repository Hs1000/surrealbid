// ======================================================
// Artist application (/artist-register) and listing artwork (/submit).
// ======================================================

let currentRegistrationStep = 1;
let profilePhotoData = null;
let portfolioImages = []; // compressed data URLs
const MAX_PORTFOLIO = 5;
const STEP_NAMES = ['', 'basic', 'artistic', 'identity', 'portfolio'];

// ---------------- GATE ----------------
// Shows the form only to signed-in, confirmed users without a pending/approved application.
function renderApplyGate() {
  const gate = $('#apply-gate');
  const form = $('#artist-registration-form');
  const success = $('#artist-success');
  success.hidden = true;

  const show = html => { gate.innerHTML = html; gate.hidden = false; form.hidden = true; };
  const user = session.user;
  const artist = session.artist;

  if (!user) {
    return show(`
      <p class="about-kicker">Before you begin</p>
      <h2>Sign in to apply</h2>
      <p>Applications are tied to your SurrealBid account, so we can reach you and you can track your review.</p>
      <div class="apply-gate-actions">
        <button type="button" class="btn apply-next" onclick="openAuthDialog('signup', { reason: 'Artist application' })">Create an account <b aria-hidden="true">→</b></button>
        <button type="button" class="apply-text-btn" onclick="openAuthDialog('signin', { reason: 'Artist application' })">I already have one</button>
      </div>`);
  }
  if (!user.emailVerified) {
    return show(`
      <p class="about-kicker">One more step</p>
      <h2>Confirm your email</h2>
      <p>We sent a confirmation link to <strong>${esc(user.email)}</strong>. Open it, then come back here to apply.</p>
      <div class="apply-gate-actions">
        <button type="button" class="btn apply-next" onclick="resendVerification(this)">Resend the link <b aria-hidden="true">↻</b></button>
        <button type="button" class="apply-text-btn" onclick="refreshSession().then(renderApplyGate)">I’ve confirmed it</button>
      </div>`);
  }
  if (artist?.status === 'pending') {
    return show(`
      <p class="about-kicker">Application received</p>
      <h2>Your work is <em>under review.</em></h2>
      <p>We read every application by hand and will email ${esc(user.email)} with our decision, usually within a few days.</p>
      <div class="apply-gate-actions"><button type="button" class="btn apply-next" onclick="navigateTo('/dashboard')">Go to your dashboard <b aria-hidden="true">→</b></button></div>`);
  }
  if (artist?.status === 'approved') {
    return show(`
      <p class="about-kicker">You’re approved</p>
      <h2>Welcome to the <em>house.</em></h2>
      <p>Your artist profile is live. List a work whenever you’re ready.</p>
      <div class="apply-gate-actions"><button type="button" class="btn apply-next" onclick="navigateTo('/submit')">List an artwork <b aria-hidden="true">→</b></button></div>`);
  }

  gate.hidden = true;
  form.hidden = false;
  const notice = $('#apply-rejection');
  if (artist?.status === 'rejected') {
    notice.hidden = false;
    notice.innerHTML = `<strong>Your previous application wasn’t approved.</strong>${artist.rejectionReason ? ` Reviewer note: “${esc(artist.rejectionReason)}”.` : ''} You’re welcome to update it and apply again.`;
  } else {
    notice.hidden = true;
  }
  return null;
}

onPage('/artist-register', () => {
  const formVisible = renderApplyGate() === null;
  if (!formVisible) return;
  if ($('#artist-registration-form').dataset.started) return; // keep progress if they navigate away and back
  $('#artist-registration-form').dataset.started = 'true';

  currentRegistrationStep = 1;
  showRegistrationStep(1);
  updateStepIndicator(1);
  initPortfolioUpload();
  initStyleChips();
  initBioWordCount();

  $('#artist-fullname').value = session.user.name;
  $('#artist-email').value = session.user.email;
});

// ---------------- STEPS ----------------
function showRegistrationStep(step) {
  $$('.registration-step').forEach(el => { el.style.display = 'none'; });
  const target = document.getElementById(`step-${STEP_NAMES[step]}`);
  if (!target) return;
  target.style.display = 'block';
  currentRegistrationStep = step;
  const panel = $('#artist-register-page .apply-panel');
  if (panel && panel.getBoundingClientRect().top < 0) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateStepIndicator(activeStep) {
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-indicator-${i}`);
    const circle = $('.step-circle', stepEl);
    stepEl.classList.remove('active', 'completed');
    stepEl.removeAttribute('aria-current');
    circle.classList.remove('active', 'completed', 'inactive');
    if (i < activeStep) { circle.classList.add('completed'); stepEl.classList.add('completed'); }
    else if (i === activeStep) { circle.classList.add('active'); stepEl.classList.add('active'); stepEl.setAttribute('aria-current', 'step'); }
    else circle.classList.add('inactive');
  }
}

async function nextRegistrationStep() {
  if (!(await validateCurrentStep())) return;
  if (currentRegistrationStep < 4) {
    showRegistrationStep(currentRegistrationStep + 1);
    updateStepIndicator(currentRegistrationStep);
  }
}

function prevRegistrationStep() {
  if (currentRegistrationStep > 1) {
    showRegistrationStep(currentRegistrationStep - 1);
    updateStepIndicator(currentRegistrationStep);
  }
}

// ---------------- VALIDATION ----------------
function showFieldError(fieldName, message) {
  const errorEl = document.getElementById(`${fieldName}-error`);
  if (errorEl) errorEl.textContent = message;
  document.getElementById(`artist-${fieldName}`)?.classList.add('error');
}

function clearStepErrors(step) {
  const stepEl = document.getElementById(`step-${STEP_NAMES[step]}`);
  if (!stepEl) return;
  $$('.error-message', stepEl).forEach(el => { el.textContent = ''; });
  $$('.error', stepEl).forEach(el => el.classList.remove('error'));
}

function focusFirstError(step) {
  const stepEl = document.getElementById(`step-${STEP_NAMES[step]}`);
  const first = stepEl && $$('.error-message', stepEl).find(el => el.textContent);
  if (first) first.closest('.form-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function validateCurrentStep() {
  const step = currentRegistrationStep;
  clearStepErrors(step);
  let ok = true;

  if (step === 1) {
    const fullname = $('#artist-fullname').value.trim();
    const location = $('#artist-location').value.trim();
    const phone = $('#artist-phone').value.trim();
    if (fullname.length < 2) { showFieldError('fullname', 'Please enter your full name.'); ok = false; }
    if (location.length < 2) { showFieldError('location', 'Please tell us where you’re based.'); ok = false; }
    if (phone && !/^[+]?[0-9\s\-()]{7,20}$/.test(phone)) { showFieldError('phone', 'That doesn’t look like a phone number.'); ok = false; }
    if (!profilePhotoData) { $('#photo-error').textContent = 'Please add a portrait.'; ok = false; }
  }

  if (step === 2) {
    const words = $('#artist-bio').value.trim().split(/\s+/).filter(Boolean).length;
    if (words < 100) { showFieldError('bio', `Your statement needs at least 100 words (currently ${words}).`); ok = false; }
    if (!$('#artist-style').selectedOptions.length) { showFieldError('style', 'Choose at least one style.'); ok = false; }
    if (!$('#artist-experience').value) { showFieldError('experience', 'Choose how long you’ve been practicing.'); ok = false; }
  }

  if (step === 3) {
    if (!$('#ownership-declaration').checked) { showFieldError('ownership', 'Please confirm you created the work you’ll sell.'); ok = false; }
    if (!$('#identity-consent').checked) { showFieldError('consent', 'Please consent to identity verification.'); ok = false; }
    const website = $('#artist-website').value.trim();
    if (website && !/^https?:\/\//i.test(website)) { $('#artist-website').classList.add('error'); toast('Website links should start with https://', 'error'); ok = false; }
  }

  if (step === 4 && portfolioImages.length === 0) {
    ok = await confirmDialog('You haven’t added any artwork yet. Reviewers may ask you for images before approving. Submit anyway?', { title: 'No portfolio images', confirmLabel: 'Submit without images' });
  }

  if (!ok) focusFirstError(step);
  return ok;
}

// ---------------- PORTRAIT ----------------
async function handleProfilePhotoUpload(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const problem = validateImageFile(file, 5);
  if (problem) { $('#photo-error').textContent = problem; return; }

  try {
    profilePhotoData = await compressImageFile(file, 600, 0.85);
    const preview = $('#profile-photo-preview');
    preview.src = profilePhotoData;
    preview.style.display = 'block';
    $('.photo-placeholder').style.display = 'none';
    $('#profile-photo-area').classList.add('has-photo');
    $('#remove-photo-btn').style.display = 'inline-block';
    $('#photo-error').textContent = '';
  } catch (err) {
    $('#photo-error').textContent = err.message;
  }
}

function removeProfilePhoto() {
  profilePhotoData = null;
  $('#profile-photo-preview').style.display = 'none';
  $('.photo-placeholder').style.display = '';
  $('#profile-photo-area').classList.remove('has-photo');
  $('#remove-photo-btn').style.display = 'none';
}

// ---------------- STYLE CHIPS + WORD COUNT ----------------
function initStyleChips() {
  const select = $('#artist-style');
  const chips = $('#artist-style-chips');
  if (!chips.dataset.bound) {
    chips.dataset.bound = 'true';
    Array.from(select.options).forEach(option => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'style-chip';
      chip.textContent = option.textContent;
      chip.dataset.value = option.value;
      chip.addEventListener('click', () => {
        option.selected = !option.selected;
        chip.setAttribute('aria-pressed', String(option.selected));
        select.classList.remove('error');
        $('#style-error').textContent = '';
      });
      chips.appendChild(chip);
    });
  }
  $$('.style-chip', chips).forEach(chip => {
    chip.setAttribute('aria-pressed', String(!!select.querySelector(`option[value="${chip.dataset.value}"]`)?.selected));
  });
}

function initBioWordCount() {
  const bio = $('#artist-bio');
  const counter = $('#bio-word-count');
  const update = () => {
    const words = bio.value.trim().split(/\s+/).filter(Boolean).length;
    counter.textContent = `${words} / 100 words`;
    counter.classList.toggle('met', words >= 100);
  };
  if (!bio.dataset.bound) { bio.dataset.bound = 'true'; bio.addEventListener('input', update); }
  update();
}

// ---------------- PORTFOLIO ----------------
function initPortfolioUpload() {
  const input = $('#portfolio-file-input');
  const grid = $('#portfolio-grid');
  if (input.dataset.bound) return;
  input.dataset.bound = 'true';

  input.addEventListener('change', () => { addPortfolioFiles(Array.from(input.files)); input.value = ''; });
  grid.addEventListener('dragover', e => { e.preventDefault(); grid.classList.add('drag-over'); });
  grid.addEventListener('dragleave', () => grid.classList.remove('drag-over'));
  grid.addEventListener('drop', e => { e.preventDefault(); grid.classList.remove('drag-over'); addPortfolioFiles(Array.from(e.dataTransfer.files)); });
}

async function addPortfolioFiles(files) {
  for (const file of files) {
    if (portfolioImages.length >= MAX_PORTFOLIO) { toast(`You can add up to ${MAX_PORTFOLIO} images.`, 'error'); break; }
    const problem = validateImageFile(file);
    if (problem) { toast(`${file.name}: ${problem}`, 'error'); continue; }
    try {
      const data = await compressImageFile(file, 1600, 0.85);
      portfolioImages.push(data);
      renderPortfolioGrid();
    } catch (err) {
      toast(`${file.name}: ${err.message}`, 'error');
    }
  }
}

function renderPortfolioGrid() {
  const grid = $('#portfolio-grid');
  grid.replaceChildren(...portfolioImages.map((src, index) => {
    const item = document.createElement('div');
    item.className = 'portfolio-item';
    item.innerHTML = `<img src="${src}" alt="Portfolio image ${index + 1}" /><button type="button" class="remove-image-btn" aria-label="Remove image">×</button>`;
    $('button', item).addEventListener('click', () => { portfolioImages.splice(index, 1); renderPortfolioGrid(); });
    return item;
  }));
}

// ---------------- SUBMIT APPLICATION ----------------
async function submitArtistRegistration(button) {
  if (!(await validateCurrentStep())) return;
  setBusy(button, true, 'Submitting…');
  try {
    const data = await api('POST', '/api/artists/apply', {
      fullName: $('#artist-fullname').value.trim(),
      phone: $('#artist-phone').value.trim(),
      location: $('#artist-location').value.trim(),
      profilePhoto: profilePhotoData,
      bio: $('#artist-bio').value.trim(),
      artisticStyle: Array.from($('#artist-style').selectedOptions).map(o => o.value),
      yearsExperience: $('#artist-experience').value,
      education: $('#artist-education').value.trim(),
      awards: $('#artist-awards').value.trim(),
      exhibitions: $('#artist-exhibitions').value.trim(),
      website: $('#artist-website').value.trim(),
      instagram: $('#artist-instagram').value.trim(),
      socialMedia: $('#artist-social').value.trim(),
      ownershipDeclaration: $('#ownership-declaration').checked,
      identityConsent: $('#identity-consent').checked,
      portfolioImages,
    });
    session.artist = data.artist;
    $('#artist-registration-form').hidden = true;
    $('#artist-success').hidden = false;
    $('#artist-registration-form').dataset.started = '';
    profilePhotoData = null;
    portfolioImages = [];
  } catch (err) {
    toast(err.message, 'error', 8000);
  } finally {
    setBusy(button, false);
  }
}

// ---------------- LIST ARTWORK (/submit) ----------------
function renderSubmitGate() {
  const gate = $('#submit-gate');
  const form = $('#auction-form');
  const show = html => { gate.innerHTML = html; gate.hidden = false; form.hidden = true; };

  if (!session.user) {
    return show(`<h3>Sign in to list artwork</h3><p>Only approved artists can create auctions on SurrealBid.</p>
      <div class="apply-gate-actions"><button type="button" class="btn apply-next" onclick="openAuthDialog('signin', { reason: 'List artwork' })">Sign in <b aria-hidden="true">→</b></button>
      <button type="button" class="apply-text-btn" onclick="navigateTo('/artist-register')">Apply as an artist</button></div>`);
  }
  if (!session.user.emailVerified) {
    return show(`<h3>Confirm your email first</h3><p>We sent a link to ${esc(session.user.email)}.</p>
      <div class="apply-gate-actions"><button type="button" class="btn apply-next" onclick="resendVerification(this)">Resend the link <b aria-hidden="true">↻</b></button></div>`);
  }
  const status = session.artist?.status;
  if (status !== 'approved') {
    const copy = {
      pending: ['Your application is under review', 'You can list artwork as soon as we approve it. We’ll email you.'],
      rejected: ['Your application wasn’t approved', 'Update your application and apply again to start selling.'],
    }[status] || ['Apply as an artist first', 'Every artist on SurrealBid is reviewed before their first auction.'];
    return show(`<h3>${copy[0]}</h3><p>${copy[1]}</p>
      <div class="apply-gate-actions"><button type="button" class="btn apply-next" onclick="navigateTo('${status === 'pending' ? '/dashboard' : '/artist-register'}')">${status === 'pending' ? 'Go to your dashboard' : 'Open the application'} <b aria-hidden="true">→</b></button></div>`);
  }

  gate.hidden = true;
  form.hidden = false;
  $('#submit-artist-name').textContent = session.artist.fullName;
  return null;
}

onPage('/submit', () => {
  renderSubmitGate();
  const form = $('#auction-form');
  if (form.dataset.bound) return;
  form.dataset.bound = 'true';
  form.addEventListener('submit', submitAuction);
  $$('input, textarea', form).forEach(field => field.addEventListener('input', () => {
    field.classList.remove('error');
    const err = document.getElementById(`${field.id}-error`);
    if (err) err.textContent = '';
  }));
});

function auctionFieldError(id, message) {
  document.getElementById(id)?.classList.add('error');
  const err = document.getElementById(`${id}-error`);
  if (err) err.textContent = message;
}

async function submitAuction(event) {
  event.preventDefault();
  const form = event.currentTarget;
  $$('.error-message', form).forEach(el => { el.textContent = ''; });

  const title = $('#title').value.trim();
  const description = $('#description').value.trim();
  const imageUrl = $('#imageUrl').value.trim();
  const file = $('#imageFile').files[0];
  const startingBidINR = Math.floor(Number($('#startBid').value));
  const durationMinutes = Math.floor(Number($('#durationMinutes').value));
  const startRaw = $('#auctionStartDate').value;
  const startTime = startRaw ? new Date(startRaw).getTime() : null;

  let ok = true;
  if (title.length < 3 || title.length > 100) { auctionFieldError('title', 'Title must be 3–100 characters.'); ok = false; }
  if (!startingBidINR || startingBidINR < 100 || startingBidINR > 10000000) { auctionFieldError('startBid', 'Starting bid must be between ₹100 and ₹1,00,00,000.'); ok = false; }
  if (!durationMinutes || durationMinutes < 1 || durationMinutes > 20160) { auctionFieldError('durationMinutes', 'Length must be between 1 minute and 14 days (20160 minutes).'); ok = false; }
  if (startRaw && (Number.isNaN(startTime) || startTime < Date.now() - 60000)) { auctionFieldError('auctionStartDate', 'Choose a time in the future, or leave it empty to start now.'); ok = false; }
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) { auctionFieldError('imageUrl', 'Image links should start with https://'); ok = false; }
  if (file) { const problem = validateImageFile(file); if (problem) { auctionFieldError('imageUrl', problem); ok = false; } }
  if (!ok) return;

  if (!file && !imageUrl) {
    const proceed = await confirmDialog('Collectors are far more likely to bid on work they can see. List without an image?', { title: 'No image added', confirmLabel: 'List without image' });
    if (!proceed) return;
  }

  const button = $('button[type="submit"]', form);
  setBusy(button, true, 'Listing…');
  try {
    const imageData = file ? await compressImageFile(file, 2000, 0.88) : undefined;
    const data = await api('POST', '/api/auctions', { title, description, imageUrl: file ? undefined : imageUrl, imageData, startingBidINR, durationMinutes, startTime: startTime || undefined });
    form.reset();
    toast(`“${data.auction.title}” is listed.`, 'success', 6000);
    navigateTo('/dashboard');
  } catch (err) {
    toast(err.message, 'error', 8000);
  } finally {
    setBusy(button, false);
  }
}
