/*
  # Create appointments table

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `work_order_id` (uuid, foreign key to work_orders)
      - `appt_type` (text, default 'heater_annual')
      - `scheduled_date` (date, not null)
      - `status` (text, scheduled/completed/canceled)
      - `route_group` (text, nullable - zip/city for routing)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on scheduled_date for calendar views
    - Index on status for filtering
    - Index on appt_type for filtering

  3. Security
    - Enable RLS on appointments table
    - Add policies for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  appt_type text DEFAULT 'heater_annual',
  scheduled_date date NOT NULL,
  status text DEFAULT 'scheduled',
  route_group text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_appt_type ON appointments(appt_type);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (true);