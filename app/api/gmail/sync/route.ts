import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: tokenData } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider', 'google')
    .eq('user_id', userId)
    .maybeSingle()

  if (!tokenData) return null

  const expiresAt = new Date(tokenData.expires_at)
  const now = new Date()

  if (expiresAt > now) {
    return tokenData.access_token
  }

  if (!tokenData.refresh_token) return null

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

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

  if (!refreshResponse.ok) return null

  const newTokens = await refreshResponse.json()

  const newExpiresAt = new Date()
  newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokens.expires_in)

  await supabase
    .from('oauth_tokens')
    .update({
      access_token: newTokens.access_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tokenData.id)

  return newTokens.access_token
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const accessToken = await getValidAccessToken(supabase, user.id)

    if (!accessToken) {
      return NextResponse.json({
        message: 'Please connect your Google account in Settings to enable Gmail sync.',
        newEmails: 0
      })
    }

    const labelResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/labels',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )

    if (!labelResponse.ok) {
      throw new Error('Failed to fetch Gmail labels')
    }

    const labelsData = await labelResponse.json()
    const targetLabel = labelsData.labels?.find(
      (l: any) => l.name === 'PP_Warranty_CRM_Upload'
    )

    if (!targetLabel) {
      return NextResponse.json({
        message: 'Label "PP_Warranty_CRM_Upload" not found. Please create it in Gmail.',
        newEmails: 0
      })
    }

    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${targetLabel.id}&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )

    if (!messagesResponse.ok) {
      throw new Error('Failed to fetch messages')
    }

    const messagesData = await messagesResponse.json()
    const messages = messagesData.messages || []

    let processedCount = 0
    let warrantyCount = 0

    for (const message of messages) {
      const { data: existing } = await supabase
        .from('emails_raw')
        .select('id')
        .eq('gmail_message_id', message.id)
        .maybeSingle()

      if (existing) continue

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
      const to = getHeader('to')
      const date = getHeader('date')

      let body = ''
      if (detail.payload?.parts) {
        const textPart = detail.payload.parts.find((p: any) => p.mimeType === 'text/plain')
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
        }
      } else if (detail.payload?.body?.data) {
        body = Buffer.from(detail.payload.body.data, 'base64').toString('utf-8')
      }

      const { data: emailRow } = await supabase
        .from('emails_raw')
        .insert({
          gmail_message_id: message.id,
          subject,
          sender: from,
          recipient: to,
          body_text: body,
          received_at: new Date(date).toISOString(),
          labels: ['PP_Warranty_CRM_Upload'],
          raw_headers: headers
        })
        .select()
        .single()

      if (emailRow) {
        processedCount++

        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'https://').split('.')[0]}.supabase.co/functions/v1/parse-warranty-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            emailId: emailRow.id,
            subject,
            body,
            from
          })
        }).catch(() => null)

        if (aiResponse?.ok) {
          warrantyCount++
        }
      }
    }

    return NextResponse.json({
      message: `Processed ${processedCount} new emails. Created ${warrantyCount} warranty claims.`,
      newEmails: processedCount,
      warrantyClaims: warrantyCount
    })

  } catch (error: any) {
    console.error('Gmail sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync emails' },
      { status: 500 }
    )
  }
}
