// console.log("SurrealBid top-tier UI loaded.");

// const STORAGE_KEY = "surrealbid_auctions";
// const BIDS_STORAGE_KEY = "surrealbid_bids";
// const EXCHANGE_RATE_CACHE_KEY = "surrealbid_exchange_rate";
// const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
// const DEFAULT_INR_PER_USD = 83; // Fallback rate if API fails

// // Shared storage configuration
// // Using JSONBin.io for shared auction storage
// const SHARED_STORAGE_API = 'https://api.jsonbin.io/v3/b';
// const SHARED_STORAGE_BIN_ID = '699063ae43b1c97be97e71d0';
// const SHARED_STORAGE_API_KEY = '$2a$10$dwfI5DnmcSV.xrlrteOKBOW0qrUqwdylnR4Zz.AsmSbD9RAJM7yG6';
// const USE_SHARED_STORAGE = true; // Enabled - auctions are now shared across all users!

// // Clear cached exchange rate (useful for debugging)
// function clearExchangeRateCache() {
//   try {
//     localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
//     console.log('Exchange rate cache cleared');
//   } catch (e) {
//     console.warn('Error clearing cache:', e);
//   }
// }

// // Live exchange rate fetching
// async function getLiveExchangeRate() {
//   // Check cache first
//   try {
//     const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
//     if (cached) {
//       const { rate, timestamp } = JSON.parse(cached);
//       const now = Date.now();
//       if (now - timestamp < EXCHANGE_RATE_CACHE_DURATION) {
//         return rate;
//       }
//     }
//   } catch (e) {
//     console.warn('Error reading cached exchange rate:', e);
//   }

//   // Fetch live rate from API
//   try {
//     // Using exchangerate-api.com free endpoint (no API key required)
//     // This returns: { base: "USD", rates: { INR: 83.5, ... } }
//     const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
//     if (!response.ok) throw new Error('API response not ok');
    
//     const data = await response.json();
//     const inrPerUsd = data.rates?.INR;
    
//     // Validate the rate is reasonable (should be between 70-100 INR per USD)
//     if (inrPerUsd && inrPerUsd > 70 && inrPerUsd < 100) {
//       console.log('Live exchange rate fetched:', inrPerUsd, 'INR per USD');
//       // Cache the rate
//       try {
//         localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
//           rate: inrPerUsd,
//           timestamp: Date.now()
//         }));
//       } catch (e) {
//         console.warn('Error caching exchange rate:', e);
//       }
//       return inrPerUsd;
//     } else {
//       console.warn('Invalid exchange rate received:', inrPerUsd);
//     }
//   } catch (error) {
//     console.warn('Error fetching live exchange rate:', error);
//   }

//   // Fallback to cached rate even if expired, but validate it
//   try {
//     const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
//     if (cached) {
//       const { rate } = JSON.parse(cached);
//       // Only use cached rate if it's reasonable
//       if (rate > 70 && rate < 100) {
//         console.log('Using cached exchange rate:', rate);
//         return rate;
//       } else {
//         console.warn('Cached rate is invalid, clearing cache:', rate);
//         localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
//       }
//     }
//   } catch (e) {
//     // ignore
//   }

//   console.log('Using default exchange rate:', DEFAULT_INR_PER_USD);
//   return DEFAULT_INR_PER_USD;
// }

// // Get exchange rate (async wrapper)
// let exchangeRatePromise = null;
// function getExchangeRate() {
//   if (!exchangeRatePromise) {
//     exchangeRatePromise = getLiveExchangeRate();
//     // Reset promise after 5 minutes to allow refresh
//     setTimeout(() => {
//       exchangeRatePromise = null;
//     }, 5 * 60 * 1000);
//   }
//   return exchangeRatePromise;
// }

// // Helper function to convert INR to USD using current rate
// function convertINRtoUSD(inr) {
//   // Strict validation: rate must be between 70 and 100 (exclusive of 100)
//   if (!currentExchangeRate || currentExchangeRate <= 70 || currentExchangeRate >= 100) {
//     console.warn('Invalid exchange rate, using default for conversion. Current rate:', currentExchangeRate);
//     const defaultUsd = inr / DEFAULT_INR_PER_USD;
//     console.log(`Converted ₹${inr} using default rate (${DEFAULT_INR_PER_USD}): $${defaultUsd.toFixed(2)}`);
//     return defaultUsd;
//   }
//   const usd = inr / currentExchangeRate;
//   console.log(`Converted ₹${inr} using rate (${currentExchangeRate}): $${usd.toFixed(2)}`);
//   return usd;
// }

// // Clear invalid cached rates on page load
// (function clearInvalidCache() {
//   try {
//     const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
//     if (cached) {
//       const { rate } = JSON.parse(cached);
//       // If cached rate is invalid (like 100), clear it immediately
//       // Valid range: 70 < rate < 100 (exclusive)
//       if (!rate || rate <= 70 || rate >= 100) {
//         console.log('Clearing invalid cached exchange rate:', rate);
//         localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
//       } else {
//         console.log('Valid cached exchange rate found:', rate);
//       }
//     }
//   } catch (e) {
//     console.warn('Error checking cache:', e);
//   }
// })();

// // Initialize exchange rate on page load
// let currentExchangeRate = DEFAULT_INR_PER_USD;
// getExchangeRate().then(rate => {
//   if (rate && rate > 70 && rate < 100) {
//     currentExchangeRate = rate;
//     console.log('Exchange rate loaded:', rate, 'INR per USD');
//     // Update displayed prices if on auctions page
//     if (document.querySelector('.auctions-grid')) {
//       updateAllPrices().catch(console.error);
//     }
//   } else {
//     console.warn('Invalid exchange rate, using default:', rate);
//     // Force clear cache if rate is invalid
//     if (rate) {
//       try {
//         localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
//       } catch (e) {}
//     }
//   }
// });

// // Function to update all price displays with current exchange rate
// async function updateAllPrices() {
//   const auctions = await loadStoredAuctions();
//   document.querySelectorAll('[data-price-element="true"]').forEach(priceSpan => {
//     const auctionId = priceSpan.dataset.auctionId;
//     const highestBid = getHighestBid(auctionId);
//     if (highestBid) {
//       const usd = convertINRtoUSD(highestBid.amount);
//       priceSpan.textContent = `₹${highestBid.amount.toLocaleString('en-IN')} (≈ $${usd.toFixed(2)})`;
//     } else {
//       // Get auction data to show starting bid
//       const auction = auctions.find(a => String(a.id) === auctionId);
//       if (auction) {
//         const bidAmount = auction.currentBidINR || 0;
//         const usd = convertINRtoUSD(bidAmount);
//         priceSpan.textContent = `₹${bidAmount.toLocaleString('en-IN')} (≈ $${usd.toFixed(2)})`;
//       }
//     }
//   });
// }

// // Load auctions from shared storage or localStorage
// async function loadStoredAuctions() {
//   // Get local auctions first (might have unsynced items)
//   let localAuctions = [];
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (raw) {
//       const parsed = JSON.parse(raw);
//       if (Array.isArray(parsed)) {
//         localAuctions = parsed;
//       }
//     }
//   } catch (e) {
//     console.warn('Failed to parse local storage:', e);
//   }
  
//   // Try shared storage (source of truth for shared auctions)
//   if (USE_SHARED_STORAGE && SHARED_STORAGE_BIN_ID) {
//     try {
//       console.log('Attempting to load from shared storage...');
//       const startTime = Date.now();
      
//       // Add timeout to prevent hanging (increased to 15 seconds)
//       const timeoutPromise = new Promise((_, reject) => 
//         setTimeout(() => {
//           const elapsed = Date.now() - startTime;
//           reject(new Error(`Load timeout after ${elapsed}ms`));
//         }, 15000)
//       );
      
//       const fetchPromise = fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}/latest`, {
//         headers: {
//           'X-Master-Key': SHARED_STORAGE_API_KEY,
//           'X-Bin-Meta': 'false'
//         }
//       }).catch(fetchError => {
//         console.error('Fetch error details:', fetchError);
//         throw new Error(`Network error: ${fetchError.message}`);
//       });
      
//       const response = await Promise.race([fetchPromise, timeoutPromise]);
//       const elapsed = Date.now() - startTime;
//       console.log(`API response received in ${elapsed}ms, status: ${response.status}`);
      
//       if (response.ok) {
//         const data = await response.json();
//         console.log('API response data:', data);
        
//         // Handle both formats: { auctions: [...] } or direct array
//         let remoteAuctions = [];
//         if (data.record) {
//           // JSONBin.io v3 format: { record: { auctions: [...] } }
//           remoteAuctions = Array.isArray(data.record) ? data.record : (data.record.auctions || []);
//         } else if (data.auctions) {
//           // Direct format: { auctions: [...] }
//           remoteAuctions = Array.isArray(data.auctions) ? data.auctions : [];
//         } else if (Array.isArray(data)) {
//           // Direct array format: [...]
//           remoteAuctions = data;
//         }
        
//         if (Array.isArray(remoteAuctions)) {
//           // Merge: remote is source of truth, but preserve local imageDataUrl if missing in remote
//           const remoteIds = new Set(remoteAuctions.map(a => a.id));
//           const localOnly = localAuctions.filter(a => !remoteIds.has(a.id));
          
//           // Merge remote auctions with local imageDataUrl preserved
//           const merged = remoteAuctions.map(remoteAuction => {
//             const localAuction = localAuctions.find(a => a.id === remoteAuction.id);
//             if (localAuction) {
//               // Merge: use remote as base, but preserve local imageDataUrl
//               const mergedAuction = { 
//                 ...remoteAuction, 
//                 imageDataUrl: localAuction.imageDataUrl || remoteAuction.imageDataUrl 
//               };
//               // Remove empty imageUrl if we have imageDataUrl or if it's empty
//               if (mergedAuction.imageDataUrl) {
//                 // Prefer imageDataUrl, remove empty imageUrl
//                 if (!mergedAuction.imageUrl || mergedAuction.imageUrl.trim().length === 0) {
//                   delete mergedAuction.imageUrl;
//                 }
//               } else if (mergedAuction.imageUrl && mergedAuction.imageUrl.trim().length === 0) {
//                 // Remove empty imageUrl strings
//                 delete mergedAuction.imageUrl;
//               }
//               return mergedAuction;
//             }
//             // Remove empty imageUrl from remote auctions too
//             const cleanedRemote = { ...remoteAuction };
//             if (cleanedRemote.imageUrl && cleanedRemote.imageUrl.trim().length === 0) {
//               delete cleanedRemote.imageUrl;
//             }
//             return cleanedRemote;
//           });
          
//           // Add local-only auctions (these already have imageDataUrl)
//           merged.push(...localOnly);
          
//           console.log('Merged auctions with imageDataUrl preserved:', merged.map(a => ({
//             id: a.id,
//             hasImageDataUrl: !!a.imageDataUrl,
//             hasImageUrl: !!a.imageUrl
//           })));
          
//           // Cache merged data locally (but preserve full local data with imageDataUrl)
//           try {
//             // Don't overwrite local storage with merged data - keep full local data
//             // The merged data is used for display, but we preserve the original local data
//             // This ensures imageDataUrl is never lost
//             const localData = localStorage.getItem(STORAGE_KEY);
//             if (localData) {
//               try {
//                 const localParsed = JSON.parse(localData);
//                 if (Array.isArray(localParsed)) {
//                   // Update only the remote auctions in local storage, preserve local imageDataUrl
//                   const updatedLocal = localParsed.map(localAuction => {
//                     const remoteAuction = remoteAuctions.find(a => a.id === localAuction.id);
//                     if (remoteAuction) {
//                       // Update from remote but keep local imageDataUrl
//                       return { ...remoteAuction, imageDataUrl: localAuction.imageDataUrl || remoteAuction.imageDataUrl };
//                     }
//                     return localAuction;
//                   });
//                   // Add any new remote auctions
//                   const localIds = new Set(updatedLocal.map(a => a.id));
//                   const newRemote = remoteAuctions.filter(a => !localIds.has(a.id));
//                   updatedLocal.push(...newRemote);
//                   localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocal));
//                 }
//               } catch (e) {
//                 // If parsing fails, just use merged
//                 localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
//               }
//             } else {
//               localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
//             }
//             console.log('✓ Loaded', merged.length, 'auctions (', remoteAuctions.length, 'remote +', localOnly.length, 'local)');
//           } catch (e) {
//             console.warn('Failed to cache to localStorage:', e);
//           }
//           return merged;
//         } else {
//           console.warn('API returned invalid data format:', data);
//         }
//       } else {
//         const errorText = await response.text().catch(() => 'Unable to read error');
//         console.error(`API returned error status ${response.status}:`, errorText);
//         throw new Error(`API error ${response.status}: ${errorText.substring(0, 100)}`);
//       }
//     } catch (error) {
//       console.warn('Failed to load from shared storage, using local only:', error.message);
//       console.warn('Error details:', error);
//     }
//   }
  
//   // Return local auctions (fallback)
//   if (localAuctions.length > 0) {
//     console.log('Loaded', localAuctions.length, 'auctions from localStorage (fallback)');
//   }
//   return localAuctions;
// }

// // Helper function to prepare auctions for shared storage (remove large imageDataUrl)
// function prepareAuctionsForSync(auctions) {
//   return auctions.map(auction => {
//     const { imageDataUrl, ...auctionWithoutImageData } = auction;
//     // Keep imageUrl, but remove imageDataUrl (base64 data is too large for API)
//     return auctionWithoutImageData;
//   });
// }

// // Save auctions to shared storage and localStorage
// async function saveStoredAuctions(list) {
//   // Always save to localStorage first (for offline access and immediate availability)
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
//     console.log('Saved to localStorage');
//   } catch (error) {
//     console.error('Failed to save to localStorage:', error);
//     throw error; // This is critical, so throw if it fails
//   }
  
//   // Try to save to shared storage if enabled (non-blocking)
//   if (USE_SHARED_STORAGE && SHARED_STORAGE_BIN_ID) {
//     try {
//       // Remove imageDataUrl before syncing (too large for API, keep only imageUrl)
//       const auctionsForSync = prepareAuctionsForSync(list);
//       const payload = { auctions: auctionsForSync, updatedAt: Date.now() };
//       const payloadSize = JSON.stringify(payload).length;
//       const payloadSizeKB = (payloadSize / 1024).toFixed(2);
//       console.log(`Syncing ${auctionsForSync.length} auctions (payload: ${payloadSizeKB}KB)...`);
      
//       // Create a timeout promise (10 seconds)
//       const timeoutPromise = new Promise((_, reject) => 
//         setTimeout(() => reject(new Error('API request timeout')), 10000)
//       );
      
//       // Race between fetch and timeout
//       const fetchPromise = fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'X-Master-Key': SHARED_STORAGE_API_KEY
//         },
//         body: JSON.stringify(payload)
//       });
      
//       const response = await Promise.race([fetchPromise, timeoutPromise]);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.warn('Failed to save to shared storage. Status:', response.status, 'Error:', errorText);
//         // Don't throw - localStorage is saved, that's good enough
//       } else {
//         console.log('Successfully saved to shared storage');
//       }
//     } catch (error) {
//       console.warn('Failed to save to shared storage (network/API error):', error.message);
//       // Continue anyway - at least localStorage is saved
//       // Don't throw - we want to continue even if API fails
//     }
//   }
// }

// // Bidding system functions
// function loadBids() {
//   try {
//     const raw = localStorage.getItem(BIDS_STORAGE_KEY);
//     if (!raw) return {};
//     const parsed = JSON.parse(raw);
//     return typeof parsed === 'object' ? parsed : {};
//   } catch {
//     return {};
//   }
// }

// function saveBids(bids) {
//   try {
//     localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(bids));
//   } catch {
//     // ignore
//   }
// }

// function getHighestBid(auctionId) {
//   const bids = loadBids();
//   const auctionBids = bids[auctionId] || [];
//   if (auctionBids.length === 0) return null;
//   return auctionBids.reduce((highest, bid) => 
//     bid.amount > highest.amount ? bid : highest, auctionBids[0]
//   );
// }

// async function addBid(auctionId, amount, bidderName, bidderEmail) {
//   const bids = loadBids();
//   if (!bids[auctionId]) bids[auctionId] = [];
  
//   bids[auctionId].push({
//     id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//     amount: amount,
//     bidderName: bidderName || 'Anonymous',
//     bidderEmail: bidderEmail || '',
//     timestamp: Date.now()
//   });
  
//   saveBids(bids);
  
//   // Update auction's current bid
//   loadStoredAuctions().then(auctions => {
//     const auctionIndex = auctions.findIndex(a => String(a.id) === String(auctionId));
//     if (auctionIndex !== -1) {
//       auctions[auctionIndex].currentBidINR = amount;
//       saveStoredAuctions(auctions).catch(err => console.warn('Failed to save bid update:', err));
//     }
//   });
  
//   return bids[auctionId];
// }

// // Handle submit-auction.html form
// // Wait for DOM to be ready before initializing form handler
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', handleAuctionForm);
// } else {
//   handleAuctionForm();
// }

// function handleAuctionForm() {
//   const form = document.getElementById("auction-form");
//   if (!form) {
//     console.log('Form not found - this page may not have the auction form');
//     return;
//   }

//   console.log('Auction form handler initialized');

//   form.addEventListener("submit", async (event) => {
//     event.preventDefault();
//     console.log('Form submitted');

//     // Disable submit button to prevent double submission
//     const submitButton = form.querySelector('button[type="submit"]');
//     if (submitButton) {
//       submitButton.disabled = true;
//       submitButton.textContent = 'Creating...';
//     }

//     try {
//       const title = /** @type {HTMLInputElement} */ (document.getElementById("title"))?.value.trim();
//       const artist = /** @type {HTMLInputElement} */ (document.getElementById("artist"))?.value.trim();
//       const imageUrlRaw = /** @type {HTMLInputElement} */ (document.getElementById("imageUrl"))?.value.trim();
//       const imageUrl = imageUrlRaw && imageUrlRaw.length > 0 ? imageUrlRaw : undefined;
//       const imageFileInput = /** @type {HTMLInputElement} */ (document.getElementById("imageFile"));
//       const startBidRaw = /** @type {HTMLInputElement} */ (document.getElementById("startBid"))?.value;
//       const durationRaw = /** @type {HTMLInputElement} */ (document.getElementById("durationMinutes"))?.value;

//       console.log('Form values:', { title, artist, startBidRaw, durationRaw });

//       // Validate required fields
//       if (!title || !artist) {
//         alert('Please fill in title and artist name');
//         if (submitButton) {
//           submitButton.disabled = false;
//           submitButton.textContent = 'Create auction';
//         }
//         return;
//       }

//       const startBidINR = Math.max(0, Math.floor(Number(startBidRaw || "0") || 0));
//       const durationMinutes = Math.max(1, Number(durationRaw || "0") || 0);

//       if (startBidINR <= 0) {
//         alert('Please enter a valid starting bid');
//         if (submitButton) {
//           submitButton.disabled = false;
//           submitButton.textContent = 'Create auction';
//         }
//         return;
//       }

//       const now = Date.now();
//       const endTime = now + durationMinutes * 60 * 1000;

//       console.log('Loading auctions...');
//       // For form submission, load from localStorage first (fast, reliable)
//       // Then merge with remote data if available
//       let auctions = [];
//       try {
//         // Get from localStorage first
//         const raw = localStorage.getItem(STORAGE_KEY);
//         if (raw) {
//           const parsed = JSON.parse(raw);
//           if (Array.isArray(parsed)) {
//             auctions = parsed;
//             console.log('Loaded', auctions.length, 'auctions from localStorage');
//           }
//         }
        
//         // Try to get latest from shared storage (non-blocking, merge if available)
//         if (USE_SHARED_STORAGE && SHARED_STORAGE_BIN_ID) {
//           try {
//             const timeoutPromise = new Promise((_, reject) => 
//               setTimeout(() => reject(new Error('Load timeout')), 5000)
//             );
//             const fetchPromise = fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}/latest`, {
//               headers: {
//                 'X-Master-Key': SHARED_STORAGE_API_KEY,
//                 'X-Bin-Meta': 'false'
//               }
//             });
//             const response = await Promise.race([fetchPromise, timeoutPromise]);
//             if (response.ok) {
//               const data = await response.json();
//               let remoteAuctions = [];
//               if (data.record) {
//                 remoteAuctions = Array.isArray(data.record) ? data.record : (data.record.auctions || []);
//               } else if (Array.isArray(data)) {
//                 remoteAuctions = data;
//               }
//               if (Array.isArray(remoteAuctions) && remoteAuctions.length > 0) {
//                 // Merge: use remote as base, add any local-only items
//                 const remoteIds = new Set(remoteAuctions.map(a => a.id));
//                 const localOnly = auctions.filter(a => !remoteIds.has(a.id));
//                 auctions = [...remoteAuctions, ...localOnly];
//                 console.log('Merged with remote:', auctions.length, 'total auctions');
//               }
//             }
//           } catch (e) {
//             console.warn('Could not fetch remote auctions (continuing with local):', e.message);
//           }
//         }
//       } catch (error) {
//         console.error('Failed to load auctions:', error);
//         auctions = [];
//       }
      
//       console.log('Final auctions array:', auctions.length);

//       const file = imageFileInput?.files && imageFileInput.files[0];

//       // Helper to finalize save + redirect
//       function finishSave(extra) {
//         console.log('Saving auction...');
//         const newAuction = {
//           id: `user-${now}`,
//           title,
//           artist,
//           currentBidINR: startBidINR,
//           endTime,
//           ...extra
//         };
//         // Only add imageUrl if it's not empty (don't save empty strings)
//         if (imageUrl && imageUrl.trim().length > 0) {
//           newAuction.imageUrl = imageUrl.trim();
//         }
//         auctions.push(newAuction);
//         console.log('New auction object:', newAuction);
//         console.log('Total auctions to save:', auctions.length);
        
//         // Save to localStorage immediately (synchronous)
//         try {
//           localStorage.setItem(STORAGE_KEY, JSON.stringify(auctions));
//           console.log('✓ Saved', auctions.length, 'auctions to localStorage');
          
//           // Verify it was saved
//           const verify = localStorage.getItem(STORAGE_KEY);
//           if (verify) {
//             const parsed = JSON.parse(verify);
//             console.log('✓ Verification: localStorage has', parsed.length, 'auctions');
//             console.log('✓ New auction ID:', newAuction.id);
//           } else {
//             throw new Error('Verification failed - localStorage save did not persist');
//           }
//         } catch (error) {
//           console.error('✗ Failed to save to localStorage:', error);
//           alert('Error saving auction. Please try again.');
//           if (submitButton) {
//             submitButton.disabled = false;
//             submitButton.textContent = 'Create auction';
//           }
//           return;
//         }
        
//         // Sync to shared storage BEFORE redirect (but don't wait if it's slow)
//         if (USE_SHARED_STORAGE && SHARED_STORAGE_BIN_ID) {
//           // Remove imageDataUrl before syncing (too large for API, keep only imageUrl)
//           const auctionsForSync = prepareAuctionsForSync(auctions);
//           const payload = { auctions: auctionsForSync, updatedAt: Date.now() };
//           const payloadSize = JSON.stringify(payload).length;
//           const payloadSizeKB = (payloadSize / 1024).toFixed(2);
//           console.log(`Syncing ${auctionsForSync.length} auctions to shared storage (payload: ${payloadSizeKB}KB)...`);
          
//           // Start the sync but don't wait for it
//           const syncPromise = fetch(`${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`, {
//             method: 'PUT',
//             headers: {
//               'Content-Type': 'application/json',
//               'X-Master-Key': SHARED_STORAGE_API_KEY
//             },
//             body: JSON.stringify(payload)
//           }).then(response => {
//             if (response.ok) {
//               console.log('✓ Successfully synced', auctions.length, 'auctions to shared storage');
//             } else {
//               return response.text().then(text => {
//                 console.warn('✗ Failed to sync to shared storage:', response.status, text);
//               });
//             }
//           }).catch(err => {
//             console.warn('✗ Background sync to shared storage failed:', err.message);
//           });
          
//           // Wait max 2 seconds for sync, then redirect anyway
//           Promise.race([
//             syncPromise,
//             new Promise(resolve => setTimeout(resolve, 2000))
//           ]).then(() => {
//             console.log('Redirecting to auctions page...');
//             window.location.href = "auctions.html";
//           });
//         } else {
//           // No shared storage, redirect immediately
//           console.log('Redirecting to auctions page...');
//           window.location.href = "auctions.html";
//         }
//       }

//       if (file) {
//         console.log('Reading image file...');
//         const reader = new FileReader();
//         reader.onload = () => {
//           const dataUrl = typeof reader.result === "string" ? reader.result : "";
//           console.log('Image read, saving...');
//           finishSave({ imageDataUrl: dataUrl });
//         };
//         reader.onerror = () => {
//           console.error('FileReader error');
//           alert('Error reading image file. Please try again.');
//           if (submitButton) {
//             submitButton.disabled = false;
//             submitButton.textContent = 'Create auction';
//           }
//         };
//         reader.readAsDataURL(file);
//       } else {
//         console.log('No file, saving with URL or no image');
//         finishSave({});
//       }
//     } catch (error) {
//       console.error('Unexpected error in form submission:', error);
//       alert('An error occurred: ' + (error.message || 'Unknown error'));
//       if (submitButton) {
//         submitButton.disabled = false;
//         submitButton.textContent = 'Create auction';
//       }
//     }
//   });
// }

// // Render auctions and run countdowns on auctions.html
// (function handleAuctionsPage() {
//   const grid = document.querySelector(".auctions-grid");
//   if (!grid) return;

//   // Load auctions asynchronously
//   loadStoredAuctions().then(stored => {
//     renderAuctions(stored);
    
//     // Poll for new auctions every 10 seconds (if using shared storage)
//     if (USE_SHARED_STORAGE) {
//       let allAuctions = stored;
//       console.log('Polling for new auctions every 10 seconds...');
//       setInterval(async () => {
//         try {
//           const updatedAuctions = await loadStoredAuctions();
//           // Check if auctions changed (new ones added or count changed)
//           const currentIds = new Set(allAuctions.map(a => a.id));
//           const updatedIds = new Set(updatedAuctions.map(a => a.id));
          
//           // Check if there are new auctions
//           const newAuctions = updatedAuctions.filter(a => !currentIds.has(a.id));
          
//           // Also check if count changed (someone might have deleted)
//           if (newAuctions.length > 0 || updatedAuctions.length !== allAuctions.length) {
//             console.log('New auctions detected! Reloading page...', {
//               current: allAuctions.length,
//               updated: updatedAuctions.length,
//               new: newAuctions.length
//             });
//             allAuctions = updatedAuctions;
//             location.reload();
//           }
//         } catch (error) {
//           console.warn('Error polling for new auctions:', error);
//         }
//       }, 10000);
//     }
//   });
// })();

// function renderAuctions(allAuctions) {
//   const grid = document.querySelector(".auctions-grid");
//   if (!grid) return;
  
//   // Clear existing content
//   grid.innerHTML = '';

//   // Show empty state if no auctions
//   if (allAuctions.length === 0) {
//     grid.innerHTML = `
//       <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
//         <h2 style="font-size: 24px; margin-bottom: 12px; opacity: 0.9;">No auctions yet</h2>
//         <p style="opacity: 0.7; margin-bottom: 24px;">Be the first to submit an artwork!</p>
//         <a href="submit-auction.html" class="btn">Submit Artwork</a>
//       </div>
//     `;
//     return;
//   }

//   const nowForButtons = Date.now();
  
//   allAuctions.forEach((auction) => {
//     const card = document.createElement("article");
//     card.className = "auction-card";
//     card.dataset.auctionId = String(auction.id);
//     card.dataset.endTime = String(auction.endTime);

//     const imageDiv = document.createElement("div");
//     imageDiv.className = "auction-image";
    
//     // Debug: log image data for this auction
//     console.log(`Auction ${auction.id} image data:`, {
//       hasImageDataUrl: !!auction.imageDataUrl,
//       hasImageUrl: !!auction.imageUrl,
//       imageDataUrlLength: auction.imageDataUrl ? auction.imageDataUrl.length : 0,
//       imageUrl: auction.imageUrl
//     });
    
//     if ("imageClass" in auction && auction.imageClass) {
//       imageDiv.classList.add("placeholder-image", auction.imageClass);
//     } else if (auction.imageDataUrl && auction.imageDataUrl.length > 0) {
//       imageDiv.style.backgroundImage = `url('${auction.imageDataUrl}')`;
//       console.log(`Set imageDataUrl for auction ${auction.id}`);
//     } else if (auction.imageUrl && auction.imageUrl.length > 0) {
//       imageDiv.style.backgroundImage = `url('${auction.imageUrl}')`;
//       console.log(`Set imageUrl for auction ${auction.id}`);
//     } else {
//       // No image - show placeholder
//       imageDiv.classList.add("placeholder-image");
//       console.warn(`No image data for auction ${auction.id} - showing placeholder`);
//     }

//     const body = document.createElement("div");
//     body.className = "auction-body";

//     const titleEl = document.createElement("h2");
//     titleEl.className = "auction-title";
//     titleEl.textContent = auction.title;

//     const artistEl = document.createElement("p");
//     artistEl.className = "auction-artist";
//     artistEl.textContent = `by ${auction.artist}`;

//     const metaEl = document.createElement("p");
//     metaEl.className = "auction-meta";
//     const priceSpan = document.createElement("span");
//     priceSpan.className = "auction-price";
//     priceSpan.dataset.auctionId = String(auction.id);
//     priceSpan.dataset.priceElement = "true";
    
//     // Get highest bid or use auction's starting bid
//     const highestBid = getHighestBid(auction.id);
//     let currentBidAmount = highestBid ? highestBid.amount : 
//       (typeof auction.currentBidINR === "number" ? auction.currentBidINR : 
//        Number(auction.currentBid || 0) * 240000);
    
//     const usd = convertINRtoUSD(currentBidAmount);
//     priceSpan.textContent = `₹${currentBidAmount.toLocaleString("en-IN")} (≈ $${usd.toFixed(2)})`;
//     metaEl.textContent = "Current bid: ";
//     metaEl.appendChild(priceSpan);
    
//     // Show bid count if there are bids
//     if (highestBid) {
//       const bids = loadBids();
//       const bidCount = (bids[auction.id] || []).length;
//       if (bidCount > 0) {
//         const bidCountEl = document.createElement("p");
//         bidCountEl.className = "auction-bid-count";
//         bidCountEl.textContent = `${bidCount} bid${bidCount !== 1 ? 's' : ''}`;
//         bidCountEl.style.fontSize = "12px";
//         bidCountEl.style.opacity = "0.7";
//         bidCountEl.style.marginTop = "4px";
//         metaEl.appendChild(bidCountEl);
//       }
//     }

//     const timerEl = document.createElement("p");
//     timerEl.className = "auction-timer";
//     timerEl.dataset.countdown = "true";
//     timerEl.textContent = "Loading timer…";

//     const btn = document.createElement("button");
//     btn.className = "auction-btn";
//     const inrForBtn =
//       typeof auction.currentBidINR === "number"
//         ? auction.currentBidINR
//         : Number(auction.currentBid || 0) * 240000;
    
//     // Check if auction has ended
//     const endTime = auction.endTime || 0;
//     const hasEnded = endTime > 0 && nowForButtons > endTime;
    
//     if (hasEnded) {
//       btn.disabled = true;
//       btn.textContent = "Auction ended";
//       btn.style.opacity = "0.5";
//     } else {
//       btn.textContent = "Place Bid";
//       btn.onclick = () => {
//         openBidModal(auction.id, auction.title, auction.artist, currentBidAmount);
//       };
//     }

//     body.appendChild(titleEl);
//     body.appendChild(artistEl);
//     body.appendChild(metaEl);
//     body.appendChild(timerEl);
//     body.appendChild(btn);

//     card.appendChild(imageDiv);
//     card.appendChild(body);

//     grid.appendChild(card);
//   });

//   function formatRemaining(ms) {
//     if (ms <= 0) return "Auction ended";
//     const totalSeconds = Math.floor(ms / 1000);
//     const h = Math.floor(totalSeconds / 3600);
//     const m = Math.floor((totalSeconds % 3600) / 60);
//     const s = totalSeconds % 60;
//     if (h > 0) return `${h}h ${m}m ${s}s left`;
//     if (m > 0) return `${m}m ${s}s left`;
//     return `${s}s left`;
//   }

//   function tick() {
//     const now = Date.now();
//     document.querySelectorAll(".auction-card").forEach((card) => {
//       const endTime = Number(card.dataset.endTime || 0);
//       const display = card.querySelector("[data-countdown]");
//       if (!display || !endTime) return;
//       const remaining = endTime - now;
//       display.textContent = formatRemaining(remaining);
//       if (remaining <= 0) {
//         card.classList.add("auction-ended");
//       }
//     });
//   }

//   tick();
//   setInterval(tick, 1000);
  
//   // Poll for bid updates every 3 seconds
//   setInterval(() => {
//     updateBidPrices();
//   }, 3000);
  
  
//   // Initial price update
//   updateBidPrices();
// }

// // Bidding modal and functions
// function openBidModal(auctionId, title, artist, currentBid) {
//   // Remove existing modal if any
//   const existingModal = document.getElementById('bid-modal');
//   if (existingModal) existingModal.remove();
  
//   const modal = document.createElement('div');
//   modal.id = 'bid-modal';
//   modal.className = 'bid-modal-overlay';
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
//           <p class="bid-current-price">Current bid: ₹${currentBid.toLocaleString('en-IN')}</p>
//         </div>
//         <form id="bid-form" class="bid-form">
//           <div class="form-row">
//             <label for="bidder-name">Your Name</label>
//             <input id="bidder-name" type="text" required minlength="2" maxlength="100" 
//                    placeholder="Enter your name" />
//           </div>
//           <div class="form-row">
//             <label for="bidder-email">Email (optional)</label>
//             <input id="bidder-email" type="email" maxlength="254" 
//                    placeholder="your@email.com" />
//           </div>
//           <div class="form-row">
//             <label for="bid-amount">Your Bid Amount (INR)</label>
//             <input id="bid-amount" type="number" required min="${currentBid + 1}" 
//                    step="1" placeholder="Enter amount" />
//             <p class="form-hint">Minimum bid: ₹${(currentBid + 1).toLocaleString('en-IN')}</p>
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
  
//   // Handle form submission
//   const form = document.getElementById('bid-form');
//   form.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const bidAmount = Math.floor(Number(document.getElementById('bid-amount').value));
//     const bidderName = document.getElementById('bidder-name').value.trim();
//     const bidderEmail = document.getElementById('bidder-email').value.trim();
    
//     if (bidAmount <= currentBid) {
//       alert(`Your bid must be higher than the current bid of ₹${currentBid.toLocaleString('en-IN')}`);
//       return;
//     }
    
//     if (bidAmount < 1) {
//       alert('Please enter a valid bid amount');
//       return;
//     }
    
//     // Add the bid
//     addBid(auctionId, bidAmount, bidderName, bidderEmail).then(() => {
//       // Show success message
//       alert(`Bid placed successfully! Your bid: ₹${bidAmount.toLocaleString('en-IN')}`);
      
//       // Update the price display immediately
//       updateBidPrice(auctionId);
      
//       // Close modal
//       closeBidModal();
//     }).catch(error => {
//       console.error('Error placing bid:', error);
//       alert('Error placing bid. Please try again.');
//     });
//   });
  
//   // Close on overlay click
//   modal.addEventListener('click', (e) => {
//     if (e.target === modal) {
//       closeBidModal();
//     }
//   });
// }

// function closeBidModal() {
//   const modal = document.getElementById('bid-modal');
//   if (modal) modal.remove();
// }

// function updateBidPrice(auctionId) {
//   const highestBid = getHighestBid(auctionId);
//   if (!highestBid) return;
  
//   const priceSpan = document.querySelector(`[data-price-element="true"][data-auction-id="${auctionId}"]`);
//   if (priceSpan) {
//     const usd = convertINRtoUSD(highestBid.amount);
//     priceSpan.textContent = `₹${highestBid.amount.toLocaleString('en-IN')} (≈ $${usd.toFixed(2)})`;
    
//     // Add animation to show price update
//     priceSpan.style.transition = 'all 0.3s ease';
//     priceSpan.style.color = '#4ade80';
//     setTimeout(() => {
//       priceSpan.style.color = '';
//     }, 1000);
//   }
  
//   // Update bid count
//   const bids = loadBids();
//   const bidCount = (bids[auctionId] || []).length;
//   const metaEl = priceSpan?.parentElement;
//   if (metaEl) {
//     let bidCountEl = metaEl.querySelector('.auction-bid-count');
//     if (bidCountEl) {
//       bidCountEl.textContent = `${bidCount} bid${bidCount !== 1 ? 's' : ''}`;
//     } else if (bidCount > 0) {
//       bidCountEl = document.createElement("p");
//       bidCountEl.className = "auction-bid-count";
//       bidCountEl.textContent = `${bidCount} bid${bidCount !== 1 ? 's' : ''}`;
//       bidCountEl.style.fontSize = "12px";
//       bidCountEl.style.opacity = "0.7";
//       bidCountEl.style.marginTop = "4px";
//       metaEl.appendChild(bidCountEl);
//     }
//   }
// }

// function updateBidPrices() {
//   const cards = document.querySelectorAll('.auction-card');
//   cards.forEach((card) => {
//     const auctionId = card.dataset.auctionId;
//     if (auctionId) {
//       updateBidPrice(auctionId);
//     }
//   });
// }

// // Make functions globally accessible
// window.openBidModal = openBidModal;
// window.closeBidModal = closeBidModal;

console.log("SurrealBid loaded");

/* ======================================================
   CONFIG
====================================================== */

const STORAGE_KEY = "surrealbid_auctions";
const BIDS_STORAGE_KEY = "surrealbid_bids";

const SHARED_STORAGE_API = "https://api.jsonbin.io/v3/b";
const SHARED_STORAGE_BIN_ID = "699063ae43b1c97be97e71d0";
const SHARED_STORAGE_API_KEY =
  "$2a$10$dwfI5DnmcSV.xrlrteOKBOW0qrUqwdylnR4Zz.AsmSbD9RAJM7yG6";
const USE_SHARED_STORAGE = true;

/* ======================================================
   EXCHANGE RATE SYSTEM
====================================================== */

const EXCHANGE_RATE_CACHE_KEY = "surrealbid_exchange_rate";
const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000;
const DEFAULT_INR_PER_USD = 83;

let currentExchangeRate = DEFAULT_INR_PER_USD;

async function getLiveExchangeRate() {
  try {
    const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < EXCHANGE_RATE_CACHE_DURATION)
        return rate;
    }
  } catch {}

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!res.ok) throw new Error("API failed");

    const data = await res.json();
    const rate = data?.rates?.INR;

    if (rate && rate > 70 && rate < 100) {
      localStorage.setItem(
        EXCHANGE_RATE_CACHE_KEY,
        JSON.stringify({ rate, timestamp: Date.now() })
      );
      return rate;
    }
  } catch {}

  return DEFAULT_INR_PER_USD;
}

async function initExchangeRate() {
  const rate = await getLiveExchangeRate();
  currentExchangeRate =
    rate > 70 && rate < 100 ? rate : DEFAULT_INR_PER_USD;

  refreshAllDisplayedPrices();
}

function convertINRtoUSD(inr) {
  return inr / currentExchangeRate;
}

initExchangeRate();

/* ======================================================
   PRICE REFRESH
====================================================== */

function refreshAllDisplayedPrices() {
  const spans = document.querySelectorAll(".auction-price");

  spans.forEach(span => {
    const auctionId = span.dataset.auctionId;
    if (!auctionId) return;

    const highest = getHighestBid(auctionId);
    const auctions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    const auction = auctions.find(
      a => String(a.id) === String(auctionId)
    );

    const amount = highest
      ? highest.amount
      : auction?.currentBidINR || 0;

    const usd = convertINRtoUSD(amount);

    span.textContent =
      `₹${amount.toLocaleString("en-IN")} (≈ $${usd.toFixed(2)})`;
  });
}

/* ======================================================
   STORAGE
====================================================== */

async function loadStoredAuctions() {
  let local = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) local = JSON.parse(raw);
  } catch {}

  if (!USE_SHARED_STORAGE) return local;

  try {
    const res = await fetch(
      `${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}/latest`,
      {
        headers: {
          "X-Master-Key": SHARED_STORAGE_API_KEY,
          "X-Bin-Meta": "false"
        }
      }
    );

    if (!res.ok) return local;

    const data = await res.json();
    let remote = [];

    if (data.record) {
      remote = Array.isArray(data.record)
        ? data.record
        : data.record.auctions || [];
    }

    if (!Array.isArray(remote)) return local;

    // 🔥 SAFE MERGE (remote updates bid data only)
    const merged = remote.map(r => {
      const localMatch = local.find(a => a.id === r.id);

      if (localMatch) {
        return {
          ...r,
          imageDataUrl: localMatch.imageDataUrl || r.imageDataUrl
        };
      }

      return r;
    });

    // Add local-only auctions
    const remoteIds = new Set(remote.map(a => a.id));
    const localOnly = local.filter(a => !remoteIds.has(a.id));

    return [...merged, ...localOnly];
  } catch {
    return local;
  }
}


async function saveStoredAuctions(list) {
  // Save locally always
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  if (!USE_SHARED_STORAGE) return;

  try {
    const cleaned = list.map(a => {
      const copy = { ...a };

      // Remove large base64 only if huge
      if (copy.imageDataUrl && copy.imageDataUrl.length > 500000) {
        delete copy.imageDataUrl;
      }

      return copy;
    });

    const response = await fetch(
      `${SHARED_STORAGE_API}/${SHARED_STORAGE_BIN_ID}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": SHARED_STORAGE_API_KEY
        },
        body: JSON.stringify(cleaned) // 🔥 FIXED BODY
      }
    );

    const result = await response.json();
    console.log("JSONBin saved:", result);
  } catch (err) {
    console.error("JSONBin save failed:", err);
  }
}


/* ======================================================
   BIDDING SYSTEM
====================================================== */

function loadBids() {
  try {
    return JSON.parse(localStorage.getItem(BIDS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBids(bids) {
  localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(bids));
}

function getHighestBid(id) {
  const bids = loadBids()[id] || [];
  if (!bids.length) return null;
  return bids.reduce((a, b) => (b.amount > a.amount ? b : a));
}

async function addBid(id, amount, name, email) {
  const bids = loadBids();
  if (!bids[id]) bids[id] = [];

  bids[id].push({
    id: `bid-${Date.now()}`,
    amount,
    bidderName: name,
    bidderEmail: email,
    timestamp: Date.now()
  });

  saveBids(bids);

  const auctions = await loadStoredAuctions();
  const index = auctions.findIndex(a => a.id === id);
  if (index !== -1) {
    auctions[index].currentBidINR = amount;
    saveStoredAuctions(auctions);
  }
}

/* ======================================================
   CREATE AUCTION FORM
====================================================== */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", handleAuctionForm);
} else {
  handleAuctionForm();
}

function handleAuctionForm() {
  const form = document.getElementById("auction-form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("title")?.value.trim();
    const artist = document.getElementById("artist")?.value.trim();
    const startBid = Number(document.getElementById("startBid")?.value);
    const duration = Number(
      document.getElementById("durationMinutes")?.value
    );
    const imageFile =
      document.getElementById("imageFile")?.files[0];
    const imageUrl =
      document.getElementById("imageUrl")?.value.trim();

    if (!title || !artist || !startBid || !duration) {
      alert("Please fill all required fields.");
      return;
    }

    const now = Date.now();
    const endTime = now + duration * 60 * 1000;

    const auctions = await loadStoredAuctions();

    const newAuction = {
      id: `auction-${now}`,
      title,
      artist,
      currentBidINR: startBid,
      endTime
    };

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function () {
        newAuction.imageDataUrl = reader.result;
        auctions.push(newAuction);
        saveStoredAuctions(auctions);
        window.location.href = "auctions.html";
      };
      reader.readAsDataURL(imageFile);
    } else if (imageUrl) {
      newAuction.imageUrl = imageUrl;
      auctions.push(newAuction);
      saveStoredAuctions(auctions);
      window.location.href = "auctions.html";
    } else {
      auctions.push(newAuction);
      saveStoredAuctions(auctions);
      window.location.href = "auctions.html";
    }
  });
}

/* ======================================================
   AUCTION PAGE RENDER
====================================================== */

(function initPage() {
  const activeGrid = document.getElementById("active-auctions");
  const endedGrid = document.getElementById("ended-auctions");
  if (!activeGrid || !endedGrid) return;

  async function render() {
    const auctions = await loadStoredAuctions();
    renderGrouped(auctions);
  }

  render();
  if (USE_SHARED_STORAGE) setInterval(render, 10000);
})();

function renderGrouped(auctions) {
  const activeGrid = document.getElementById("active-auctions");
  const endedGrid = document.getElementById("ended-auctions");

  activeGrid.innerHTML = "";
  endedGrid.innerHTML = "";

  const now = Date.now();

  auctions.forEach(a => {
    const endTime = Number(a.endTime || 0);
    const isEnded = !endTime || now >= endTime;
    const card = createCard(a, isEnded);
    if (isEnded) endedGrid.appendChild(card);
    else activeGrid.appendChild(card);
  });
}

/* ======================================================
   CARD CREATION
====================================================== */

function createCard(auction, isEnded) {
  const card = document.createElement("article");
  card.className = "auction-card";

  const img = document.createElement("div");
  img.className = "auction-image";

  if (auction.imageDataUrl)
    img.style.backgroundImage = `url('${auction.imageDataUrl}')`;
  else if (auction.imageUrl)
    img.style.backgroundImage = `url('${auction.imageUrl}')`;
  else img.classList.add("placeholder-image");

  const body = document.createElement("div");
  body.className = "auction-body";

  const title = document.createElement("h2");
  title.textContent = auction.title;

  const artist = document.createElement("p");
  artist.textContent = `by ${auction.artist}`;

  const highest = getHighestBid(auction.id);
  const bid = highest ? highest.amount : auction.currentBidINR || 0;
  const usd = convertINRtoUSD(bid);

  const price = document.createElement("p");
  price.className = "auction-meta";
  price.innerHTML = `
    Current bid:
    <span data-auction-id="${auction.id}" class="auction-price">
      ₹${bid.toLocaleString("en-IN")}
      (≈ $${usd.toFixed(2)})
    </span>
  `;

  const timer = document.createElement("p");
  timer.className = "auction-timer";

  function format(ms) {
    if (ms <= 0) return "Auction ended";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s left`;
    if (m > 0) return `${m}m ${sec}s left`;
    return `${sec}s left`;
  }

  if (!isEnded) {
    setInterval(() => {
      timer.textContent = format(auction.endTime - Date.now());
    }, 1000);
  }

  timer.textContent = isEnded
    ? "Auction ended"
    : format(auction.endTime - Date.now());

  const btn = document.createElement("button");
  btn.className = "auction-btn";

  if (isEnded) {
    btn.disabled = true;
    btn.textContent = "Auction ended";
  } else {
    btn.textContent = "Place Bid";
    btn.onclick = () =>
      openBidModal(auction.id, auction.title, auction.artist, bid);
  }

  body.appendChild(title);
  body.appendChild(artist);
  body.appendChild(price);
  body.appendChild(timer);
  body.appendChild(btn);

  card.appendChild(img);
  card.appendChild(body);

  return card;
}

/* ======================================================
   MODAL UI
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
            <label>Your Name</label>
            <input id="bidder-name" type="text" required minlength="2" maxlength="100" />
          </div>

          <div class="form-row">
            <label>Email (optional)</label>
            <input id="bidder-email" type="email" maxlength="254" />
          </div>

          <div class="form-row">
            <label>Your Bid Amount (INR)</label>
            <input id="bid-amount" type="number" required min="${currentBid + 1}" />
            <p class="form-hint">
              Minimum bid: ₹${(currentBid + 1).toLocaleString("en-IN")}
            </p>
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

  document.getElementById("bid-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const amount = Math.floor(
      Number(document.getElementById("bid-amount").value)
    );
    const name = document.getElementById("bidder-name").value.trim();
    const email = document.getElementById("bidder-email").value.trim();

    if (!amount || amount <= currentBid) {
      alert("Bid must be higher than current bid.");
      return;
    }

    addBid(auctionId, amount, name, email).then(() => {
      refreshAllDisplayedPrices();
      closeBidModal();
    });
  });

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

