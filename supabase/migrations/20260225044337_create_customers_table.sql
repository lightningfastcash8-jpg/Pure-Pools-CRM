/*
  # Create customers table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `phone` (text, nullable)
      - `email` (text, nullable)
      - `address_line1` (text, nullable)
      - `city` (text, nullable)
      - `state` (text, default 'FL')
      - `zip` (text, nullable)
      - `preferred_contact` (text, nullable)
      - `tags` (text array, default empty array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on phone for quick lookups
    - Index on email for quick lookups
    - Index on city for filtering
    - Index on zip for filtering
    - Index on last_name for searching

  3. Security
    - Enable RLS on customers table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert data
    - Add policy for authenticated users to update data
    - Add policy for authenticated users to delete data
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  address_line1 text,
  city text,
  state text DEFAULT 'FL',
  zip text,
  preferred_contact text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_zip ON customers(zip);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers(last_name);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);