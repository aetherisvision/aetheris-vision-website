import { NextRequest, NextResponse } from 'next/server'

const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly openid email'

export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get('account')
  if (account !== 'biz' && account !== 'per') {
    return NextResponse.json({ error: 'account must be biz or per' }, { status: 400 })
  }

  if (!process.env.GMAIL_CLIENT_ID) {
    return NextResponse.redirect(`${request.nextUrl.origin}/admin/gmail?error=missing_gmail_client_id`)
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/gmail/callback`
  const params = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent select_account',
    include_granted_scopes: 'true',
    state: account,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

  // Debug helper: shows the computed redirect_uri + URL (no secrets) so you can
  // copy/paste into Google Cloud Console → OAuth client → Authorized redirect URIs.
  // Usage: /api/auth/gmail/start?account=per&debug=1
  if (request.nextUrl.searchParams.get('debug') === '1') {
    return NextResponse.json({
      ok: true,
      account,
      origin: request.nextUrl.origin,
      redirectUri,
      authUrl,
      hint: 'Ensure redirectUri is listed under Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs.',
    })
  }

  return NextResponse.redirect(
    authUrl
  )
}
