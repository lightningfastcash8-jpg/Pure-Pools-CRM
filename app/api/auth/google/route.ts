import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`
  const userId = request.nextUrl.searchParams.get('userId')
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/settings'

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID to environment variables.' },
      { status: 500 }
    )
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ')

  const state = Buffer.from(JSON.stringify({ userId, returnTo })).toString('base64')

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
