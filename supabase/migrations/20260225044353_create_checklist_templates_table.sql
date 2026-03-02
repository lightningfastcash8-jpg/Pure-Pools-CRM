/*
  # Create checklist_templates table

  1. New Tables
    - `checklist_templates`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `items` (jsonb, checklist items with structure)
      - `created_at` (timestamptz)

  2. Seed Data
    - Insert "Heater Annual Service Checklist" with comprehensive items

  3. Security
    - Enable RLS on checklist_templates table
    - Add policies for authenticated users to read and manage templates
*/

CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  items jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM checklist_templates WHERE name = 'Heater Annual Service Checklist') THEN
    INSERT INTO checklist_templates (name, items)
    VALUES (
      'Heater Annual Service Checklist',
      '[
        {"id": "1", "text": "Visual inspection of heater exterior", "checked": false},
        {"id": "2", "text": "Check gas pressure and connections", "checked": false},
        {"id": "3", "text": "Inspect and clean burner assembly", "checked": false},
        {"id": "4", "text": "Test ignition system", "checked": false},
        {"id": "5", "text": "Check heat exchanger for corrosion", "checked": false},
        {"id": "6", "text": "Inspect venting system", "checked": false},
        {"id": "7", "text": "Test temperature and pressure relief valve", "checked": false},
        {"id": "8", "text": "Check and clean water flow sensor", "checked": false},
        {"id": "9", "text": "Verify proper water flow rate", "checked": false},
        {"id": "10", "text": "Test all safety controls", "checked": false},
        {"id": "11", "text": "Check electrical connections", "checked": false},
        {"id": "12", "text": "Test heater startup and shutdown", "checked": false},
        {"id": "13", "text": "Verify proper temperature output", "checked": false},
        {"id": "14", "text": "Check for gas leaks", "checked": false},
        {"id": "15", "text": "Document serial number and model", "checked": false}
      ]'::jsonb
    );
  END IF;
END $$;

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read checklist_templates"
  ON checklist_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert checklist_templates"
  ON checklist_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update checklist_templates"
  ON checklist_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete checklist_templates"
  ON checklist_templates FOR DELETE
  TO authenticated
  USING (true);