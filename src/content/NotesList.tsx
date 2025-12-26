import React from 'react';
import { Note } from '@/types';
import { formatTimestamp } from '@/utils/youtube';

interface NotesListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

/**
 * List of notes with timestamps
 */
const NotesList: React.FC<NotesListProps> = ({ notes, onNoteClick, onEdit, onDelete }) => {
  if (notes.length === 0) {
    return (
      <div className="ytn-empty-state">
        <p className="ytn-text-sm ytn-text-gray-400">
          No notes yet. Click "Add Note" to create your first timestamped note!
        </p>
      </div>
    );
  }

  return (
    <div className="ytn-notes-list">
      {notes.map((note) => (
        <div key={note.id} className="ytn-note-item">
          <button
            className="ytn-timestamp-btn"
            onClick={() => onNoteClick(note)}
            title="Jump to this timestamp"
          >
            {formatTimestamp(note.timestamp)}
          </button>
          <div className="ytn-note-content">
            <p className="ytn-note-text">{note.text}</p>
            <div className="ytn-note-actions">
              <button
                className="ytn-action-btn ytn-edit-btn"
                onClick={() => onEdit(note)}
                title="Edit note"
              >
                ✏️ Edit
              </button>
              <button
                className="ytn-action-btn ytn-delete-btn"
                onClick={() => {
                  if (confirm('Delete this note?')) {
                    onDelete(note.id);
                  }
                }}
                title="Delete note"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
          {!note.synced && (
            <div className="ytn-sync-indicator" title="Not synced">
              ⚠️
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotesList;

