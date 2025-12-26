import { Note } from '@/types';

const STORAGE_KEYS = {
  NOTES: 'yt_notes',
  USER: 'yt_user',
  SYNC_STATUS: 'yt_sync_status',
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
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
    return result[STORAGE_KEYS.USER] || null;
  }

  /**
   * Save current user
   */
  static async saveUser(user: any): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.USER]: user });
  }

  /**
   * Clear user (logout)
   */
  static async clearUser(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.USER);
  }
}

