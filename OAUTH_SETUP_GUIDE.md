# Google OAuth Setup Guide for YouTube Notes Extension

## Step-by-Step Instructions with Screenshots

### Current Status
You're at the OAuth client creation screen where Google is asking for your Chrome Extension's **Item ID**.

---

## What You Need to Do Now:

### Step 1: Get Your Extension ID

1. **Open a new Chrome tab** and go to: `chrome://extensions/`

2. **Find "YouTube Notes"** extension in the list

3. **Look for the Extension ID** - it's shown right below the extension name and looks like:
   ```
   Example: abcdefghijklmnopqrstuvwxyzabcdef
   ```

4. **Copy this ID** - you'll need it in the next step

---

### Step 2: Complete the OAuth Client Form

Now go back to the Google Cloud Console tab where you're creating the OAuth client:

1. **Application type**: Already selected as "Chrome Extension" ✓

2. **Name**: You can name it anything (e.g., "YouTube Notes Chrome Extension")

3. **Item ID**: **Paste your extension ID here** (the one you just copied)

4. Click **"Create"** button

---

### Step 3: Get Your Client ID

After clicking Create, Google will show you:
- **Client ID** (ends with `.apps.googleusercontent.com`)
- Client Secret (you don't need this)

**Copy the Client ID** - you'll need it for the next step.

---

### Step 4: Update Your Extension

1. Open the file: `public/manifest.json` in your code editor

2. Add this section (replace `YOUR_CLIENT_ID` with the actual Client ID you just copied):

```json
{
  "manifest_version": 3,
  "name": "YouTube Notes",
  "version": "1.0.0",
  "description": "Take timestamped notes on YouTube videos",
  "permissions": [
    "storage",
    "tabs"
  ],
  "optional_permissions": [
    "identity"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://*.supabase.co/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/watch*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }
}
```

3. **Save the file**

4. **Rebuild the extension**:
   ```bash
   npm run build
   ```

5. **Reload the extension in Chrome**:
   - Go to `chrome://extensions/`
   - Click the refresh/reload icon ⟳ on the YouTube Notes extension

---

### Step 5: Test Sign In

1. Click the YouTube Notes extension icon
2. Click "Sign in with Google"
3. You should see the Google OAuth popup!
4. Sign in with your Google account
5. Grant permissions

---

## Quick Reference: Where to Find Your Extension ID

Your extension ID is shown in two places:

1. **On the extension card** at `chrome://extensions/`
   - It's the long string under the extension name
   - Format: lowercase letters a-z, 32 characters long

2. **In the extension details**
   - Click "Details" on your extension
   - The ID is shown at the top

---

## Troubleshooting

### "Invalid Item ID" error
- Make sure you copied the FULL extension ID (32 characters)
- No spaces before or after
- Should only contain lowercase letters (a-z)

### Extension ID keeps changing
- This happens if you don't have a consistent `key` in manifest.json
- The current manifest already has a key, so your ID should be stable

### OAuth client doesn't work
- Wait 5-10 minutes after creating the OAuth client (Google says it can take time)
- Make sure you copied the correct Client ID
- Check that the Client ID ends with `.apps.googleusercontent.com`

---

## Need Help?

If you get stuck:
1. Check that your extension ID matches exactly what's in Google Cloud Console
2. Make sure you rebuilt the extension after updating manifest.json
3. Try reloading the extension in Chrome
4. Check the browser console for specific error messages

---

**Remember**: OAuth setup is optional! The extension works perfectly without it - all notes are saved locally. You're setting this up for the cloud sync feature.

