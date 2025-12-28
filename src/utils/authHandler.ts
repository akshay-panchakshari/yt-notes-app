/**
 * Centralized auth handler that works across all extension contexts
 * This ensures auth persists even if popup closes
 */

import { stringToUUID } from './chromeAuth';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    googleId: string;
    email: string;
    name: string;
    avatar: string;
  };
}

/**
 * Perform Google OAuth and save user data immediately
 * This function ensures data is saved even if the calling context closes
 */
export async function performGoogleAuth(): Promise<AuthResult> {
  try {
    const token = await new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (token) {
          resolve(token);
        } else {
          reject(new Error('No token received'));
        }
      });
    });

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();

    const user = {
      id: stringToUUID(userInfo.id),
      googleId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
    };

    await chrome.storage.local.set({ yt_user: user });
    await chrome.storage.local.remove('oauth_in_progress');

    chrome.runtime.sendMessage({
      type: 'AUTH_COMPLETE',
      user
    }).catch(() => {});

    return { token, user };
  } catch (error) {
    await chrome.storage.local.remove('oauth_in_progress');
    throw error;
  }
}
