# Chrome Web Store Publication Checklist

Use this checklist to ensure everything is ready before publishing.

## ✅ Pre-Publication Setup

### 1. Supabase Database Setup
- [x] Created Supabase account at https://supabase.com
- [x] Created a new project
- [x] Copied SUPABASE_URL from project settings
- [x] Copied SUPABASE_ANON_KEY from project settings
- [x] Ran the SQL from `supabase_schema.sql` in SQL Editor
- [x] Verified `notes` table exists in Table Editor
- [x] Checked that indexes were created
- [x] Verified RLS policy "Allow all operations with anon key" exists

### 2. Google OAuth Setup
- [x] Created project in Google Cloud Console
- [x] Enabled Google People API
- [x] Built extension and got extension ID
- [x] Created OAuth 2.0 Client ID (type: Chrome Extension)
- [x] Added extension ID to OAuth client
- [x] Copied Client ID to `public/manifest.json` → `oauth2.client_id`
- [x] Tested sign-in flow locally

### 3. Environment Variables
- [x] Created `.env` file in project root
- [x] Added `SUPABASE_URL=...`
- [x] Added `SUPABASE_ANON_KEY=...`
- [x] Added `GOOGLE_CLIENT_ID=...` (for reference)
- [x] Verified variables are loaded: `npm run build` shows "[dotenv] injecting env (3)"
- [x] Confirmed `.env` is in `.gitignore` (never commit credentials!)

### 4. Code & Assets
- [ ] Updated version number in `public/manifest.json`
- [ ] Extension name is finalized
- [ ] Extension description is compelling
- [ ] Icons are ready:
  - [ ] 16x16 pixels (toolbar)
  - [ ] 48x48 pixels (extensions page)
  - [ ] 128x128 pixels (Web Store)
- [ ] All icons are optimized PNG files
- [ ] Screenshots prepared (1280x800 or 640x400)

### 5. Testing - Without Sign-In
- [x] Load extension in Chrome
- [x] Navigate to any YouTube video
- [x] Notes panel appears on the right side
- [x] Add a note → Press Enter → Note saves
- [x] Note appears in the list
- [x] Click timestamp → Video jumps to that time
- [x] Refresh page → Note still appears
- [x] Navigate to different video → Notes are video-specific
- [x] Close browser and reopen → Notes persist
- [x] Edit a note → Changes save
- [x] Delete a note → Note disappears

### 6. Testing - With Sign-In
- [x] Click extension icon → Click "Sign in with Google"
- [x] Google OAuth popup appears
- [x] Sign in successful → Profile shows in popup
- [x] Sync status shows "✅ Synced"
- [x] Add a note on YouTube
- [x] Go to Supabase Table Editor → Note appears in `notes` table
- [x] Check `user_id` column → Contains UUID format (not numeric)
- [ ] Install extension on different browser/device
- [ ] Sign in with same Google account
- [ ] Notes from first device appear
- [ ] Add note on second device → Syncs to first device

### 7. Testing - Edge Cases
- [ ] Very long note (1000+ characters) → Saves correctly
- [ ] Special characters in note (!@#$%^&*) → Saves correctly
- [ ] Multiple notes at same timestamp → All save
- [ ] No internet connection → Notes save locally
- [ ] Internet returns → Notes sync automatically
- [ ] Sign out → Profile clears, notes remain local
- [ ] Sign in with different account → Different notes appear

### 8. Privacy Policy
- [ ] Created privacy policy (use `PRIVACY_POLICY.md` template)
- [ ] Updated placeholders:
  - [ ] `[your-email@example.com]`
  - [ ] `[Your Country]`
  - [ ] `[Your Supabase Region]`
  - [ ] `[yourusername]` (GitHub)
- [ ] Hosted privacy policy publicly:
  - Option A: GitHub Pages (easiest)
  - Option B: Your own website
  - Option C: Google Sites
- [ ] Privacy policy URL is accessible (test in incognito)
- [ ] Saved privacy policy URL for Chrome Web Store listing

### 9. Chrome Web Store Account
- [ ] Registered as Chrome Web Store developer
- [ ] Paid $5 one-time developer fee
- [ ] Email verified
- [ ] Developer account is active

## 📦 Building for Production

### 10. Production Build
```bash
# Clean previous builds
rm -rf dist/

# Build production version
npm run build

# Verify output
ls -la dist/
```

- [ ] Build completed without errors
- [ ] `dist/` folder contains all files
- [ ] `manifest.json` is in `dist/`
- [ ] Icons are in `dist/icons/`
- [ ] JavaScript files are minified
- [ ] Console shows: "[dotenv] injecting env (3)"

### 11. Create ZIP Package
```bash
cd dist
zip -r ../youtube-notes-extension.zip .
cd ..
```

- [ ] ZIP file created: `youtube-notes-extension.zip`
- [ ] ZIP file size is reasonable (< 10MB)
- [ ] Opened ZIP → All files are in root (not in subfolder)

## 🚀 Chrome Web Store Submission

### 12. Store Listing - Required Fields

Go to: https://chrome.google.com/webstore/devconsole/

- [ ] **Upload ZIP**: Selected `youtube-notes-extension.zip`
- [ ] **Extension Name**: "YouTube Notes" (or your chosen name)
- [ ] **Summary**: Short description (132 chars max)
  ```
  Take timestamped notes on YouTube videos. Click timestamps to jump instantly. Sign in to sync across devices.
  ```
- [ ] **Description**: Full description (use content from `README_USERS.md`)
- [ ] **Category**: Productivity
- [ ] **Language**: English (add more languages if you have translations)

### 13. Store Listing - Graphics
- [ ] **Icon**: Uploaded 128x128 PNG
- [ ] **Screenshots**: Uploaded 3-5 screenshots (1280x800 recommended)
  - Screenshot 1: Notes panel on YouTube
  - Screenshot 2: Extension popup showing profile
  - Screenshot 3: Adding a note
  - Screenshot 4: Clicking timestamp
  - Screenshot 5: Sync across devices (optional)
- [ ] **Promotional Tile**: Uploaded 440x280 PNG (optional but recommended)
- [ ] **Marquee Promo Tile**: Uploaded 1400x560 PNG (optional)

### 14. Store Listing - Privacy
- [ ] **Privacy Policy URL**: Added your privacy policy URL
- [ ] **Permissions Justification**: Explained each permission:
  - `storage`: "Store notes locally"
  - `tabs`: "Detect current YouTube video"
  - `identity`: "Sign in with Google"
- [ ] **Host Permissions Justification**: 
  - `https://www.youtube.com/*`: "Inject notes panel on YouTube"
  - `https://*.supabase.co/*`: "Sync notes to secure database"
- [ ] **Single Purpose**: Described the single purpose clearly
  ```
  This extension allows users to take timestamped notes on YouTube videos 
  and optionally sync them across devices via Google sign-in.
  ```

### 15. Store Listing - Distribution
- [ ] **Visibility**: Public (or Unlisted for testing)
- [ ] **Regions**: Selected all regions (or specific ones)
- [ ] **Pricing**: Free

### 16. Final Checks Before Submit
- [ ] Previewed listing → Looks professional
- [ ] Tested extension one more time in clean Chrome profile
- [ ] All screenshots are clear and high quality
- [ ] Description has no typos
- [ ] Privacy policy link works in incognito mode
- [ ] Google OAuth is working
- [ ] Supabase database is accessible

### 17. Submit for Review
- [ ] Clicked "Submit for Review"
- [ ] Received confirmation email
- [ ] Review status shows "Pending"

## ⏰ After Submission

### 18. Wait for Review
- Typical review time: 1-3 days
- Check email for review status
- Check developer dashboard daily

### 19. If Approved ✅
- [ ] Extension is live on Chrome Web Store
- [ ] Test installation from store
- [ ] Share store link with friends for feedback
- [ ] Monitor reviews and ratings
- [ ] Respond to user reviews

### 20. If Rejected ❌
- [ ] Read rejection reason carefully
- [ ] Fix issues mentioned
- [ ] Rebuild extension
- [ ] Re-submit with explanation of fixes

## 📊 Post-Launch Monitoring

### 21. Monitor Usage (Daily for first week)
- [ ] Check Chrome Web Store dashboard → User count
- [ ] Check Supabase dashboard → Database size
- [ ] Check Google Cloud Console → OAuth usage
- [ ] Read user reviews
- [ ] Check for crash reports

### 22. Respond to Users
- [ ] Reply to reviews (especially negative ones)
- [ ] Fix critical bugs quickly
- [ ] Thank users for positive feedback
- [ ] Consider feature requests

### 23. Plan Updates
- [ ] Create roadmap for new features
- [ ] Fix bugs reported by users
- [ ] Improve based on feedback
- [ ] Update regularly to show active maintenance

## 🎯 Success Metrics

Track these to measure success:
- [ ] Daily active users
- [ ] User retention (7-day, 30-day)
- [ ] Average rating (aim for 4+ stars)
- [ ] Number of notes created
- [ ] Sign-in conversion rate
- [ ] User reviews and feedback

## 🆘 Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| Sync not working | Check Supabase credentials in .env |
| OAuth fails | Verify extension ID matches Google Console |
| Notes not saving | Check Chrome storage permissions |
| Extension rejected | Read rejection email, fix specific issues |
| High uninstall rate | Read reviews, improve UX based on feedback |

## 📝 Notes

- Chrome Web Store review takes 1-3 days (sometimes up to a week)
- First submission often gets rejected - don't worry, just fix and resubmit
- Monitor your Supabase usage - free tier has limits
- Keep backups of your Supabase database
- Update extension every 3-6 months to stay relevant

---

**Good luck with your launch! 🚀**

Need help? Check DEVELOPER_GUIDE.md or open an issue on GitHub.

