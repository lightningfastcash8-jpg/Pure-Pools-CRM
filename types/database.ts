export interface Customer {
  id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  address_line1?: string
  city?: string
  state: string
  zip?: string
  preferred_contact?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  customer_id: string
  asset_type: string
  brand?: string
  model_raw?: string
  model_normalized?: string
  serial?: string
  install_date?: string
  warranty_end_date?: string
  confidence: number
  source: string
  notes?: string
  status: string
  created_at: string
}

export interface WorkOrder {
  id: string
  customer_id: string
  primary_asset_id?: string
  type: string
  status: string
  scheduled_date?: string
  completed_at?: string
  installed_by?: string
  installation_date?: string
  product_issue?: string
  notes?: string
  invoice_subtotal?: number
  invoice_parts_total?: number
  invoice_total?: number
  source_type: string
  source_ref?: string
  created_at: string
}

export interface WarrantyClaim {
  id: string
  work_order_id: string
  customer_id: string
  stage: string
  priority: string
  vendor: string
  requestor_name?: string
  requestor_email?: string
  requestor_phone?: string
  dispatched_by?: string
  claim_notes?: string
  created_at: string
}

export interface WarrantyPhoto {
  id: string
  warranty_claim_id: string
  photo_type: string
  storage_path: string
  created_at: string
}

export interface ProgramEnrollment {
  id: string
  customer_id: string
  program_type: string
  status: string
  start_date: string
  price_service?: number
  price_monthly?: number
  notes?: string
  created_at: string
}

export interface ScheduleSettings {
  id: string
  season_start_month: number
  season_start_day: number
  season_end_month: number
  season_end_day: number
  max_per_day: number
  updated_at: string
}

export interface BlockedRange {
  id: string
  start_date: string
  end_date: string
  reason?: string
  created_at: string
}

export interface Appointment {
  id: string
  customer_id: string
  work_order_id: string
  appt_type: string
  scheduled_date: string
  status: string
  route_group?: string
  created_at: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  items: any
  created_at: string
}

export interface ServiceReport {
  id: string
  work_order_id: string
  checklist_results?: any
  notes?: string
  recommendations?: string
  pdf_storage_path?: string
  sent_status: string
  sent_at?: string
  created_at: string
}

export interface ReportPhoto {
  id: string
  report_id: string
  storage_path: string
  caption?: string
  created_at: string
}

export interface EmailRaw {
  id: string
  provider: string
  provider_message_id: string
  thread_id?: string
  label_name?: string
  from_name?: string
  from_email?: string
  subject?: string
  received_at?: string
  body_text?: string
  raw_json?: any
  processed_status: string
  created_at: string
}

export interface ExtractionResult {
  id: string
  email_id: string
  customer_id?: string
  work_order_id?: string
  extracted_json?: any
  confidence: number
  needs_review: boolean
  created_at: string
}

export interface OAuthToken {
  id: string
  user_id: string
  provider: string
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
  email?: string
  last_synced_at?: string
  created_at: string
  updated_at: string
}
