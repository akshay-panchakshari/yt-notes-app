import React, { useState, useRef, useEffect } from 'react';

interface NoteEditorProps {
  initialText?: string;
  onSave: (text: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
}

/**
 * Note editor component with textarea
 */
const NoteEditor: React.FC<NoteEditorProps> = ({
  initialText = '',
  onSave,
  onCancel,
  placeholder = 'Write your note here...',
  submitLabel = 'Add Note',
}) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop all keyboard events from reaching YouTube
    e.stopPropagation();

    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Stop propagation for all key presses to prevent YouTube shortcuts
    e.stopPropagation();
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Stop propagation for key up events as well
    e.stopPropagation();
  };

  return (
    <form onSubmit={handleSubmit} className="ytn-note-editor">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyPress={handleKeyPress}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        className="ytn-textarea"
        rows={3}
      />
      <div className="ytn-editor-actions">
        <button
          type="submit"
          className="ytn-btn ytn-btn-primary"
          disabled={!text.trim()}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="ytn-btn ytn-btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
      <p className="ytn-text-xs ytn-text-gray-500 ytn-mt-1 ytn-mb-0">
        Tip: Press Cmd/Ctrl + Enter to save
      </p>
    </form>
  );
};

export default NoteEditor;
