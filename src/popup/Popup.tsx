import React, { useState, useEffect } from 'react';
import { NotesStorage } from '@/utils/storage';
import { signInWithGoogle, signOut } from '@/utils/supabase';

/**
 * Extension popup UI
 * Handles authentication and displays sync status
 */
const Popup: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await NotesStorage.getUser();
      setUser(currentUser);
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Notify background script
      await chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' });
      await loadUser();
    } catch (err) {
      setError('Sign in failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      await NotesStorage.clearUser();
      await chrome.runtime.sendMessage({ type: 'AUTH_STATUS_CHANGED' });
      setUser(null);
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
      await chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' });
      // Wait a bit for sync to complete
      setTimeout(() => {
        setSyncing(false);
      }, 2000);
    } catch (err) {
      setError('Sync failed. Please try again.');
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

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

            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="btn btn-primary"
            >
              {syncing ? 'Syncing...' : '🔄 Sync Now'}
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
              Sign in to sync your notes across devices
            </p>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="btn btn-primary"
            >
              Sign in with Google
            </button>
            <p className="auth-note">
              Notes are saved locally by default. Sign in is optional.
            </p>
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

