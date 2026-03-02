/*
  # Create service_reports table

  1. New Tables
    - `service_reports`
      - `id` (uuid, primary key)
      - `work_order_id` (uuid, foreign key to work_orders)
      - `checklist_results` (jsonb, completed checklist data)
      - `notes` (text, nullable - service notes)
      - `recommendations` (text, nullable - recommendations for customer)
      - `pdf_storage_path` (text, nullable - path to generated PDF)
      - `sent_status` (text, default 'not_sent' - not_sent/sent)
      - `sent_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on service_reports table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS service_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  checklist_results jsonb,
  notes text,
  recommendations text,
  pdf_storage_path text,
  sent_status text DEFAULT 'not_sent',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_reports_work_order_id ON service_reports(work_order_id);

ALTER TABLE service_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read service_reports"
  ON service_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service_reports"
  ON service_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service_reports"
  ON service_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service_reports"
  ON service_reports FOR DELETE
  TO authenticated
  USING (true);