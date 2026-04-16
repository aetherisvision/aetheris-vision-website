import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const account = searchParams.get('state') // 'biz' or 'per'
  const error = searchParams.get('error')

  const origin = request.nextUrl.origin

  if (error || !code || (account !== 'biz' && account !== 'per')) {
    return NextResponse.redirect(
      `${origin}/admin/gmail?error=${error ?? 'invalid'}`
    )
  }

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return NextResponse.redirect(`${origin}/admin/gmail?error=missing_gmail_client_config`)
  }

  const redirectUri = `${origin}/api/auth/gmail/callback`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      `${origin}/admin/gmail?error=no_refresh_token`
    )
  }

  // Get the email address for this token
  let email: string | null = null
  try {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const info = await infoRes.json()
    email = info.email ?? null
  } catch { /* non-fatal */ }

  await sql`
    INSERT INTO oauth_tokens (account, refresh_token, email, updated_at)
    VALUES (${account}, ${tokens.refresh_token}, ${email}, NOW())
    ON CONFLICT (account) DO UPDATE
      SET refresh_token = EXCLUDED.refresh_token,
          email        = EXCLUDED.email,
          updated_at   = NOW()
  `

  return NextResponse.redirect(
    `${origin}/admin/gmail?connected=${account}`
  )
}
