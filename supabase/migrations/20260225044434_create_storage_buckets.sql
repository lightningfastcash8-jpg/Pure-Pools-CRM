/*
  # Create Supabase Storage Buckets

  1. Storage Buckets
    - `warranty-photos` - For warranty claim photos (serial numbers, issues)
    - `report-photos` - For service report photos
    - `reports` - For generated PDF reports
    - `branding` - For company logo and branding assets

  2. Security
    - Enable RLS on storage buckets
    - Allow authenticated users to upload and read files
    - Public read access for branding assets
*/

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('warranty-photos', 'warranty-photos', false),
  ('report-photos', 'report-photos', false),
  ('reports', 'reports', false),
  ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload warranty photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'warranty-photos');

CREATE POLICY "Authenticated users can read warranty photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'warranty-photos');

CREATE POLICY "Authenticated users can delete warranty photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'warranty-photos');

CREATE POLICY "Authenticated users can upload report photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-photos');

CREATE POLICY "Authenticated users can read report photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'report-photos');

CREATE POLICY "Authenticated users can delete report photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'report-photos');

CREATE POLICY "Authenticated users can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Authenticated users can read reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

CREATE POLICY "Authenticated users can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reports');

CREATE POLICY "Anyone can read branding"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branding');

CREATE POLICY "Authenticated users can upload branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding');