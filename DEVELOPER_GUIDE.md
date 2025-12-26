# YouTube Notes - Developer Guide

This guide is for developers who want to build, modify, or publish this extension.

## 🏗️ Architecture

- **React + TypeScript** - Modern, type-safe frontend
- **Manifest V3** - Latest Chrome Extension standards
- **Shadow DOM** - Complete style isolation from YouTube
- **Chrome Storage API** - Offline-first local storage
- **Chrome Identity API** - Google OAuth authentication
- **Supabase** - Centralized PostgreSQL backend for all users
- **Tailwind CSS** - Scoped utility classes (prefix: `ytn-`)

## 🔧 Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Important:** These credentials will be bundled into the extension and used by ALL users. This is YOUR backend that serves all users.

### 3. Set Up Google OAuth (One-Time Setup)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google People API**
4. Create OAuth 2.0 Credentials:
   - Type: **Chrome Extension** (not Web Application)
   - You'll need the extension ID (get it after first build)
5. Build and load the extension to get the ID:
   ```bash
   npm run build
   # Load dist/ folder in chrome://extensions/
   # Copy the extension ID
   ```
6. Go back to Google Cloud Console and add the extension ID
7. Update `public/manifest.json` with your OAuth client ID:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/userinfo.email",
       "https://www.googleapis.com/auth/userinfo.profile"
     ]
   }
   ```

### 4. Set Up Supabase Database (One-Time Setup)

This is YOUR database that ALL users will connect to:

1. Go to your Supabase dashboard
2. Open SQL Editor
3. Run the SQL from `supabase_schema.sql`
4. Verify the `notes` table was created

The schema includes:
- RLS (Row Level Security) with permissive policy for Chrome Identity API
- Indexes for performance
- Auto-updating timestamps
- UUID support for user IDs

### 5. Build the Extension

```bash
# Development build with watch mode
npm run dev

# Production build (minified)
npm run build
```

### 6. Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## 🚀 Publishing to Chrome Web Store

### Pre-Publication Checklist

- [ ] Supabase database is set up and running
- [ ] Google OAuth is configured correctly
- [ ] Environment variables are set in `.env`
- [ ] Extension has been tested with multiple Google accounts
- [ ] Icons are optimized (16x16, 48x48, 128x128)
- [ ] Extension version is updated in `manifest.json`
- [ ] Privacy policy is ready (required by Chrome Web Store)

### Build for Production

```bash
npm run build
```

This creates a production build in the `dist` folder with:
- Minified JavaScript
- Environment variables baked in
- Optimized assets

### Create ZIP for Upload

```bash
cd dist
zip -r ../youtube-notes-extension.zip .
cd ..
```

### Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Pay the one-time $5 developer fee (if first time)
3. Click "New Item"
4. Upload `youtube-notes-extension.zip`
5. Fill in the store listing:
   - **Name:** YouTube Notes
   - **Summary:** Take timestamped notes on YouTube videos
   - **Description:** Use the user-facing content from `README_USERS.md`
   - **Category:** Productivity
   - **Language:** English
6. Upload screenshots (1280x800 or 640x400)
7. Upload extension icon (128x128)
8. Add privacy policy URL (required for OAuth)
9. Submit for review

### Privacy Policy Requirements

Since you use Google OAuth, you MUST provide a privacy policy. Create a simple one explaining:
- What data you collect (email, name from Google)
- How you use it (sync notes across devices)
- That you don't share data with third parties
- How users can delete their data

You can host this on:
- GitHub Pages
- Your own website
- Google Sites (free)

## 🔒 Security Considerations

### Current Setup

- **Chrome Identity API** handles Google authentication
- **Supabase Anon Key** is embedded in the extension (this is normal for client-side apps)
- **RLS Policy** is permissive (allows all operations)
- **User validation** happens client-side

### For Production

The current setup is fine for a Chrome Web Store app because:
1. Chrome Web Store distributes the code securely
2. Supabase anon key is meant to be public
3. RLS prevents users from accessing each other's notes (if you implement proper policies)

### Optional Improvements

For better security, you could:
1. Implement proper RLS policies based on user_id
2. Add Edge Functions for server-side validation
3. Rate limit requests
4. Add data validation on the backend

## 📦 Project Structure

```
yt-notes-app/
├── public/
│   ├── manifest.json          # Extension configuration
│   ├── popup.html             # Popup UI
│   └── icons/                 # Extension icons
├── src/
│   ├── background/
│   │   └── index.ts          # Service worker (sync logic)
│   ├── content/
│   │   ├── index.tsx         # Content script entry
│   │   ├── NotesPanel.tsx    # Main notes UI
│   │   ├── NoteEditor.tsx    # Note input component
│   │   └── NotesList.tsx     # Notes display component
│   ├── popup/
│   │   ├── index.tsx         # Popup entry
│   │   ├── Popup.tsx         # Popup component
│   │   └── popup.css         # Popup styles
│   ├── utils/
│   │   ├── chromeAuth.ts     # Google OAuth logic
│   │   ├── storage.ts        # Chrome storage wrapper
│   │   ├── supabase.ts       # Supabase client
│   │   └── youtube.ts        # YouTube helpers
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── styles/
│       └── content.css       # Content script styles
├── .env                       # Environment variables (not in git)
├── webpack.config.js          # Build configuration
└── tsconfig.json             # TypeScript configuration
```

## 🧪 Testing Before Publication

Test with multiple scenarios:

1. **Without sign-in:**
   - Add notes, reload page, verify persistence
   - Navigate between videos
   - Close and reopen browser

2. **With sign-in:**
   - Sign in, add notes
   - Open extension on different device
   - Verify notes sync

3. **Edge cases:**
   - Very long notes
   - Special characters
   - Multiple notes at same timestamp
   - Network offline/online

## 🔄 Update Workflow

When publishing updates:

1. Update version in `manifest.json`
2. Document changes in CHANGELOG.md
3. Run `npm run build`
4. Test the production build
5. Create new ZIP file
6. Upload to Chrome Web Store
7. Wait for review (usually 1-3 days)

## 🐛 Debugging

### View Background Service Worker Logs

1. Go to `chrome://extensions/`
2. Click "service worker" under your extension
3. Check console for sync errors

### View Content Script Logs

1. Open any YouTube video
2. Open DevTools (F12)
3. Check console for content script logs

### View Popup Logs

1. Click extension icon
2. Right-click on popup
3. Select "Inspect"
4. Check console

## 📊 Monitoring After Publication

Monitor your app health:

1. **Supabase Dashboard**
   - Check table growth
   - Monitor query performance
   - Watch for errors

2. **Chrome Web Store Dashboard**
   - User count
   - Reviews and ratings
   - Crash reports

3. **Google Cloud Console**
   - OAuth usage
   - API quotas

## 💰 Costs

- **Chrome Web Store:** $5 one-time fee
- **Google Cloud:** Free tier (OAuth)
- **Supabase:** Free tier includes:
  - 500MB database
  - 2GB bandwidth
  - 50,000 monthly active users

If you exceed limits, upgrade to paid plans.

## 📝 License

MIT License - See LICENSE file for details
# YouTube Notes - Chrome Extension

Take timestamped notes on any YouTube video. Click timestamps to jump to that moment instantly.

## ✨ Features

- 📝 **Timestamped Notes** - Add notes at any point while watching
- ⏱️ **One-Click Navigation** - Click any timestamp to jump to that moment
- 💾 **Always Saved** - Notes automatically saved locally
- ☁️ **Cloud Sync** - Sign in with Google to sync across devices
- 🎨 **Clean Design** - Non-invasive UI that doesn't interfere with YouTube
- 🔒 **Private** - Your notes are only visible to you

## 🚀 How to Use

1. **Install the extension** from Chrome Web Store
2. **Watch any YouTube video**
3. **Find the Notes panel** on the right side
4. **Type your note** and press Enter
5. **Click timestamps** to jump to that moment in the video

## 🔐 Sign In (Optional)

- Click the extension icon in your toolbar
- Click "Sign in with Google"
- Your notes will now sync across all your devices!

**Note:** Sign in is completely optional. All features work without signing in - notes are saved locally on your device.

## ⌨️ Keyboard Shortcuts

- **Enter** - Save note
- **Cmd/Ctrl + Enter** - Add new line in note
- **Click timestamp** - Jump to that moment in video

## 🛡️ Privacy

- Your notes are stored securely
- Only you can see your notes
- We never share your data
- Sign in is optional - works offline too

## 💡 Tips

- Add notes as you watch to remember key moments
- Use timestamps to create a video index
- Notes persist across browser sessions
- Works on all YouTube videos

## 🐛 Report Issues

Found a bug or have a suggestion? [Open an issue on GitHub](https://github.com/yourusername/yt-notes-app/issues)

## 📄 License

MIT License - feel free to modify and share!

