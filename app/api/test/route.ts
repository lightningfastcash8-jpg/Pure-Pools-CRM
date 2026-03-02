import { NextResponse } from 'next/server'

export async function GET() {
  console.log('Test API route called')
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  })
}

export async function POST() {
  console.log('Test API route POST called')
  return NextResponse.json({
    status: 'ok',
    method: 'POST',
    timestamp: new Date().toISOString()
  })
}
