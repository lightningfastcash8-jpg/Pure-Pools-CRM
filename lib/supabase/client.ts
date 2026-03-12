import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`)
}

export const supabase = createSupabaseClient(
  supabaseUrl,
  supabaseAnonKey
)

export const createClient = () => {
  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey
  )
}

export const getSupabaseClient = createClient
