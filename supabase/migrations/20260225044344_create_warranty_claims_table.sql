/*
  # Create warranty_claims table

  1. New Tables
    - `warranty_claims`
      - `id` (uuid, primary key)
      - `work_order_id` (uuid, foreign key to work_orders)
      - `customer_id` (uuid, foreign key to customers)
      - `stage` (text, default 'intake' - intake/queued/scheduled/ready_to_file/filed/closed)
      - `priority` (text, default 'normal' - low/normal/high)
      - `vendor` (text, default 'Fluidra/Jandy')
      - `requestor_name` (text, nullable)
      - `requestor_email` (text, nullable)
      - `requestor_phone` (text, nullable)
      - `dispatched_by` (text, nullable - e.g., "This was sent in from")
      - `claim_notes` (text, nullable)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on stage for pipeline views
    - Index on vendor for filtering
    - Index on created_at for sorting

  3. Security
    - Enable RLS on warranty_claims table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stage text DEFAULT 'intake',
  priority text DEFAULT 'normal',
  vendor text DEFAULT 'Fluidra/Jandy',
  requestor_name text,
  requestor_email text,
  requestor_phone text,
  dispatched_by text,
  claim_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warranty_claims_stage ON warranty_claims(stage);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_vendor ON warranty_claims(vendor);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_created_at ON warranty_claims(created_at);

ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read warranty_claims"
  ON warranty_claims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert warranty_claims"
  ON warranty_claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update warranty_claims"
  ON warranty_claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete warranty_claims"
  ON warranty_claims FOR DELETE
  TO authenticated
  USING (true);