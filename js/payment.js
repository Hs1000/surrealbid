// Payment handler for Razorpay integration
// Security: Input validation, sanitization, and XSS prevention

const EXCHANGE_RATE_CACHE_KEY = "surrealbid_exchange_rate";
const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_INR_PER_USD = 83; // Fallback rate if API fails

// Live exchange rate fetching (same as script.js)
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

// Initialize exchange rate
let currentExchangeRate = DEFAULT_INR_PER_USD;
getLiveExchangeRate().then(rate => {
  if (rate && rate > 70 && rate < 100) {
    currentExchangeRate = rate;
    console.log('Payment page - Exchange rate loaded:', rate, 'INR per USD');
    // Update displayed price if on checkout page
    updateCheckoutPrice();
  } else {
    console.warn('Invalid exchange rate, using default:', rate);
  }
});

function convertINRtoUSD(inr) {
  if (!currentExchangeRate || currentExchangeRate <= 0 || currentExchangeRate < 70 || currentExchangeRate > 100) {
    console.warn('Invalid exchange rate, using default for conversion. Current rate:', currentExchangeRate);
    return inr / DEFAULT_INR_PER_USD;
  }
  return inr / currentExchangeRate;
}

// Security: Sanitize and validate inputs
function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhone(phone) {
  // Allow international format: +91 9876543210 or 9876543210
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validateAmount(amount) {
  // Amount must be positive, reasonable max (10 crore INR = 100000000)
  const num = Number(amount);
  return !isNaN(num) && num > 0 && num <= 100000000 && Number.isInteger(num);
}

// Get and validate auction details from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const auctionId = sanitizeString(urlParams.get('id') || '', 100);
const title = sanitizeString(urlParams.get('title') || 'Artwork', 100);
const artist = sanitizeString(urlParams.get('artist') || 'Unknown Artist', 100);
const amountINR = Number(urlParams.get('amount')) || 0;

// Validate amount from URL
if (!validateAmount(amountINR)) {
  console.error('Invalid amount in URL parameters');
}

// Display checkout summary with XSS prevention
(function displayCheckoutSummary() {
  const summaryDiv = document.getElementById('checkout-details');
  if (!summaryDiv) return;

  if (!validateAmount(amountINR) || amountINR <= 0) {
    summaryDiv.innerHTML = `
      <div class="checkout-error">
        <p>Invalid auction details. Please go back and select an artwork.</p>
        <a href="auctions.html" class="btn" style="display: inline-block; margin-top: 12px;">Back to Auctions</a>
      </div>
    `;
    return;
  }

  // Use async function to get live rate, then display
  getLiveExchangeRate().then(rate => {
    currentExchangeRate = rate;
    const usd = convertINRtoUSD(amountINR);
    const safeTitle = sanitizeHTML(title);
    const safeArtist = sanitizeHTML(artist);
    const safeAmount = amountINR.toLocaleString('en-IN');
    const safeUsd = usd.toFixed(0);
    
    // Use textContent and createElement to prevent XSS
    summaryDiv.innerHTML = '';
    const itemDiv = document.createElement('div');
    itemDiv.className = 'checkout-item';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = safeTitle;
    
    const artistEl = document.createElement('p');
    artistEl.className = 'checkout-artist';
    artistEl.textContent = `by ${safeArtist}`;
    
    const priceEl = document.createElement('p');
    priceEl.className = 'checkout-price';
    const usdValue = parseFloat(safeUsd);
    priceEl.textContent = `₹${safeAmount} (≈ $${usdValue.toFixed(2)})`;
    
    itemDiv.appendChild(titleEl);
    itemDiv.appendChild(artistEl);
    itemDiv.appendChild(priceEl);
    summaryDiv.appendChild(itemDiv);
  });
})();

function updateCheckoutPrice() {
  const summaryDiv = document.getElementById('checkout-details');
  if (!summaryDiv || amountINR <= 0) return;
  
  const usd = convertINRtoUSD(amountINR);
  const priceEl = summaryDiv.querySelector('.checkout-price');
  if (priceEl) {
    const safeAmount = amountINR.toLocaleString('en-IN');
    priceEl.textContent = `₹${safeAmount} (≈ $${usd.toFixed(0)})`;
  }
}

// Handle checkout form submission with security validation
(function handleCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  // Prevent double submission
  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      console.warn('Form submission already in progress');
      return;
    }

    // Get and sanitize form inputs
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');

    if (!nameInput || !emailInput || !phoneInput || !addressInput) {
      alert('Error: Form fields not found. Please refresh the page.');
      return;
    }

    const name = sanitizeString(nameInput.value, 100);
    const email = sanitizeString(emailInput.value, 254).toLowerCase();
    const phone = sanitizeString(phoneInput.value, 20);
    const address = sanitizeString(addressInput.value, 500);

    // Validate all fields
    if (!name || name.length < 2) {
      alert('Please enter a valid name (at least 2 characters)');
      nameInput.focus();
      return;
    }

    if (!validateEmail(email)) {
      alert('Please enter a valid email address');
      emailInput.focus();
      return;
    }

    if (!validatePhone(phone)) {
      alert('Please enter a valid phone number (10-15 digits)');
      phoneInput.focus();
      return;
    }

    if (!address || address.length < 10) {
      alert('Please enter a complete shipping address (at least 10 characters)');
      addressInput.focus();
      return;
    }

    // Validate amount again (prevent URL manipulation)
    if (!validateAmount(amountINR)) {
      alert('Invalid payment amount. Please go back and select an artwork.');
      window.location.href = 'auctions.html';
      return;
    }

    // Security: Validate amount is reasonable (min 100 INR, max 1 crore)
    if (amountINR < 100 || amountINR > 10000000) {
      alert('Payment amount is outside acceptable range. Please contact support.');
      return;
    }

    isSubmitting = true;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }

    // Razorpay Key ID (from dashboard)
    // Note: In production, consider loading this from environment variables or config
    const RAZORPAY_KEY_ID = 'rzp_live_SFyHCF25DNR8hm';

    // Security: Validate Razorpay key format
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_ID.startsWith('rzp_')) {
      console.error('Invalid Razorpay Key ID format');
      alert('Payment gateway configuration error. Please contact support.');
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Proceed to Payment';
      }
      return;
    }

    // Calculate amount in paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.floor(amountINR * 100);
    
    // Security: Validate calculated amount
    if (amountInPaise <= 0 || amountInPaise > 1000000000) {
      alert('Invalid payment amount calculated. Please try again.');
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Proceed to Payment';
      }
      return;
    }

    // Razorpay options with sanitized data
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
      name: 'SurrealBid',
      description: `Purchase: ${sanitizeString(title, 100)} by ${sanitizeString(artist, 100)}`,
      image: '', // Add your logo URL here if you have one
      order_id: null, // SECURITY NOTE: In production, create order via backend API first
      handler: function(response) {
        // Security: Validate payment response
        if (!response || !response.razorpay_payment_id || !response.razorpay_order_id) {
          console.error('Invalid payment response from Razorpay');
          alert('Payment verification failed. Please contact support with your payment details.');
          isSubmitting = false;
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Proceed to Payment';
          }
          return;
        }

        // Security: Sanitize response data before passing to URL
        const safePaymentId = sanitizeString(response.razorpay_payment_id, 100);
        const safeOrderId = sanitizeString(response.razorpay_order_id, 100);
        const safeSignature = sanitizeString(response.razorpay_signature || '', 200);
        
        // SECURITY NOTE: In production, verify signature on backend before showing success
        const params = new URLSearchParams({
          success: 'true',
          payment_id: safePaymentId,
          order_id: safeOrderId,
          signature: safeSignature,
          auction_id: auctionId,
          amount: amountINR.toString()
        });
        
        // Redirect to success page
        window.location.href = `payment-success.html?${params.toString()}`;
      },
      prefill: {
        name: name,
        email: email,
        contact: phone.replace(/\s/g, '') // Remove spaces from phone
      },
      notes: {
        address: address,
        auction_id: auctionId,
        artwork_title: title,
        artist: artist
      },
      theme: {
        color: '#ff5ec8'
      },
      modal: {
        ondismiss: function() {
          // User closed the payment modal
          console.log('Payment cancelled by user');
          isSubmitting = false;
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Proceed to Payment';
          }
        }
      }
    };

    try {
      // Security: Check if Razorpay is loaded
      if (typeof Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded');
      }

      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
      alert('Error initializing payment gateway. Please refresh the page and try again.');
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Proceed to Payment';
      }
    }
  });
})();
