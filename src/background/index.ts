import { NotesStorage } from '@/utils/storage';
import { syncNotesToSupabase, fetchAllNotesFromSupabase, isSupabaseConfigured } from '@/utils/supabase';
import { ChromeMessage } from '@/types';

/**
 * Background service worker for Chrome Extension
 * Handles auth state, periodic sync, and message routing
 */

// Periodic sync interval (5 minutes)
const SYNC_INTERVAL = 5 * 60 * 1000;

let syncInterval: NodeJS.Timeout | null = null;

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
    // Check if user is stored locally (Chrome Identity auth)
    const user = await NotesStorage.getUser();

    if (user?.id) {
      console.log('YouTube Notes: User authenticated, triggering sync...', user.email);
      // Trigger initial full sync (bidirectional)
      await performFullSync(user.id);
    } else {
      console.log('YouTube Notes: No user authenticated');
      // DON'T clear the user here - only clear on explicit sign out
      // This was causing race conditions where the background script would
      // delete user data during initialization
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('YouTube Notes: Auth check error -', errorMessage);
  }
}

/**
 * Perform full bidirectional sync
 * 1. Fetch all remote notes
 * 2. Merge with local notes (newer wins)
 * 3. Push any unsynced local notes to server
 */
async function performFullSync(userId: string) {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    console.log('YouTube Notes: Starting full sync...');

    await NotesStorage.setSyncStatus({ status: 'syncing', message: 'Syncing notes...' });

    // Step 1: Fetch all notes from Supabase
    const remoteNotes = await fetchAllNotesFromSupabase(userId);
    console.log(`Fetched ${Object.keys(remoteNotes).length} videos from remote`);

    // Step 2: Merge remote notes with local notes
    await NotesStorage.mergeNotes(remoteNotes);
    console.log('Merged remote notes with local notes');

    // Step 3: Push any unsynced local notes to server
    const unsyncedNotes = await NotesStorage.getUnsyncedNotes();
    if (unsyncedNotes.length > 0) {
      console.log(`Pushing ${unsyncedNotes.length} unsynced notes to server`);

      // Add userId to notes
      const notesWithUser = unsyncedNotes.map(note => ({
        ...note,
        userId: userId,
      }));

      await syncNotesToSupabase(notesWithUser);
      await NotesStorage.markAsSynced(unsyncedNotes.map(n => n.id));
    }

    // Update sync status
    await NotesStorage.setLastSyncTime(Date.now());
    await NotesStorage.setSyncStatus({
      status: 'success',
      message: 'Sync complete',
      lastSync: Date.now()
    });

    console.log('YouTube Notes: Full sync complete');

    // Notify all tabs about sync completion
    broadcastMessage({ type: 'SYNC_COMPLETE' });
  } catch (error) {
    console.error('Full sync failed:', error);
    await NotesStorage.setSyncStatus({
      status: 'error',
      message: error instanceof Error ? error.message : 'Sync failed'
    });
  }
}

/**
 * Sync unsynced notes to Supabase (one-way push)
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

        case 'SYNC_COMPLETE':
          // Manual sync triggered from popup
          const user = await NotesStorage.getUser();
          if (user) {
            await performFullSync(user.id);
          }
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
