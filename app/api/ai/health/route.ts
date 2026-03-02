import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks = {
    openai: { status: 'checking', message: '' },
    supabase: { status: 'checking', message: '' },
    overall: 'checking'
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    checks.openai = { status: 'failed', message: 'OPENAI_API_KEY not found in environment' }
  } else if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
    checks.openai = { status: 'failed', message: 'OPENAI_API_KEY has invalid format' }
  } else {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      if (response.ok) {
        checks.openai = { status: 'ok', message: 'OpenAI API connection successful' }
      } else {
        const error = await response.json()
        checks.openai = { status: 'failed', message: `OpenAI API error: ${error.error?.message || response.status}` }
      }
    } catch (error: any) {
      checks.openai = { status: 'failed', message: `OpenAI connection error: ${error.message}` }
    }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.from('ai_knowledge_documents').select('count').limit(1)

    if (error) {
      checks.supabase = { status: 'failed', message: `Supabase query error: ${error.message}` }
    } else {
      checks.supabase = { status: 'ok', message: 'Supabase connection successful' }
    }
  } catch (error: any) {
    checks.supabase = { status: 'failed', message: `Supabase error: ${error.message}` }
  }

  checks.overall = checks.openai.status === 'ok' && checks.supabase.status === 'ok' ? 'healthy' : 'unhealthy'

  return NextResponse.json(checks, {
    status: checks.overall === 'healthy' ? 200 : 500
  })
}
