# Privacy Policy for YouTube Notes Chrome Extension

**Last Updated:** December 26, 2024

## Introduction

YouTube Notes ("we", "our", or "the extension") is a Chrome Extension that allows users to take timestamped notes on YouTube videos. This privacy policy explains how we collect, use, and protect your information.

## Information We Collect

### 1. Google Account Information
When you sign in with Google, we collect:
- Your email address
- Your name
- Your profile picture URL
- A unique Google user ID

This information is used solely to:
- Identify you across devices
- Sync your notes to our secure database
- Display your profile in the extension

### 2. Notes Data
We store:
- The text content of your notes
- YouTube video IDs associated with your notes
- Timestamps within videos where notes were created
- Creation and modification dates

### 3. Technical Data
We automatically collect:
- Chrome extension usage (via Chrome's built-in analytics, if enabled)
- Error logs for debugging purposes

## How We Use Your Information

Your information is used to:
1. **Provide the Service** - Store and sync your notes across devices
2. **Maintain Functionality** - Ensure notes appear on the correct videos
3. **Improve the Extension** - Fix bugs and add new features
4. **Communicate** - Send important updates about the service (rare)

## Data Storage

- **Local Storage**: Notes are stored locally in your browser using Chrome's storage API
- **Cloud Storage**: If you sign in, notes are synced to our Supabase database (hosted on AWS)
- **Encryption**: All data is transmitted over HTTPS/TLS
- **Location**: Data is stored in US East (Supabase region)

## Data Sharing

We DO NOT:
- ❌ Share your data with third parties
- ❌ Sell your information
- ❌ Use your data for advertising
- ❌ Access your YouTube watch history (we only know videos where you added notes)
- ❌ Track your browsing activity outside of YouTube

We MAY share data only if:
- Required by law or legal process
- Necessary to protect our rights or safety
- With your explicit consent

## Third-Party Services

We use the following third-party services:

### Google OAuth (Authentication)
- **Purpose**: Sign in with Google
- **Data Shared**: Email, name, profile picture
- **Privacy Policy**: https://policies.google.com/privacy

### Supabase (Database)
- **Purpose**: Store and sync notes
- **Data Shared**: User ID, notes, video IDs, timestamps
- **Privacy Policy**: https://supabase.com/privacy

## Your Rights

You have the right to:
- ✅ **Access** - View all your data
- ✅ **Export** - Download your notes
- ✅ **Delete** - Remove your account and all data
- ✅ **Opt-out** - Use the extension without signing in (local-only mode)

### How to Delete Your Data

1. **Local Data**: Uninstall the extension from Chrome
2. **Cloud Data**: 
   - Click "Sign Out" in the extension
   - Contact us to request full account deletion
   - We will delete all your data within 30 days

## Data Retention

- **Active Users**: Data retained indefinitely while you use the service
- **Inactive Users**: Accounts inactive for 2+ years may be deleted with notice
- **Deleted Data**: Permanently removed from backups within 90 days

## Security

We implement security measures including:
- HTTPS/TLS encryption for data transmission
- Secure authentication via Google OAuth
- Row-level security in our database
- Regular security updates

However, no method of transmission over the Internet is 100% secure. Use at your own risk.

## Children's Privacy

YouTube Notes is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.

## Changes to This Policy

We may update this privacy policy from time to time. We will notify you of any changes by:
- Updating the "Last Updated" date
- Posting a notice in the extension (for major changes)
- Sending an email (if you're signed in and change is significant)

Your continued use of the extension after changes constitutes acceptance of the new policy.

## Cookie Policy

This extension does not use cookies. All data is stored using Chrome's built-in storage API.

## International Users

If you are located outside the United States, please note that your information will be transferred to and processed in the United States. By using the extension, you consent to this transfer.

## Contact Us

If you have questions about this privacy policy or want to exercise your rights, contact us:

- **GitHub Issues**: https://github.com/yourusername/yt-notes-app/issues
- **Response Time**: We aim to respond within 7 business days

## Legal Compliance

This privacy policy complies with:
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Chrome Web Store Developer Program Policies

## Your Consent

By using YouTube Notes, you consent to this privacy policy.

---

## Instructions for Publishing

Before publishing to Chrome Web Store, you MUST:

1. **Replace placeholders above:**
   - Update GitHub URL with your actual username
   - Add your contact method (email or support page)
   - Verify Supabase region is correct

2. **Host this policy publicly:**
   - **Option A - GitHub Pages** (Recommended, Free):
     ```bash
     # Create a docs folder
     mkdir -p docs
     cp PRIVACY_POLICY.md docs/privacy.md
     # Push to GitHub
     # Enable GitHub Pages in repo Settings → Pages → Source: docs folder
     # Your privacy policy will be at: https://yourusername.github.io/yt-notes-app/privacy
     ```
   
   - **Option B - Google Sites** (Free):
     - Go to sites.google.com
     - Create new site
     - Copy/paste privacy policy content
     - Publish and get URL
   
   - **Option C - Your Own Website**:
     - Host on your personal website
     - Must be publicly accessible

3. **Add URL to Chrome Web Store listing:**
   - When submitting extension
   - Under "Privacy" section
   - Paste your privacy policy URL

4. **Test the URL:**
   - Open in incognito mode
   - Verify it's publicly accessible
   - Check that content is correct

