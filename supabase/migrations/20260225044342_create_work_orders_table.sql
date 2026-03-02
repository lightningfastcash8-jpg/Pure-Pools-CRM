/*
  # Create work_orders table

  1. New Tables
    - `work_orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `primary_asset_id` (uuid, nullable foreign key to assets)
      - `type` (text, warranty/maintenance/inspection/repair/heater_annual)
      - `status` (text, open/scheduled/completed/canceled)
      - `scheduled_date` (date, nullable)
      - `completed_at` (timestamptz, nullable)
      - `installed_by` (text, nullable - filter by builder/installer)
      - `installation_date` (date, nullable)
      - `product_issue` (text, nullable)
      - `notes` (text, nullable)
      - `invoice_subtotal` (numeric, nullable)
      - `invoice_parts_total` (numeric, nullable)
      - `invoice_total` (numeric, nullable)
      - `source_type` (text, gmail/manual)
      - `source_ref` (text, nullable - gmail message id)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on customer_id for relationships
    - Index on type for filtering
    - Index on status for filtering
    - Index on scheduled_date for calendar views
    - Index on installed_by for filtering

  3. Security
    - Enable RLS on work_orders table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  primary_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  type text NOT NULL,
  status text DEFAULT 'open',
  scheduled_date date,
  completed_at timestamptz,
  installed_by text,
  installation_date date,
  product_issue text,
  notes text,
  invoice_subtotal numeric,
  invoice_parts_total numeric,
  invoice_total numeric,
  source_type text DEFAULT 'manual',
  source_ref text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_installed_by ON work_orders(installed_by);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read work_orders"
  ON work_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work_orders"
  ON work_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_orders"
  ON work_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete work_orders"
  ON work_orders FOR DELETE
  TO authenticated
  USING (true);