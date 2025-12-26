export interface Note {
  id: string;
  videoId: string;
  timestamp: number;
  text: string;
  createdAt: number;
  updatedAt: number;
  userId?: string; // null for local-only notes
  synced: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface SyncStatus {
  lastSyncTime: number;
  pendingSync: number;
  error?: string;
}

export type MessageType =
  | 'GET_VIDEO_INFO'
  | 'SEEK_TO_TIMESTAMP'
  | 'NOTES_UPDATED'
  | 'AUTH_STATUS_CHANGED'
  | 'SYNC_COMPLETE';

export interface ChromeMessage {
  type: MessageType;
  payload?: any;
}

