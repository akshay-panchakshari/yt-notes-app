import React, { useState, useEffect } from 'react';
import { NotesStorage } from '@/utils/storage';
import { signInWithChromeIdentity, signOutChromeIdentity } from '@/utils/chromeAuth';
import { isSupabaseConfigured } from '@/utils/supabase';

/**
 * Extension popup UI
 * Handles authentication and displays sync status
 */
const Popup: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [lastSync, setLastSync] = useState<number>(0);

  useEffect(() => {
    console.log('🔵 [Popup] useEffect running - Component mounted/updated');
    console.log('🔵 [Popup] Current user state:', user);

    const initialize = async () => {
      console.log('🔵 [Popup] initialize() started');
      // Add a small delay to ensure storage has been written after OAuth
      console.log('🔵 [Popup] Waiting 100ms before loading user...');
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('🔵 [Popup] Calling loadUserWithRetry()...');
      await loadUserWithRetry();
      console.log('🔵 [Popup] Calling loadSyncStatus()...');
      await loadSyncStatus();
      console.log('🔵 [Popup] Setting loading to false');
      setLoading(false);
      console.log('🔵 [Popup] initialize() completed');
    };
    initialize();

    // Listen for storage changes (when user signs in/out while popup is closed)
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      console.log('🟡 [Popup] Storage change detected:', { areaName, keys: Object.keys(changes) });
      if (areaName === 'local' && changes.yt_user) {
        console.log('🟡 [Popup] yt_user changed:', {
          oldValue: changes.yt_user.oldValue,
          newValue: changes.yt_user.newValue
        });
        console.log('🟡 [Popup] Reloading user from storage...');
        loadUserWithRetry();
        loadSyncStatus();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    console.log('🔵 [Popup] Storage change listener attached');

    // Also check when popup becomes visible (handles case when OAuth completes)
    const handleVisibilityChange = () => {
      console.log('🟢 [Popup] Visibility/focus changed:', {
        hidden: document.hidden,
        hasFocus: document.hasFocus()
      });
      if (!document.hidden) {
        console.log('🟢 [Popup] Popup is visible, checking for user updates...');
        loadUserWithRetry();
        loadSyncStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    console.log('🔵 [Popup] Visibility/focus listeners attached');

    return () => {
      console.log('🔴 [Popup] Cleaning up listeners');
      chrome.storage.onChanged.removeListener(handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  const loadUserWithRetry = async (retries = 3, delay = 200) => {
    for (let i = 0; i < retries; i++) {
      try {
        const currentUser = await NotesStorage.getUser();
        console.log(`loadUser attempt ${i + 1} - User loaded:`, currentUser);
        console.log(`loadUser attempt ${i + 1} - Current state:`, user);

        // If we got a user, update state and return
        if (currentUser) {
          console.log(`🎯 [Popup] Setting user state to:`, currentUser);
          setUser(currentUser);
          console.log(`🎯 [Popup] User state set complete`);
          return;
        }

        // If no user yet and we have retries left, wait and try again
        if (i < retries - 1) {
          console.log(`No user found, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          // Final attempt returned null, user is not logged in
          console.log(`🎯 [Popup] Setting user state to null (not logged in)`);
          setUser(null);
        }
      } catch (err) {
        console.error(`loadUser attempt ${i + 1} - Error:`, err);
        if (i === retries - 1) {
          setError('Failed to load user data');
        }
      }
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await NotesStorage.getSyncStatus();
      const lastSyncTime = await NotesStorage.getLastSyncTime();
      setSyncStatus(status);
      setLastSync(lastSyncTime);
    } catch (err) {
      console.error('Failed to load sync status', err);
    }
  };

  const handleSignIn = async () => {
    // Don't set loading state - the popup will close when OAuth starts
    setError(null);
    try {
      console.log('Starting Google sign in...');

      // Use Chrome Identity API for authentication
      // Note: This will open a new window and the popup will close automatically
      const authResult = await signInWithChromeIdentity();
      console.log('Sign in successful:', authResult.user.email);

      // Save user to storage (this triggers the storage listener in any open popup)
      await NotesStorage.saveUser(authResult.user);
      console.log('User saved to storage');

      // Update local state immediately (if popup is still open)
      setUser(authResult.user);
      console.log('User state updated:', authResult.user);

      // Notify background script
      chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' }).catch(() => {
        console.log('Background script notification failed (popup might be closed)');
      });

      // Notify all content scripts about auth change
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTH_STATUS_CHANGED' }).catch(() => {});
        }
      });

      // Reload sync status after a delay to allow background sync to start
      setTimeout(async () => {
        try {
          await loadSyncStatus();
          console.log('Sync status refreshed after background sync');
        } catch (e) {
          console.log('Could not refresh sync status (popup might be closed)');
        }
      }, 1500);

    } catch (err) {
      console.error('Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(errorMessage);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOutChromeIdentity();
      await NotesStorage.clearUser();

      // Clear local state immediately
      setUser(null);
      setSyncStatus(null);
      setLastSync(0);

      // Notify background script and all tabs
      await chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' });

      // Notify all content scripts about auth change
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTH_STATUS_CHANGED' }).catch(() => {
            // Ignore errors for tabs without content script
          });
        }
      });

      console.log('Sign out complete');
    } catch (err) {
      setError('Sign out failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    try {
      await chrome.runtime.sendMessage({ type: 'SYNC_COMPLETE' });
      // Wait a bit for sync to complete
      setTimeout(async () => {
        await loadSyncStatus();
        setSyncing(false);
      }, 2000);
    } catch (err) {
      setError('Sync failed. Please try again.');
      setSyncing(false);
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const isConfigured = isSupabaseConfigured();

  console.log('🎨 [Popup] RENDER - user state:', user);
  console.log('🎨 [Popup] RENDER - showing UI:', user ? 'SIGNED IN' : 'SIGNED OUT');

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>📝 YouTube Notes</h1>
      </div>

      <div className="popup-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {user ? (
          <div className="user-section">
            <div className="user-info">
              {user.avatar && (
                <img src={user.avatar} alt="Profile" className="user-avatar" />
              )}
              <div>
                <div className="user-name">{user.name || 'User'}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>

            {/* Sync Status */}
            {isConfigured && syncStatus && (
              <div className={`sync-status sync-status-${syncStatus.status}`}>
                {syncStatus.status === 'syncing' && '🔄 Syncing...'}
                {syncStatus.status === 'success' && '✅ Synced'}
                {syncStatus.status === 'error' && '❌ Sync failed'}
                <div className="sync-time">Last sync: {formatLastSync(lastSync)}</div>
              </div>
            )}

            {!isConfigured && (
              <div className="sync-status sync-status-error">
                ⚠️ Sync disabled (Supabase not configured)
              </div>
            )}

            <button
              onClick={handleSyncNow}
              disabled={syncing || !isConfigured}
              className="btn btn-primary"
            >
              {syncing ? 'Syncing...' : isConfigured ? '🔄 Sync Now' : '🔒 Sync Disabled'}
            </button>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="btn btn-secondary"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="auth-section">
            <p className="auth-message">
              ✅ Extension is working in local mode
            </p>
            <p className="auth-note">
              Your notes are being saved locally and will persist across browser sessions.
              All features work without sign-in!
            </p>

            {isConfigured && (
              <>
                <div className="sync-promo">
                  <h4>☁️ Want to sync across devices?</h4>
                  <p>Sign in with Google to automatically sync your notes across all your devices!</p>
                </div>
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  🔐 Sign in with Google
                </button>
              </>
            )}

            {!isConfigured && (
              <div className="setup-info">
                <h4>☁️ Want cloud sync across devices?</h4>
                <p className="setup-description">
                  Set up Google OAuth to sync your notes across all your devices.
                  It's optional but recommended!
                </p>
                <div className="setup-steps-container">
                  <p className="setup-steps-title">📋 Quick Setup Guide:</p>
                  <ol className="setup-list">
                    <li>
                      <strong>Create a Google Cloud Project</strong>
                      <br />
                      <span className="step-detail">Visit <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a> and create a new project</span>
                    </li>
                    <li>
                      <strong>Enable OAuth Credentials</strong>
                      <br />
                      <span className="step-detail">Set up OAuth 2.0 with "Chrome App" type credentials</span>
                    </li>
                    <li>
                      <strong>Update Extension</strong>
                      <br />
                      <span className="step-detail">Add your OAuth Client ID to <code>manifest.json</code></span>
                    </li>
                    <li>
                      <strong>Rebuild & Reload</strong>
                      <br />
                      <span className="step-detail">Run <code>npm run build</code> and reload the extension</span>
                    </li>
                  </ol>
                </div>
                <p className="setup-note">
                  📖 Need detailed instructions? Check the <strong>README.md</strong> file in the extension folder.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="info-section">
          <h3>How to use:</h3>
          <ol>
            <li>Open any YouTube video</li>
            <li>Find the notes panel in the sidebar</li>
            <li>Add timestamped notes while watching</li>
            <li>Click timestamps to jump to that moment</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Popup;

