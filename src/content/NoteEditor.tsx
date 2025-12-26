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

    // Submit on plain Enter (without modifier keys)
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    // Allow Cmd/Ctrl + Enter to insert new line (default textarea behavior)
    // Don't prevent default for this case, let the textarea handle it
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
        Tip: Press Enter to save or Cmd/Ctrl + Enter for new line
      </p>
    </form>
  );
};

export default NoteEditor;
