# Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   
3. **Add placeholder icons:**
   Create PNG icons (16x16, 48x48, 128x128) in `public/icons/` or use the SVG temporarily

4. **Build the extension:**
   ```bash
   npm run build
   ```

5. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## For Development Without Supabase

The extension works perfectly without Supabase! Notes are stored locally by default.

To test without setting up Supabase:
1. Comment out Supabase imports in `src/utils/supabase.ts`
2. The extension will work in offline-only mode
3. All notes are saved to Chrome's local storage

## Testing

1. Navigate to any YouTube video
2. You should see a notes panel in the right sidebar
3. Add a note while the video is playing
4. Click the timestamp to jump back to that moment

## Troubleshooting

**Extension doesn't show up:**
- Make sure you're on a `/watch` page (not YouTube homepage)
- Open DevTools → Console and check for errors
- The panel appears in the right sidebar below other recommendations

**Build errors:**
- Delete `node_modules` and `dist` folders
- Run `npm install` again
- Make sure you're using Node.js v18 or higher

**Icons missing:**
- Extension will still work, just no icon in toolbar
- Create simple PNG files or temporarily modify manifest to remove icon references
<!-- Placeholder SVG icon - 16x16 -->
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="3" fill="#3EA6FF"/>
  <path d="M4 5h8M4 8h8M4 11h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>

