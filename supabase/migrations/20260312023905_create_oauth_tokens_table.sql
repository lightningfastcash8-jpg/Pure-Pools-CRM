/*
  # Create oauth_tokens table

  1. New Tables
    - `oauth_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `provider` (text, gmail/google_calendar)
      - `access_token` (text, encrypted token)
      - `refresh_token` (text, encrypted token)
      - `expires_at` (timestamptz)
      - `scope` (text, OAuth scopes granted)
      - `email` (text, associated email account)
      - `last_synced_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on user_id for quick lookups
    - Index on provider for filtering
    - Unique constraint on (user_id, provider) for upsert operations

  3. Security
    - Enable RLS on oauth_tokens table
    - Add policies for users to manage only their own tokens
*/

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  email text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own oauth_tokens"
  ON oauth_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth_tokens"
  ON oauth_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth_tokens"
  ON oauth_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth_tokens"
  ON oauth_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
