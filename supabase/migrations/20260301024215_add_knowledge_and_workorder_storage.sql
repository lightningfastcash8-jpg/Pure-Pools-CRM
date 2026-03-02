/*
  # Add Storage Buckets for Knowledge Base and Work Order Attachments

  1. New Storage Buckets
    - `work-order-photos` - For photos attached to work orders
    - `ai-documents` - For uploaded knowledge base documents

  2. Security
    - Enable RLS on storage buckets
    - Allow authenticated users to upload, read, and delete files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('work-order-photos', 'work-order-photos', false),
  ('ai-documents', 'ai-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload work order photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'work-order-photos');

CREATE POLICY "Authenticated users can read work order photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'work-order-photos');

CREATE POLICY "Authenticated users can delete work order photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'work-order-photos');

CREATE POLICY "Authenticated users can upload ai documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-documents');

CREATE POLICY "Authenticated users can read ai documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ai-documents');

CREATE POLICY "Authenticated users can delete ai documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ai-documents');
