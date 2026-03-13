import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=${error}`, request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?error=missing_code', request.url))
  }

  try {
    const { userId, returnTo } = JSON.parse(Buffer.from(state, 'base64').toString())

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings?error=oauth_not_configured', request.url)
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials: URL or Service Role Key not configured')
      return NextResponse.redirect(
        new URL('/settings?error=server_config_error', request.url)
      )
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const userInfo = await userInfoResponse.json()

    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in)

    const { error: dbError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        email: userInfo.email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider'
      })

    if (dbError) {
      console.error('Database error saving OAuth tokens:', JSON.stringify(dbError, null, 2))
      const details = dbError.message || dbError.code || 'Unknown error'
      return NextResponse.redirect(
        new URL(`/settings?error=database_error&details=${encodeURIComponent(details)}`, request.url)
      )
    }

    return NextResponse.redirect(new URL(returnTo || '/settings?success=true', request.url))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/settings?error=unexpected_error', request.url)
    )
  }
}
