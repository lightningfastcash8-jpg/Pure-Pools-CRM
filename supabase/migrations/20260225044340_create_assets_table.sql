/*
  # Create assets table

  1. New Tables
    - `assets`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `asset_type` (text, heater/pump/filter/automation/sensor/valve/other)
      - `brand` (text, nullable)
      - `model_raw` (text, nullable - original model string)
      - `model_normalized` (text, nullable - uppercase, stripped)
      - `serial` (text, nullable)
      - `install_date` (date, nullable)
      - `warranty_end_date` (date, nullable)
      - `confidence` (numeric, 0 to 1)
      - `source` (text, email/paste/manual)
      - `notes` (text, nullable)
      - `status` (text, default 'active')
      - `created_at` (timestamptz)

  2. Indexes
    - Index on customer_id for relationships
    - Index on asset_type for filtering
    - Index on model_normalized for searching

  3. Security
    - Enable RLS on assets table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  brand text,
  model_raw text,
  model_normalized text,
  serial text,
  install_date date,
  warranty_end_date date,
  confidence numeric DEFAULT 0,
  source text DEFAULT 'manual',
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_customer_id ON assets(customer_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_model_normalized ON assets(model_normalized);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read assets"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete assets"
  ON assets FOR DELETE
  TO authenticated
  USING (true);