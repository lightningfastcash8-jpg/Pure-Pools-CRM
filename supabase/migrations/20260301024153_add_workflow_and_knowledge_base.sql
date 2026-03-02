/*
  # Add Workflow Stages and AI Knowledge Base

  1. Updates to Existing Tables
    - `work_orders`: Add workflow_stage column (queued/scheduled/today/waiting_to_file/filed)
    - `work_orders`: Add attachment_urls array for photos taken in-app

  2. New Tables
    - `ai_knowledge_documents`
      - `id` (uuid, primary key)
      - `doc_type` (text: parts_catalog, manual, note, other)
      - `title` (text, document title)
      - `content` (text, full document content for AI)
      - `storage_path` (text, nullable - path to original file if uploaded)
      - `metadata` (jsonb, any structured data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `historical_import_settings`
      - `id` (uuid, primary key)
      - `start_date` (date, how far back to import)
      - `end_date` (date, import up to this date)
      - `label_filter` (text, Gmail label to filter)
      - `last_import_run` (timestamptz, nullable)
      - `status` (text: pending/running/completed/error)
      - `records_imported` (integer, count of emails imported)
      - `created_at` (timestamptz)

  3. Indexes
    - Index on work_orders.workflow_stage for filtering
    - Index on ai_knowledge_documents.doc_type for filtering
    - Index on historical_import_settings.status

  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to perform all operations
*/

-- Add workflow_stage to work_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders' AND column_name = 'workflow_stage'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN workflow_stage text DEFAULT 'queued';
  END IF;
END $$;

-- Add attachment_urls to work_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders' AND column_name = 'attachment_urls'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN attachment_urls text[] DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_orders_workflow_stage ON work_orders(workflow_stage);

-- Create AI knowledge documents table
CREATE TABLE IF NOT EXISTS ai_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  storage_path text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_documents_doc_type ON ai_knowledge_documents(doc_type);

ALTER TABLE ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ai_knowledge_documents"
  ON ai_knowledge_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ai_knowledge_documents"
  ON ai_knowledge_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ai_knowledge_documents"
  ON ai_knowledge_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ai_knowledge_documents"
  ON ai_knowledge_documents FOR DELETE
  TO authenticated
  USING (true);

-- Create historical import settings table
CREATE TABLE IF NOT EXISTS historical_import_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  label_filter text NOT NULL,
  last_import_run timestamptz,
  status text DEFAULT 'pending',
  records_imported integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historical_import_settings_status ON historical_import_settings(status);

ALTER TABLE historical_import_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read historical_import_settings"
  ON historical_import_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert historical_import_settings"
  ON historical_import_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update historical_import_settings"
  ON historical_import_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete historical_import_settings"
  ON historical_import_settings FOR DELETE
  TO authenticated
  USING (true);
