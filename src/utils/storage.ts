import { Note } from '@/types';

const STORAGE_KEYS = {
  NOTES: 'yt_notes',
  USER: 'yt_user',
  SYNC_STATUS: 'yt_sync_status',
  LAST_SYNC: 'yt_last_sync',
} as const;

/**
 * Storage abstraction layer using chrome.storage.local
 * Provides offline-first storage with type safety
 */
export class NotesStorage {
  /**
   * Get all notes for a specific video
   */
  static async getNotesForVideo(videoId: string): Promise<Note[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.NOTES);
    const allNotes: Record<string, Note[]> = result[STORAGE_KEYS.NOTES] || {};
    return allNotes[videoId] || [];
  }

  /**
   * Save notes for a specific video
   */
  static async saveNotesForVideo(videoId: string, notes: Note[]): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.NOTES);
    const allNotes: Record<string, Note[]> = result[STORAGE_KEYS.NOTES] || {};
    allNotes[videoId] = notes;
    await chrome.storage.local.set({ [STORAGE_KEYS.NOTES]: allNotes });
  }

  /**
   * Add a new note
   */
  static async addNote(note: Note): Promise<Note> {
    const notes = await this.getNotesForVideo(note.videoId);
    notes.push(note);
    // Sort by timestamp ascending
    notes.sort((a, b) => a.timestamp - b.timestamp);
    await this.saveNotesForVideo(note.videoId, notes);
    return note;
  }

  /**
   * Update an existing note
   */
  static async updateNote(videoId: string, noteId: string, updates: Partial<Note>): Promise<Note | null> {
    const notes = await this.getNotesForVideo(videoId);
    const index = notes.findIndex(n => n.id === noteId);

    if (index === -1) return null;

    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: Date.now(),
      synced: false, // Mark as unsynced when updated
    };

    await this.saveNotesForVideo(videoId, notes);
    return notes[index];
  }

  /**
   * Delete a note
   */
  static async deleteNote(videoId: string, noteId: string): Promise<boolean> {
    const notes = await this.getNotesForVideo(videoId);
    const filtered = notes.filter(n => n.id !== noteId);

    if (filtered.length === notes.length) return false;

    await this.saveNotesForVideo(videoId, filtered);
    return true;
  }

  /**
   * Get all notes across all videos (for syncing)
   */
  static async getAllNotes(): Promise<Record<string, Note[]>> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.NOTES);
    return result[STORAGE_KEYS.NOTES] || {};
  }

  /**
   * Get all unsynced notes
   */
  static async getUnsyncedNotes(): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    const unsynced: Note[] = [];

    Object.values(allNotes).forEach(videoNotes => {
      videoNotes.forEach(note => {
        if (!note.synced) {
          unsynced.push(note);
        }
      });
    });

    return unsynced;
  }

  /**
   * Mark notes as synced
   */
  static async markAsSynced(noteIds: string[]): Promise<void> {
    const allNotes = await this.getAllNotes();

    Object.entries(allNotes).forEach(([videoId, notes]) => {
      notes.forEach(note => {
        if (noteIds.includes(note.id)) {
          note.synced = true;
        }
      });
    });

    await chrome.storage.local.set({ [STORAGE_KEYS.NOTES]: allNotes });
  }

  /**
   * Get current user
   */
  static async getUser(): Promise<any> {
    console.log('📦 [Storage] getUser() called');
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
    const user = result[STORAGE_KEYS.USER] || null;
    console.log('📦 [Storage] getUser() result:', user);
    return user;
  }

  /**
   * Save current user
   */
  static async saveUser(user: any): Promise<void> {
    console.log('📦 [Storage] saveUser() called with:', user);
    await chrome.storage.local.set({ [STORAGE_KEYS.USER]: user });
    console.log('📦 [Storage] saveUser() completed - user saved to storage');

    // Verify it was saved
    const verification = await chrome.storage.local.get(STORAGE_KEYS.USER);
    console.log('📦 [Storage] saveUser() verification - data in storage:', verification[STORAGE_KEYS.USER]);
  }

  /**
   * Clear user (logout)
   */
  static async clearUser(): Promise<void> {
    console.log('📦 [Storage] clearUser() called');
    await chrome.storage.local.remove(STORAGE_KEYS.USER);
    console.log('📦 [Storage] clearUser() completed');
  }

  /**
   * Merge local and remote notes intelligently
   * Remote notes take precedence if they're newer
   */
  static async mergeNotes(remoteNotes: Record<string, Note[]>): Promise<void> {
    const localNotes = await this.getAllNotes();
    const merged: Record<string, Note[]> = {};

    // Start with all local notes
    Object.entries(localNotes).forEach(([videoId, notes]) => {
      merged[videoId] = [...notes];
    });

    // Merge in remote notes
    Object.entries(remoteNotes).forEach(([videoId, remoteVideoNotes]) => {
      if (!merged[videoId]) {
        // No local notes for this video, use all remote notes
        merged[videoId] = remoteVideoNotes;
      } else {
        // Merge local and remote notes
        const localVideoNotes = merged[videoId];
        const localNotesMap = new Map(localVideoNotes.map(n => [n.id, n]));

        remoteVideoNotes.forEach(remoteNote => {
          const localNote = localNotesMap.get(remoteNote.id);

          if (!localNote) {
            // New note from remote, add it
            localVideoNotes.push(remoteNote);
          } else if (remoteNote.updatedAt > localNote.updatedAt) {
            // Remote note is newer, replace local
            const index = localVideoNotes.findIndex(n => n.id === remoteNote.id);
            if (index !== -1) {
              localVideoNotes[index] = remoteNote;
            }
          }
          // If local is newer or same, keep local version
        });

        // Sort by timestamp
        localVideoNotes.sort((a, b) => a.timestamp - b.timestamp);
        merged[videoId] = localVideoNotes;
      }
    });

    // Save merged notes
    await chrome.storage.local.set({ [STORAGE_KEYS.NOTES]: merged });
  }

  /**
   * Replace all notes with synced notes from server
   */
  static async replaceAllNotes(notes: Record<string, Note[]>): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.NOTES]: notes });
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTime(): Promise<number> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC);
    return result[STORAGE_KEYS.LAST_SYNC] || 0;
  }

  /**
   * Set last sync timestamp
   */
  static async setLastSyncTime(timestamp: number): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.LAST_SYNC]: timestamp });
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<any> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SYNC_STATUS);
    return result[STORAGE_KEYS.SYNC_STATUS] || null;
  }

  /**
   * Set sync status
   */
  static async setSyncStatus(status: any): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: status });
  }
}
