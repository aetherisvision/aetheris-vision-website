import { sql } from '@/lib/db'
import { encryptToken } from '@/lib/token-crypto'
import { isAdmin, safeEqual, unauthorizedResponse } from '@/lib/admin-auth'
import { clearStateCookie, stateCookieName } from '@/lib/gmail-oauth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const stateParts = (searchParams.get('state') ?? '').split(':')
  const [account, nonce] = stateParts

  const origin = request.nextUrl.origin

  if (account !== 'biz' && account !== 'per') {
    return NextResponse.redirect(`${origin}/admin/gmail?error=invalid_state`)
  }

  // Google reports user-denied consent (and similar) with no code. No token
  // exchange happens on this path, so surface it before the nonce check — an
  // expired state cookie must not turn a plain "Cancel" into a dead end.
  if (error || !code) {
    return clearStateCookie(
      NextResponse.redirect(
        `${origin}/admin/gmail?error=${encodeURIComponent(error ?? 'invalid')}`
      ),
      account
    )
  }

  const storedNonce = request.cookies.get(stateCookieName(account))?.value
  if (stateParts.length !== 2 || !safeEqual(nonce, storedNonce)) {
    return clearStateCookie(
      NextResponse.redirect(`${origin}/admin/gmail?error=invalid_state`),
      account
    )
  }

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return clearStateCookie(
      NextResponse.redirect(`${origin}/admin/gmail?error=missing_gmail_client_config`),
      account
    )
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
    return clearStateCookie(
      NextResponse.redirect(`${origin}/admin/gmail?error=no_refresh_token`),
      account
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
    VALUES (${account}, ${encryptToken(tokens.refresh_token)}, ${email}, NOW())
    ON CONFLICT (account) DO UPDATE
      SET refresh_token = EXCLUDED.refresh_token,
          email        = EXCLUDED.email,
          updated_at   = NOW()
  `

  return clearStateCookie(
    NextResponse.redirect(`${origin}/admin/gmail?connected=${account}`),
    account
  )
}
