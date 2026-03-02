/*
  # Create blocked_ranges table

  1. New Tables
    - `blocked_ranges`
      - `id` (uuid, primary key)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
      - `reason` (text, nullable)
      - `created_at` (timestamptz)

  2. Seed Data
    - Insert default blocked range (July 1-7)

  3. Security
    - Enable RLS on blocked_ranges table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS blocked_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM blocked_ranges WHERE reason = 'Default July Block') THEN
    INSERT INTO blocked_ranges (start_date, end_date, reason)
    VALUES (
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months',
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months 6 days',
      'Default July Block'
    );
  END IF;
END $$;

ALTER TABLE blocked_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read blocked_ranges"
  ON blocked_ranges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert blocked_ranges"
  ON blocked_ranges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update blocked_ranges"
  ON blocked_ranges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete blocked_ranges"
  ON blocked_ranges FOR DELETE
  TO authenticated
  USING (true);