import React, { useState, useEffect, useRef } from 'react';
import { Note } from '@/types';
import { NotesStorage } from '@/utils/storage';
import { getCurrentVideoId, getCurrentTimestamp, seekToTimestamp, formatTimestamp } from '@/utils/youtube';
import { generateId } from '@/utils/youtube';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';

/**
 * Main Notes Panel Component
 * Isolated UI that doesn't interfere with YouTube's native UI
 */
const NotesPanel: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [user, setUser] = useState<any>(null);

  // Load notes when video changes
  useEffect(() => {
    const currentVideoId = getCurrentVideoId();
    if (currentVideoId && currentVideoId !== videoId) {
      setVideoId(currentVideoId);
      loadNotes(currentVideoId);
    }
  }, []);

  // Listen for URL changes (YouTube is a SPA)
  useEffect(() => {
    const handleUrlChange = () => {
      const currentVideoId = getCurrentVideoId();
      if (currentVideoId && currentVideoId !== videoId) {
        setVideoId(currentVideoId);
        loadNotes(currentVideoId);
      }
    };

    // YouTube uses pushState/replaceState for navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [videoId]);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await NotesStorage.getUser();
    setUser(currentUser);
  };

  const loadNotes = async (vid: string) => {
    const loadedNotes = await NotesStorage.getNotesForVideo(vid);
    setNotes(loadedNotes);
  };

  const handleAddNote = async (text: string) => {
    if (!videoId || !text.trim()) return;

    const timestamp = getCurrentTimestamp();
    const newNote: Note = {
      id: generateId(),
      videoId,
      timestamp,
      text: text.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: user?.id,
      synced: false,
    };

    await NotesStorage.addNote(newNote);
    await loadNotes(videoId);

    // Notify background script to sync
    chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' });
  };

  const handleUpdateNote = async (noteId: string, text: string) => {
    if (!videoId || !text.trim()) return;

    await NotesStorage.updateNote(videoId, noteId, { text: text.trim() });
    await loadNotes(videoId);
    setEditingNote(null);

    chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!videoId) return;

    await NotesStorage.deleteNote(videoId, noteId);
    await loadNotes(videoId);

    chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' });
  };

  const handleNoteClick = (note: Note) => {
    seekToTimestamp(note.timestamp);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  if (!videoId) {
    return null;
  }

  return (
    <div className="ytn-notes-container">
      <div className="ytn-notes-header">
        <div className="ytn-flex ytn-items-center ytn-justify-between">
          <h3 className="ytn-text-base ytn-font-semibold ytn-m-0">
            📝 Notes {notes.length > 0 && `(${notes.length})`}
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ytn-collapse-btn"
            aria-label={isCollapsed ? 'Expand notes' : 'Collapse notes'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
        {!user && !isCollapsed && (
          <p className="ytn-text-xs ytn-text-gray-400 ytn-mt-2 ytn-mb-0">
            Notes are saved locally. Sign in to sync across devices.
          </p>
        )}
      </div>

      {!isCollapsed && (
        <div className="ytn-notes-content">
          {editingNote ? (
            <NoteEditor
              initialText={editingNote.text}
              onSave={(text) => handleUpdateNote(editingNote.id, text)}
              onCancel={handleCancelEdit}
              submitLabel="Update Note"
            />
          ) : (
            <NoteEditor
              onSave={handleAddNote}
              placeholder="Add a note at the current timestamp..."
            />
          )}

          <NotesList
            notes={notes}
            onNoteClick={handleNoteClick}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
          />
        </div>
      )}
    </div>
  );
};

export default NotesPanel;

