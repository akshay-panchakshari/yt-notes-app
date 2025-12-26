import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Note } from '@/types';

// These would be injected via environment variables in production
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Initialize Supabase client (lazy initialization)
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  if (!supabaseClient) {
    throw new Error('Supabase not configured');
  }

  return supabaseClient;
}

/**
 * Sync local notes to Supabase
 */
export async function syncNotesToSupabase(notes: Note[]): Promise<void> {
  const client = getSupabaseClient();

  // Upsert notes (insert or update if exists)
  const { error } = await client
    .from('notes')
    .upsert(
      notes.map(note => ({
        id: note.id,
        video_id: note.videoId,
        timestamp: note.timestamp,
        text: note.text,
        created_at: new Date(note.createdAt).toISOString(),
        updated_at: new Date(note.updatedAt).toISOString(),
        user_id: note.userId,
      })),
      { onConflict: 'id' }
    );

  if (error) {
    throw new Error(`Sync failed: ${error.message}`);
  }
}

/**
 * Fetch notes from Supabase for a specific video
 */
export async function fetchNotesFromSupabase(
  userId: string,
  videoId: string
): Promise<Note[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .order('timestamp', { ascending: true });

  if (error) {
    throw new Error(`Fetch failed: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    videoId: row.video_id,
    timestamp: row.timestamp,
    text: row.text,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    userId: row.user_id,
    synced: true,
  }));
}

/**
 * Fetch all notes from Supabase for a user
 */
export async function fetchAllNotesFromSupabase(userId: string): Promise<Record<string, Note[]>> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });

  if (error) {
    throw new Error(`Fetch failed: ${error.message}`);
  }

  // Group notes by video ID
  const notesByVideo: Record<string, Note[]> = {};
  (data || []).forEach(row => {
    const note: Note = {
      id: row.id,
      videoId: row.video_id,
      timestamp: row.timestamp,
      text: row.text,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
      userId: row.user_id,
      synced: true,
    };

    if (!notesByVideo[note.videoId]) {
      notesByVideo[note.videoId] = [];
    }
    notesByVideo[note.videoId].push(note);
  });

  return notesByVideo;
}

/**
 * Delete a note from Supabase
 */
export async function deleteNoteFromSupabase(noteId: string): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<any> {
  const client = getSupabaseClient();

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: chrome.identity.getRedirectURL(),
    },
  });

  if (error) {
    throw new Error(`Auth failed: ${error.message}`);
  }

  return data;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  await client.auth.signOut();
}

/**
 * Get current session
 */
export async function getSession(): Promise<any> {
  const client = getSupabaseClient();
  const { data } = await client.auth.getSession();
  return data.session;
}
