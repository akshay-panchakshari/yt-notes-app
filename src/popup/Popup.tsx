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
    const initialize = async () => {
      await loadUser();
      await loadSyncStatus();
      setLoading(false);
    };
    initialize();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await NotesStorage.getUser();
      console.log('loadUser - User loaded:', currentUser);
      setUser(currentUser);
    } catch (err) {
      console.error('loadUser - Error:', err);
      setError('Failed to load user data');
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
    setLoading(true);
    setError(null);
    try {
      console.log('Starting Google sign in...');

      // Use Chrome Identity API for authentication
      const authResult = await signInWithChromeIdentity();
      console.log('Sign in successful:', authResult.user.email);

      // Save user to storage
      await NotesStorage.saveUser(authResult.user);
      console.log('User saved to storage');

      // Update local state immediately
      setUser(authResult.user);
      console.log('User state updated:', authResult.user);

      // Reload user and sync status
      await loadUser();
      console.log('User reloaded from storage');

      await loadSyncStatus();
      console.log('Sync status loaded');

      // Notify background script
      await chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' });
      console.log('Background script notified');

      // Wait a moment for background sync to start
      setTimeout(async () => {
        await loadSyncStatus();
        console.log('Sync status refreshed after background sync');
      }, 1000);

      // Notify all content scripts about auth change
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTH_STATUS_CHANGED' }).catch(() => {
            // Ignore errors for tabs without content script
          });
        }
      });
      console.log('All tabs notified');

    } catch (err) {
      console.error('Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('Sign in process complete, loading state:', loading);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOutChromeIdentity();
      await NotesStorage.clearUser();
      await chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' });
      setUser(null);
      setSyncStatus(null);
      setLastSync(0);
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
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="btn btn-primary"
              >
                🔐 Sign in with Google
              </button>
            )}

            <div className="setup-info">
              <h4>Want to enable cloud sync?</h4>
              <p className="setup-steps">
                Follow these steps to set up Google OAuth:
              </p>
              <ol className="setup-list">
                <li>Create a Google Cloud project</li>
                <li>Set up OAuth credentials (Chrome App type)</li>
                <li>Update manifest.json with your client ID</li>
                <li>Rebuild and reload the extension</li>
              </ol>
              <p className="setup-note">
                See README.md for detailed instructions.
              </p>
            </div>
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

