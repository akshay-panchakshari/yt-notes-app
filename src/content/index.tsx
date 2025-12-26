import React from 'react';
import ReactDOM from 'react-dom/client';
import NotesPanel from './NotesPanel';

/**
 * Content script that injects the Notes UI into YouTube
 * Uses Shadow DOM for complete isolation from YouTube's styles
 */

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;

/**
 * Find the best insertion point for the notes panel
 * We insert below the video secondary info (description area)
 */
function findInsertionPoint(): HTMLElement | null {
  // Wait for YouTube's secondary element to load
  // This is the area below the video with title, channel, description
  const secondary = document.querySelector('#secondary');
  return secondary as HTMLElement;
}

/**
 * Inject the notes panel UI into YouTube
 */
function injectNotesPanel() {
  // Check if already injected
  if (document.getElementById('yt-notes-root')) {
    return;
  }

  const insertionPoint = findInsertionPoint();
  if (!insertionPoint) {
    console.log('YouTube Notes: Insertion point not found, retrying...');
    setTimeout(injectNotesPanel, 1000);
    return;
  }

  // Create container for our shadow root
  const container = document.createElement('div');
  container.id = 'yt-notes-root';
  container.style.cssText = 'width: 100%; margin: 16px 0;';

  // Insert at the top of the secondary column (sidebar)
  insertionPoint.insertBefore(container, insertionPoint.firstChild);

  // Create shadow root for complete style isolation
  shadowRoot = container.attachShadow({ mode: 'open' });

  // Create a div inside shadow root for React
  const shadowContainer = document.createElement('div');
  shadowRoot.appendChild(shadowContainer);

  // Inject styles into shadow root
  const styleElement = document.createElement('style');
  styleElement.textContent = getInjectedStyles();
  shadowRoot.appendChild(styleElement);

  // Mount React app
  reactRoot = ReactDOM.createRoot(shadowContainer);
  reactRoot.render(<NotesPanel />);

  console.log('YouTube Notes: UI injected successfully');
}

/**
 * Get styles to inject into shadow DOM
 * These styles are completely isolated and won't affect YouTube
 */
function getInjectedStyles(): string {
  return `
    * {
      box-sizing: border-box;
    }

    .ytn-notes-container {
      background: #0f0f0f;
      border: 1px solid #3f3f3f;
      border-radius: 12px;
      overflow: hidden;
      font-family: "Roboto", "Arial", sans-serif;
      color: #f1f1f1;
      max-height: 600px;
      display: flex;
      flex-direction: column;
    }

    .ytn-notes-header {
      padding: 16px;
      border-bottom: 1px solid #3f3f3f;
      background: #181818;
      flex-shrink: 0;
    }

    .ytn-flex {
      display: flex;
    }

    .ytn-items-center {
      align-items: center;
    }

    .ytn-justify-between {
      justify-content: space-between;
    }

    .ytn-text-base {
      font-size: 14px;
      line-height: 20px;
    }

    .ytn-text-xs {
      font-size: 12px;
      line-height: 16px;
    }

    .ytn-text-sm {
      font-size: 13px;
      line-height: 18px;
    }

    .ytn-font-semibold {
      font-weight: 600;
    }

    .ytn-text-gray-400 {
      color: #aaaaaa;
    }

    .ytn-text-gray-500 {
      color: #888888;
    }

    .ytn-m-0 {
      margin: 0;
    }

    .ytn-mt-1 {
      margin-top: 4px;
    }

    .ytn-mt-2 {
      margin-top: 8px;
    }

    .ytn-mb-0 {
      margin-bottom: 0;
    }

    .ytn-collapse-btn {
      background: transparent;
      border: none;
      color: #aaaaaa;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .ytn-collapse-btn:hover {
      background: #3f3f3f;
      color: #f1f1f1;
    }

    .ytn-notes-content {
      padding: 16px;
      overflow-y: auto;
      max-height: 500px;
    }

    /* Custom scrollbar for notes content */
    .ytn-notes-content::-webkit-scrollbar {
      width: 8px;
    }

    .ytn-notes-content::-webkit-scrollbar-track {
      background: #0f0f0f;
    }

    .ytn-notes-content::-webkit-scrollbar-thumb {
      background: #3f3f3f;
      border-radius: 4px;
    }

    .ytn-notes-content::-webkit-scrollbar-thumb:hover {
      background: #4f4f4f;
    }

    .ytn-note-editor {
      margin-bottom: 16px;
    }

    .ytn-textarea {
      width: 100%;
      padding: 12px;
      background: #272727;
      border: 1px solid #3f3f3f;
      border-radius: 8px;
      color: #f1f1f1;
      font-family: inherit;
      font-size: 13px;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }

    .ytn-textarea:focus {
      border-color: #3ea6ff;
    }

    .ytn-textarea::placeholder {
      color: #717171;
    }

    .ytn-editor-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .ytn-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 18px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .ytn-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ytn-btn-primary {
      background: #3ea6ff;
      color: #0f0f0f;
    }

    .ytn-btn-primary:hover:not(:disabled) {
      background: #4ba7ff;
    }

    .ytn-btn-secondary {
      background: transparent;
      color: #aaaaaa;
      border: 1px solid #3f3f3f;
    }

    .ytn-btn-secondary:hover {
      background: #3f3f3f;
      color: #f1f1f1;
    }

    .ytn-notes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }

    .ytn-empty-state {
      padding: 32px 16px;
      text-align: center;
    }

    .ytn-note-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #272727;
      border-radius: 8px;
      border: 1px solid #3f3f3f;
      transition: border-color 0.2s;
      position: relative;
    }

    .ytn-note-item:hover {
      border-color: #4f4f4f;
    }

    .ytn-timestamp-btn {
      flex-shrink: 0;
      padding: 4px 8px;
      background: #3ea6ff;
      color: #0f0f0f;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Roboto Mono', monospace;
      height: fit-content;
      transition: background 0.2s;
    }

    .ytn-timestamp-btn:hover {
      background: #4ba7ff;
    }

    .ytn-note-content {
      flex: 1;
      min-width: 0;
    }

    .ytn-note-text {
      margin: 0 0 8px 0;
      font-size: 13px;
      line-height: 1.5;
      color: #f1f1f1;
      word-wrap: break-word;
      word-break: break-word;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }

    .ytn-note-actions {
      display: flex;
      gap: 8px;
    }

    .ytn-action-btn {
      padding: 4px 8px;
      background: transparent;
      border: 1px solid #3f3f3f;
      border-radius: 4px;
      color: #aaaaaa;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ytn-action-btn:hover {
      background: #3f3f3f;
      color: #f1f1f1;
      border-color: #4f4f4f;
    }

    .ytn-sync-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 12px;
    }
  `;
}

/**
 * Clean up when navigating away
 */
function cleanup() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  const container = document.getElementById('yt-notes-root');
  if (container) {
    container.remove();
  }

  shadowRoot = null;
}

/**
 * Observe URL changes and re-inject if needed
 */
function observeNavigation() {
  let currentUrl = window.location.href;

  const checkUrlChange = () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;

      // If we're on a watch page, ensure UI is injected
      if (window.location.pathname === '/watch') {
        // Small delay to let YouTube render
        setTimeout(() => {
          if (!document.getElementById('yt-notes-root')) {
            injectNotesPanel();
          }
        }, 500);
      } else {
        // Clean up if we navigate away from watch page
        cleanup();
      }
    }
  };

  // Check periodically (YouTube is a SPA)
  setInterval(checkUrlChange, 1000);
}

/**
 * Initialize content script
 */
function initialize() {
  console.log('YouTube Notes: Content script loaded');

  // Only inject on watch pages
  if (window.location.pathname === '/watch') {
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectNotesPanel, 1000);
      });
    } else {
      setTimeout(injectNotesPanel, 1000);
    }
  }

  // Observe navigation changes
  observeNavigation();
}

// Start the extension
initialize();
