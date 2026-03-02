/*
  # Create warranty_photos table

  1. New Tables
    - `warranty_photos`
      - `id` (uuid, primary key)
      - `warranty_claim_id` (uuid, foreign key to warranty_claims)
      - `photo_type` (text, serial/issue/issue2)
      - `storage_path` (text, path in Supabase Storage)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on warranty_photos table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS warranty_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_claim_id uuid NOT NULL REFERENCES warranty_claims(id) ON DELETE CASCADE,
  photo_type text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE warranty_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read warranty_photos"
  ON warranty_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert warranty_photos"
  ON warranty_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update warranty_photos"
  ON warranty_photos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete warranty_photos"
  ON warranty_photos FOR DELETE
  TO authenticated
  USING (true);