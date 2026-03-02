/*
  # Create report_photos table

  1. New Tables
    - `report_photos`
      - `id` (uuid, primary key)
      - `report_id` (uuid, foreign key to service_reports)
      - `storage_path` (text, path in Supabase Storage)
      - `caption` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on report_photos table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS report_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES service_reports(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_photos_report_id ON report_photos(report_id);

ALTER TABLE report_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read report_photos"
  ON report_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert report_photos"
  ON report_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update report_photos"
  ON report_photos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete report_photos"
  ON report_photos FOR DELETE
  TO authenticated
  USING (true);