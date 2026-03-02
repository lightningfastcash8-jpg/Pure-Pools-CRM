/*
  # Create emails_raw table

  1. New Tables
    - `emails_raw`
      - `id` (uuid, primary key)
      - `provider` (text, default 'gmail')
      - `provider_message_id` (text, unique - Gmail message ID)
      - `thread_id` (text, Gmail thread ID)
      - `label_name` (text, label that triggered ingestion)
      - `from_name` (text, sender name)
      - `from_email` (text, sender email)
      - `subject` (text, email subject)
      - `received_at` (timestamptz, when email was received)
      - `body_text` (text, email body content)
      - `raw_json` (jsonb, nullable - full raw email data)
      - `processed_status` (text, default 'new' - new/parsed/needs_review/error)
      - `created_at` (timestamptz, when ingested into CRM)

  2. Indexes
    - Unique index on provider_message_id to prevent duplicates
    - Index on received_at for chronological sorting
    - Index on processed_status for filtering
    - Index on label_name for filtering by source

  3. Security
    - Enable RLS on emails_raw table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS emails_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text DEFAULT 'gmail',
  provider_message_id text UNIQUE NOT NULL,
  thread_id text,
  label_name text,
  from_name text,
  from_email text,
  subject text,
  received_at timestamptz,
  body_text text,
  raw_json jsonb,
  processed_status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emails_raw_received_at ON emails_raw(received_at);
CREATE INDEX IF NOT EXISTS idx_emails_raw_processed_status ON emails_raw(processed_status);
CREATE INDEX IF NOT EXISTS idx_emails_raw_label_name ON emails_raw(label_name);

ALTER TABLE emails_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read emails_raw"
  ON emails_raw FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert emails_raw"
  ON emails_raw FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update emails_raw"
  ON emails_raw FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete emails_raw"
  ON emails_raw FOR DELETE
  TO authenticated
  USING (true);