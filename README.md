# YouTube Notes - Chrome Extension

A non-invasive Chrome Extension that lets you take timestamped notes on YouTube videos. Notes are attached to specific timestamps and reappear when you revisit videos.

## ✨ Features

- **Timestamped Notes**: Add notes at any point in the video
- **One-Click Navigation**: Click timestamps to jump to that moment
- **Offline-First**: Notes saved locally, sync optional
- **Google OAuth**: Sign in to sync notes across devices
- **Non-Invasive UI**: Completely isolated from YouTube's native UI using Shadow DOM
- **Zero YouTube Interference**: No modification to YouTube's styles, controls, or behavior

## 🏗️ Architecture

- **React + TypeScript**: Modern, type-safe frontend
- **Manifest V3**: Latest Chrome Extension standards
- **Shadow DOM**: Complete style isolation
- **Chrome Storage API**: Offline-first local storage
- **Supabase**: Authentication and PostgreSQL backend
- **Tailwind CSS**: Scoped utility classes (prefix: `ytn-`)

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase and Google OAuth credentials:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Set Up Supabase Database

Create a table in your Supabase project:

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, video_id, id)
);

-- Index for faster queries
CREATE INDEX idx_notes_user_video ON notes(user_id, video_id);
CREATE INDEX idx_notes_timestamp ON notes(timestamp);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notes
CREATE POLICY "Users can view own notes" 
  ON notes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" 
  ON notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" 
  ON notes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" 
  ON notes FOR DELETE 
  USING (auth.uid() = user_id);
```

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `https://<your-extension-id>.chromiumapp.org/`
   - Get extension ID after first load in Chrome
6. Update `public/manifest.json` with your client ID

### 5. Build the Extension

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### 6. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project

## 🚀 Usage

1. Navigate to any YouTube video (e.g., `youtube.com/watch?v=...`)
2. Find the notes panel in the right sidebar
3. Click "Add Note" to create a timestamped note at the current playback time
4. Click any timestamp to jump to that moment in the video
5. Edit or delete notes as needed
6. (Optional) Sign in to sync notes across devices

## 🔧 Development

### Project Structure

```
yt-notes-app/
├── public/
│   ├── manifest.json       # Extension manifest
│   ├── popup.html          # Popup UI HTML
│   └── icons/              # Extension icons
├── src/
│   ├── background/
│   │   └── index.ts        # Service worker for auth & sync
│   ├── content/
│   │   ├── index.tsx       # Content script entry
│   │   ├── NotesPanel.tsx  # Main notes UI component
│   │   ├── NotesList.tsx   # Notes list component
│   │   └── NoteEditor.tsx  # Note editor component
│   ├── popup/
│   │   ├── index.tsx       # Popup entry
│   │   ├── Popup.tsx       # Popup component
│   │   └── popup.css       # Popup styles
│   ├── styles/
│   │   └── content.css     # Content script styles
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   └── utils/
│       ├── youtube.ts      # YouTube API helpers
│       ├── storage.ts      # Chrome storage wrapper
│       └── supabase.ts     # Supabase client
├── webpack.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Scripts

- `npm run dev` - Build in development mode with watch
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking

### Key Design Decisions

1. **Shadow DOM Isolation**: All extension UI is rendered in a Shadow DOM to prevent style conflicts with YouTube
2. **Defensive Selectors**: YouTube's DOM structure may change; selectors are defensive and fallback gracefully
3. **No Global Mutations**: Extension never modifies YouTube's existing DOM nodes
4. **Offline-First**: All notes stored in `chrome.storage.local` first, then synced to Supabase
5. **Non-Blocking**: Extension loads asynchronously and doesn't block YouTube's functionality

## 🎨 UI/UX Principles

- **Non-Invasive**: Extension UI appears as an additive panel, never blocking core YouTube features
- **Native Feel**: Design matches YouTube's dark theme with similar spacing and typography
- **Collapsible**: Panel can be collapsed to minimize visual footprint
- **Keyboard Friendly**: Cmd/Ctrl + Enter to save notes quickly
- **Unobtrusive**: No popups, no forced interactions, no YouTube UI modifications

## 🔒 Privacy & Security

- Notes are stored locally by default
- Only video IDs and timestamps are stored (no YouTube content)
- Authentication is optional
- User data never leaves your control (self-hosted Supabase)
- Row-level security ensures users only see their own notes

## 🐛 Troubleshooting

### Extension doesn't appear on YouTube
- Ensure you're on a `/watch` page (not homepage or search)
- Check browser console for errors
- Reload the page
- Verify extension is enabled in `chrome://extensions/`

### Notes not syncing
- Check internet connection
- Verify Supabase credentials in `.env`
- Check background script logs in `chrome://extensions/` → Details → Service Worker
- Ensure you're signed in

### Styles look broken
- Clear browser cache
- Rebuild extension: `npm run build`
- Reload extension in Chrome

## 📝 Future Enhancements

- [ ] Export notes to Markdown/PDF
- [ ] Share notes with others via link
- [ ] Rich text formatting
- [ ] Keyboard shortcuts for quick note-taking
- [ ] Search and filter notes
- [ ] Tags and categories
- [ ] Dark/light theme toggle
- [ ] Import notes from other tools

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:
- Keep code clean and well-commented
- Maintain non-invasive design principles
- Test thoroughly on YouTube
- Don't break existing YouTube functionality

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Credits

Built with ❤️ for better YouTube learning and content consumption.

