import { NotesStorage } from '@/utils/storage';
import { syncNotesToSupabase, getSession, signOut } from '@/utils/supabase';
import { ChromeMessage } from '@/types';

/**
 * Background service worker for Chrome Extension
 * Handles auth state, periodic sync, and message routing
 */

// Periodic sync interval (5 minutes)
const SYNC_INTERVAL = 5 * 60 * 1000;

let syncInterval: NodeJS.Timeout | null = null;

/**
 * Check if Supabase is configured
 */
function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

/**
 * Initialize background script
 */
async function initialize() {
  console.log('YouTube Notes: Background script initialized');

  if (!isSupabaseConfigured()) {
    console.log('YouTube Notes: Running in offline mode (Supabase not configured)');
    return;
  }

  // Check auth status on startup
  await checkAuthStatus();

  // Set up periodic sync
  startPeriodicSync();
}

/**
 * Check if user is authenticated and update storage
 */
async function checkAuthStatus() {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const session = await getSession();
    if (session?.user) {
      await NotesStorage.saveUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name,
        avatar: session.user.user_metadata?.avatar_url,
      });

      // Trigger initial sync
      await syncNotes();
    } else {
      await NotesStorage.clearUser();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('YouTube Notes: Auth check skipped -', errorMessage);
  }
}

/**
 * Sync unsynced notes to Supabase
 */
async function syncNotes() {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const user = await NotesStorage.getUser();
    if (!user) {
      console.log('No user logged in, skipping sync');
      return;
    }

    const unsyncedNotes = await NotesStorage.getUnsyncedNotes();
    if (unsyncedNotes.length === 0) {
      console.log('No notes to sync');
      return;
    }

    console.log(`Syncing ${unsyncedNotes.length} notes...`);

    // Add userId to notes before syncing
    const notesWithUser = unsyncedNotes.map(note => ({
      ...note,
      userId: user.id,
    }));

    await syncNotesToSupabase(notesWithUser);

    // Mark as synced
    await NotesStorage.markAsSynced(unsyncedNotes.map(n => n.id));

    console.log('Sync complete');

    // Notify content script
    broadcastMessage({ type: 'SYNC_COMPLETE' });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

/**
 * Start periodic background sync
 */
function startPeriodicSync() {
  if (!isSupabaseConfigured()) {
    return;
  }

  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    syncNotes();
  }, SYNC_INTERVAL);
}

/**
 * Broadcast message to all tabs
 */
function broadcastMessage(message: ChromeMessage) {
  chrome.tabs.query({ url: 'https://www.youtube.com/watch*' }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab might not have content script injected yet
        });
      }
    });
  });
}

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'AUTH_STATUS_CHANGED':
          await checkAuthStatus();
          sendResponse({ success: true });
          break;

        case 'NOTES_UPDATED':
          // Trigger immediate sync when notes are updated
          await syncNotes();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  return true; // Keep channel open for async response
});

/**
 * Handle extension installation/update
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('YouTube Notes extension installed');
  } else if (details.reason === 'update') {
    console.log('YouTube Notes extension updated');
  }
});

// Initialize on script load
initialize();
