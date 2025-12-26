/**
 * Chrome Identity API authentication helper
 * Uses chrome.identity.launchWebAuthFlow for proper OAuth in extensions
 */

/**
 * Convert a string to a deterministic UUID v5-like format
 * This ensures Google IDs can be used as Supabase UUIDs
 */
function stringToUUID(str: string): string {
  // Create a simple hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to a positive number and pad
  const positiveHash = Math.abs(hash).toString(16).padStart(8, '0');

  // Generate additional segments from the string
  const segment1 = positiveHash.substring(0, 8);
  const segment2 = str.substring(0, 4).split('').map(c => c.charCodeAt(0).toString(16)).join('').substring(0, 4);
  const segment3 = str.substring(4, 8).split('').map(c => c.charCodeAt(0).toString(16)).join('').substring(0, 4);
  const segment4 = str.substring(8, 12).split('').map(c => c.charCodeAt(0).toString(16)).join('').substring(0, 4);
  const segment5 = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0).toString(16).padStart(12, '0').substring(0, 12);

  return `${segment1}-${segment2.padEnd(4, '0')}-${segment3.padEnd(4, '0')}-${segment4.padEnd(4, '0')}-${segment5}`;
}

/**
 * Sign in with Google using Chrome Identity API
 * This will show the proper Google OAuth popup
 */
export async function signInWithChromeIdentity(): Promise<any> {
  try {
    console.log('Attempting to get Chrome auth token...');

    // Get OAuth token using Chrome Identity API
    const token = await new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome Identity API error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else if (token) {
          console.log('Token received successfully');
          resolve(token);
        } else {
          console.error('No token received from Chrome Identity API');
          reject(new Error('No token received'));
        }
      });
    });

    console.log('Fetching user info from Google...');

    // Get user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user info. Status:', response.status);
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    console.log('User info retrieved:', userInfo.email);

    // Convert Google ID to UUID format for Supabase compatibility
    const supabaseUserId = stringToUUID(userInfo.id);
    console.log('Google ID converted to UUID:', supabaseUserId);

    return {
      token,
      user: {
        id: supabaseUserId,
        googleId: userInfo.id, // Keep original Google ID for reference
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
      },
    };
  } catch (error) {
    console.error('Chrome Identity sign in failed:', error);

    // Provide more specific error messages
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || String(error);
      if (errorMessage.includes('OAuth2 not granted or revoked')) {
        throw new Error('Please grant permission to access your Google account');
      } else if (errorMessage.includes('User did not approve access')) {
        throw new Error('You cancelled the sign-in process');
      }
    }

    throw new Error('Sign in failed. Please check the console for details.');
  }
}

/**
 * Sign out and remove cached token
 */
export async function signOutChromeIdentity(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        // Remove the cached token
        chrome.identity.removeCachedAuthToken({ token }, () => {
          // Revoke the token
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
            .then(() => resolve())
            .catch(() => resolve()); // Resolve anyway if revoke fails
        });
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get current cached token (if any)
 */
export async function getCachedToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError || !token) {
        resolve(null);
      } else {
        resolve(token);
      }
    });
  });
}
