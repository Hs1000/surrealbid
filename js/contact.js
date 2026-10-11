// ======================================================
// Contact form (/contact): saved on the server and emailed to the team.
// ======================================================

onPage('/contact', () => {
  const form = $('#contact-form');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = 'true';

  if (session.user) {
    $('#contact-name').value ||= session.user.name;
    $('#contact-email').value ||= session.user.email;
  }

  form.addEventListener('input', e => validateContactField(e.target));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields = ['contact-name', 'contact-email', 'contact-subject', 'contact-message'].map(id => document.getElementById(id));
    if (!fields.map(validateContactField).every(Boolean)) return;

    const button = $('#contact-submit');
    setBusy(button, true, 'Sending…');
    try {
      await api('POST', '/api/contact', {
        name: $('#contact-name').value.trim(),
        email: $('#contact-email').value.trim(),
        subject: $('#contact-subject').value,
        message: $('#contact-message').value.trim(),
      });
      form.style.display = 'none';
      $('#contact-success').style.display = 'block';
    } catch (err) {
      toast(err.message, 'error', 7000);
    } finally {
      setBusy(button, false);
    }
  });
});

function validateContactField(field) {
  const errorEl = document.getElementById(`${field.id}-error`);
  if (!errorEl) return true;
  const value = field.value.trim();
  let message = '';
  if (field.required && !value) message = 'This field is required.';
  else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Please enter a valid email address.';
  else if (field.id === 'contact-message' && value.length < 10) message = 'Please write a little more (at least 10 characters).';
  field.classList.toggle('error', !!message);
  errorEl.textContent = message;
  return !message;
}

function resetContactForm() {
  const form = $('#contact-form');
  form.reset();
  form.style.display = 'block';
  $$('.error-message', form).forEach(el => { el.textContent = ''; });
  $('#contact-success').style.display = 'none';
}
