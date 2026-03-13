import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function verifyUserFromToken(authHeader: string | null): Promise<{ userId: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return { userId: user.id }
}

interface TokenRefreshError {
  error: string
  error_description?: string
}

async function getValidAccessToken(supabase: any, userId: string): Promise<{ token: string | null; error?: string }> {
  try {
    const { data: tokenData, error: dbError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider', 'google')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('Database error fetching token:', dbError)
      return { token: null, error: `Database error: ${dbError.message}` }
    }

    if (!tokenData) {
      return { token: null, error: 'No Google account connected. Please connect your Google account in Settings.' }
    }

    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    const bufferTime = 5 * 60 * 1000

    if (expiresAt.getTime() > now.getTime() + bufferTime) {
      return { token: tokenData.access_token }
    }

    if (!tokenData.refresh_token) {
      return { token: null, error: 'No refresh token available. Please disconnect and reconnect your Google account in Settings.' }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials in environment')
      return { token: null, error: 'Server configuration error - Google OAuth credentials not configured' }
    }

    console.log('Refreshing expired Google token...')

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!refreshResponse.ok) {
      const errorData: TokenRefreshError = await refreshResponse.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Token refresh failed:', errorData)

      if (errorData.error === 'invalid_grant') {
        return { token: null, error: 'Google authorization has expired. Please reconnect your Google account in Settings.' }
      }
      return { token: null, error: `Token refresh failed: ${errorData.error_description || errorData.error}` }
    }

    const newTokens = await refreshResponse.json()

    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in)

    const { error: updateError } = await supabase
      .from('oauth_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id)

    if (updateError) {
      console.error('Failed to save refreshed token:', updateError)
    }

    console.log('Token refreshed successfully')
    return { token: newTokens.access_token }
  } catch (err: any) {
    console.error('Unexpected error in getValidAccessToken:', err)
    return { token: null, error: `Unexpected error: ${err.message}` }
  }
}

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2] }
  }
  return { name: '', email: from }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const authResult = await verifyUserFromToken(authHeader)

    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in again' },
        { status: 401 }
      )
    }

    const userId = authResult.userId

    let supabase
    try {
      supabase = getServiceClient()
    } catch (err: any) {
      console.error('Service client error:', err)
      return NextResponse.json({
        error: 'Server configuration error - missing database credentials',
        newEmails: 0
      }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const years = body.years || 1

    const { token: accessToken, error: tokenError } = await getValidAccessToken(supabase, userId)

    if (!accessToken) {
      return NextResponse.json({
        error: tokenError || 'Please connect your Google account in Settings to enable Gmail sync.',
        newEmails: 0
      }, { status: 400 })
    }

    const afterDate = new Date()
    afterDate.setFullYear(afterDate.getFullYear() - years)
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000)

    let allMessages: any[] = []
    let nextPageToken: string | null = null

    do {
      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
      url.searchParams.set('maxResults', '100')
      url.searchParams.set('q', `after:${afterTimestamp}`)
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken)
      }

      const messagesResponse = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text()
        throw new Error(`Failed to fetch messages: ${errorText}`)
      }

      const messagesData = await messagesResponse.json()
      const messages = messagesData.messages || []
      allMessages = allMessages.concat(messages)
      nextPageToken = messagesData.nextPageToken || null

      if (allMessages.length >= 500) break
    } while (nextPageToken)

    let processedCount = 0
    let skippedCount = 0

    for (const message of allMessages) {
      const { data: existing } = await supabase
        .from('emails_raw')
        .select('id')
        .eq('provider_message_id', message.id)
        .maybeSingle()

      if (existing) {
        skippedCount++
        continue
      }

      const detailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      if (!detailResponse.ok) continue

      const detail = await detailResponse.json()
      const headers = detail.payload?.headers || []

      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('subject')
      const from = getHeader('from')
      const date = getHeader('date')
      const { name: fromName, email: fromEmail } = parseFromHeader(from)

      let body = ''
      if (detail.payload?.parts) {
        const textPart = detail.payload.parts.find((p: any) => p.mimeType === 'text/plain')
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
        } else {
          const htmlPart = detail.payload.parts.find((p: any) => p.mimeType === 'text/html')
          if (htmlPart?.body?.data) {
            body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8')
          }
        }
      } else if (detail.payload?.body?.data) {
        body = Buffer.from(detail.payload.body.data, 'base64').toString('utf-8')
      }

      const labelNames = detail.labelIds || []

      const { error: insertError } = await supabase
        .from('emails_raw')
        .insert({
          provider: 'gmail',
          provider_message_id: message.id,
          thread_id: detail.threadId,
          label_name: labelNames.join(','),
          from_name: fromName,
          from_email: fromEmail,
          subject,
          body_text: body,
          received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
          raw_json: detail,
          processed_status: 'new'
        })

      if (!insertError) {
        processedCount++
      }
    }

    await supabase
      .from('oauth_tokens')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'google')

    return NextResponse.json({
      message: `Imported ${processedCount} new emails. Skipped ${skippedCount} already imported.`,
      newEmails: processedCount,
      skipped: skippedCount,
      total: allMessages.length
    })

  } catch (error: any) {
    console.error('Gmail sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync emails' },
      { status: 500 }
    )
  }
}
