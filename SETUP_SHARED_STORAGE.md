# Setting Up Shared Storage for Auctions

Currently, auctions are stored in localStorage which is browser-specific. To make auctions visible to everyone, you need to set up shared storage.

## Quick Setup Options

### Option 1: JSONBin.io (Free, Easy Setup)

1. **Sign up** at https://jsonbin.io (free account)
2. **Create a new bin:**
   - Go to "Create Bin"
   - Add this JSON: `{"auctions": []}`
   - Copy the Bin ID (looks like: `675a1234567890abcdef1234`)
3. **Get your API Key:**
   - Go to "API Keys" in your dashboard
   - Copy your "Master Key" (starts with `$2a$10$`)
4. **Update `js/script.js`:**
   - Find these lines near the top:
     ```javascript
     const SHARED_STORAGE_BIN_ID = '675a1234567890abcdef1234';
     const SHARED_STORAGE_API_KEY = '$2a$10$YOUR_API_KEY_HERE';
     const USE_SHARED_STORAGE = false;
     ```
   - Replace with your actual values:
     ```javascript
     const SHARED_STORAGE_BIN_ID = 'YOUR_BIN_ID_HERE';
     const SHARED_STORAGE_API_KEY = 'YOUR_MASTER_KEY_HERE';
     const USE_SHARED_STORAGE = true;
     ```

### Option 2: Supabase (Recommended for Production)

1. **Sign up** at https://supabase.com (free tier available)
2. **Create a new project**
3. **Create a table:**
   ```sql
   CREATE TABLE auctions (
     id TEXT PRIMARY KEY,
     title TEXT,
     artist TEXT,
     imageUrl TEXT,
     imageDataUrl TEXT,
     currentBidINR NUMERIC,
     endTime BIGINT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
4. **Get your API keys** from Project Settings → API
5. **Update the code** to use Supabase SDK (requires more changes)

### Option 3: Firebase (Google)

1. **Sign up** at https://firebase.google.com
2. **Create a new project**
3. **Enable Firestore Database**
4. **Get your config** from Project Settings
5. **Update the code** to use Firebase SDK

## Current Status

The code is set up to use shared storage but is currently disabled (`USE_SHARED_STORAGE = false`). 

**To enable:**
1. Choose one of the options above
2. Update the configuration in `js/script.js`
3. Set `USE_SHARED_STORAGE = true`

## Fallback Behavior

Even with shared storage enabled, the system will:
- Always save to localStorage (for offline access)
- Fall back to localStorage if shared storage fails
- Work offline using cached data

## Testing

After setup:
1. Create an auction on one browser/device
2. Open the site on another browser/device
3. You should see the auction you created!
