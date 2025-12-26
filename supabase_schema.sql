-- YouTube Notes - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the notes table

-- Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_video_id ON notes(video_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_video ON notes(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Since we're using Chrome Identity API (not Supabase Auth), we need to allow
-- authenticated requests through the anon key with user_id validation on the client side
-- This policy allows all operations for now - you can restrict this further if needed

-- Policy: Allow all operations (client-side validation with anon key)
CREATE POLICY "Allow all operations with anon key"
  ON notes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: This is a permissive policy. In production, you might want to:
-- 1. Use Supabase Auth instead of Chrome Identity
-- 2. Implement server-side validation with Edge Functions
-- 3. Add additional security layers

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
