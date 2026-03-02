/*
  # Create schedule_settings table

  1. New Tables
    - `schedule_settings`
      - `id` (uuid, primary key)
      - `season_start_month` (integer, default 5 for May)
      - `season_start_day` (integer, default 15)
      - `season_end_month` (integer, default 9 for September)
      - `season_end_day` (integer, default 15)
      - `max_per_day` (integer, default 4)
      - `updated_at` (timestamptz)

  2. Seed Data
    - Insert default settings (May 15 - Sep 15, max 4 per day)

  3. Security
    - Enable RLS on schedule_settings table
    - Add policies for authenticated users to read and update
*/

CREATE TABLE IF NOT EXISTS schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_start_month integer DEFAULT 5,
  season_start_day integer DEFAULT 15,
  season_end_month integer DEFAULT 9,
  season_end_day integer DEFAULT 15,
  max_per_day integer DEFAULT 4,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO schedule_settings (season_start_month, season_start_day, season_end_month, season_end_day, max_per_day)
VALUES (5, 15, 9, 15, 4)
ON CONFLICT DO NOTHING;

ALTER TABLE schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read schedule_settings"
  ON schedule_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update schedule_settings"
  ON schedule_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);