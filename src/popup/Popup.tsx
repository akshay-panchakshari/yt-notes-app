import React, { useState, useEffect } from 'react';
import { NotesStorage } from '@/utils/storage';
import { signOutChromeIdentity } from '@/utils/chromeAuth';
import { isSupabaseConfigured } from '@/utils/supabase';
import { performGoogleAuth } from '@/utils/authHandler';

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
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const result = await chrome.storage.local.get('oauth_in_progress');
      const oauthInProgress = result.oauth_in_progress;

      if (oauthInProgress) {
        setSigningIn(true);
      }

      await loadUserWithRetry();
      await loadSyncStatus();

      if (oauthInProgress) {
        await chrome.storage.local.remove('oauth_in_progress');
      }

      setLoading(false);
      setSigningIn(false);
    };
    initialize();

    // Listen for auth completion from background or other contexts
    const handleMessage = (message: any) => {
      if (message.type === 'AUTH_COMPLETE' && message.user) {
        setUser(message.user);
        setSigningIn(false);
        loadSyncStatus();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.yt_user) {
        loadUserWithRetry(1, 0);
        loadSyncStatus();
        setSigningIn(false);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadUserWithRetry = async (retries = 2, delay = 100) => {
    for (let i = 0; i < retries; i++) {
      try {
        const currentUser = await NotesStorage.getUser();

        if (currentUser) {
          setUser(currentUser);
          return;
        }

        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          setUser(null);
        }
      } catch (err) {
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
      // Silent fail - non-critical
    }
  };

  const handleSignIn = async () => {
    setError(null);
    chrome.storage.local.set({ oauth_in_progress: true });
    setSigningIn(true);

    try {
      const authResult = await performGoogleAuth();
      chrome.storage.local.remove('oauth_in_progress');
      setSigningIn(false);
      setUser(authResult.user);

      chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' }).catch(() => {});

      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTH_STATUS_CHANGED' }).catch(() => {});
        }
      });

      setTimeout(() => {
        loadSyncStatus().catch(() => {});
      }, 1000);

    } catch (err) {
      chrome.storage.local.remove('oauth_in_progress');
      setSigningIn(false);
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

      setUser(null);
      setSyncStatus(null);
      setLastSync(0);

      await chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' });

      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTH_STATUS_CHANGED' }).catch(() => {});
        }
      });
    } catch (err) {
      setError('Sign out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    try {
      await chrome.runtime.sendMessage({ type: 'SYNC_COMPLETE' });
      setTimeout(async () => {
        await loadSyncStatus();
        setSyncing(false);
      }, 1500);
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

