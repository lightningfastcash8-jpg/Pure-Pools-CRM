/*
  # Update warranty claims workflow
  
  1. Changes
    - Add `email_id` field to link to source email from PP_Warranty_CRM_Upload label
    - Add `gmail_message_id` to track original Gmail message
    - Add `parsed_data` jsonb field to store AI-extracted information
    - Add `scheduled_date` for calendar integration
    - Add `photo_urls` array for on-site photos
    - Add `filed_date` to track when warranty was filed
    - Add `manufacturer_claim_number` for tracking in manufacturer system
    - Update stage to remove 'intake', keep only: queued/scheduled/ready_to_file/filed/closed
  
  2. Notes
    - Workflow: Email arrives → Parsed → Queued → Scheduled (via calendar) → Photos added on-site → Ready to File → Filed → Closed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranty_claims' AND column_name = 'email_id'
  ) THEN
    ALTER TABLE warranty_claims ADD COLUMN email_id uuid REFERENCES emails_raw(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranty_claims' AND column_name = 'gmail_message_id'
  ) THEN
    ALTER TABLE warranty_claims ADD COLUMN gmail_message_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranty_claims' AND column_name = 'parsed_data'
  ) THEN
    ALTER TABLE warranty_claims ADD COLUMN parsed_data jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranty_claims' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE warranty_claims ADD COLUMN scheduled_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranty_claims' AND column_name = 'photo_urls'
  ) THEN
    ALTER TABLE warranty_claims ADD COLUMN photo_urls text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranty_claims' AND column_name = 'filed_date'
  ) THEN
    ALTER TABLE warranty_claims ADD COLUMN filed_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranty_claims' AND column_name = 'manufacturer_claim_number'
  ) THEN
    ALTER TABLE warranty_claims ADD COLUMN manufacturer_claim_number text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_warranty_claims_email_id ON warranty_claims(email_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_scheduled_date ON warranty_claims(scheduled_date);
