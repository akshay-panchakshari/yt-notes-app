/**
 * Generate a unique ID for notes
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /\/embed\/([^?]+)/,
    /\/watch\/([^?]+)/,
    /youtu\.be\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get current video ID from YouTube page
 */
export function getCurrentVideoId(): string | null {
  return extractVideoId(window.location.href);
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get YouTube video player element
 */
export function getVideoPlayer(): HTMLVideoElement | null {
  return document.querySelector('video.html5-main-video');
}

/**
 * Get current playback time from YouTube video
 */
export function getCurrentTimestamp(): number {
  const player = getVideoPlayer();
  return player ? Math.floor(player.currentTime) : 0;
}

/**
 * Seek video to specific timestamp
 */
export function seekToTimestamp(timestamp: number): void {
  const player = getVideoPlayer();
  if (player) {
    player.currentTime = timestamp;
    // Ensure video plays after seeking
    if (player.paused) {
      player.play().catch(() => {
        // User interaction may be required, silent fail
      });
    }
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

