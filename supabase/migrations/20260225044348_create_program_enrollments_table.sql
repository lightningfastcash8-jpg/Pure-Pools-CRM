/*
  # Create program_enrollments table

  1. New Tables
    - `program_enrollments`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `program_type` (text, heater_annual/warranty_inspection/iaqualink_monitoring)
      - `status` (text, active/paused/canceled)
      - `start_date` (date)
      - `price_service` (numeric, nullable)
      - `price_monthly` (numeric, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)

  2. Default Pricing
    - warranty_inspection: price_service = 149.99
    - heater_annual: price_service = 199.99
    - iaqualink_monitoring: placeholder only

  3. Security
    - Enable RLS on program_enrollments table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  program_type text NOT NULL,
  status text DEFAULT 'active',
  start_date date NOT NULL,
  price_service numeric,
  price_monthly numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_customer_id ON program_enrollments(customer_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_type ON program_enrollments(program_type);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON program_enrollments(status);

ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read program_enrollments"
  ON program_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert program_enrollments"
  ON program_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update program_enrollments"
  ON program_enrollments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete program_enrollments"
  ON program_enrollments FOR DELETE
  TO authenticated
  USING (true);