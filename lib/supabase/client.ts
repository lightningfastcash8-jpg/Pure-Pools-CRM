import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoftunmonnaunwcziikf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZnR1bm1vbm5hdW53Y3ppaWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTA5NTksImV4cCI6MjA4NzU2Njk1OX0.13hvqOptFdBDj86c5X_Y8qpja4hHqZsLmYTSKldc5HE'

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export const getSupabaseClient = createClient
