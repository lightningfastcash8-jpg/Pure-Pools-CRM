/*
  # Create extraction_results table

  1. New Tables
    - `extraction_results`
      - `id` (uuid, primary key)
      - `email_id` (uuid, foreign key to emails_raw)
      - `customer_id` (uuid, nullable foreign key to customers)
      - `work_order_id` (uuid, nullable foreign key to work_orders)
      - `extracted_json` (jsonb, parsed data from email)
      - `confidence` (numeric, 0 to 1 confidence score)
      - `needs_review` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on extraction_results table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS extraction_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES emails_raw(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  work_order_id uuid REFERENCES work_orders(id) ON DELETE SET NULL,
  extracted_json jsonb,
  confidence numeric DEFAULT 0,
  needs_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extraction_results_email_id ON extraction_results(email_id);
CREATE INDEX IF NOT EXISTS idx_extraction_results_needs_review ON extraction_results(needs_review);

ALTER TABLE extraction_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read extraction_results"
  ON extraction_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert extraction_results"
  ON extraction_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update extraction_results"
  ON extraction_results FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete extraction_results"
  ON extraction_results FOR DELETE
  TO authenticated
  USING (true);