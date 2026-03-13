import { NextRequest, NextResponse } from 'next/server'

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
    const { userId, returnTo, accessToken } = JSON.parse(Buffer.from(state, 'base64').toString())

    if (!accessToken) {
      return NextResponse.redirect(new URL('/settings?error=not_authenticated', request.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings?error=oauth_not_configured', request.url)
      )
    }

    if (!supabaseUrl) {
      console.error('Missing Supabase URL')
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

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in)

    const saveResponse = await fetch(`${supabaseUrl}/functions/v1/save-oauth-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        email: userInfo.email,
      }),
    })

    if (!saveResponse.ok) {
      let errorMessage = 'Unknown error'
      try {
        const errorText = await saveResponse.text()
        console.error('Failed to save OAuth token - raw response:', errorText)
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorData.message || 'Unknown error'
      } catch (parseErr) {
        console.error('Failed to parse error response:', parseErr)
      }
      return NextResponse.redirect(
        new URL(`/settings?error=database_error&details=${encodeURIComponent(errorMessage)}`, request.url)
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
