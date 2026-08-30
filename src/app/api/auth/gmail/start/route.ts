import crypto from 'crypto'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { setStateCookie } from '@/lib/gmail-oauth'
import { NextRequest, NextResponse } from 'next/server'

// gmail.compose technically authorizes drafts.send (a token holder COULD
// send mail via the API) -- this app just never calls it. Draft-then-review
// stays a human action taken in Gmail itself by policy/code, not something
// the granted scope itself prevents. gmail.settings.basic (read+write, no
// narrower read-only variant exists) is needed to read the mailbox's own
// configured signature via users.settings.sendAs so drafts can embed
// whatever the human actually has set in Gmail, instead of a static copy
// that can silently drift out of sync with edits made in Gmail's UI.
const SCOPE =
  'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.settings.basic openid email'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const account = request.nextUrl.searchParams.get('account')
  if (account !== 'biz' && account !== 'per') {
    return NextResponse.json({ error: 'account must be biz or per' }, { status: 400 })
  }

  if (!process.env.GMAIL_CLIENT_ID) {
    return NextResponse.redirect(`${request.nextUrl.origin}/admin/gmail?error=missing_gmail_client_id`)
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const redirectUri = `${request.nextUrl.origin}/api/auth/gmail/callback`
  const params = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent select_account',
    include_granted_scopes: 'true',
    state: `${account}:${nonce}`,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

  // Debug helper: shows the computed redirect_uri + URL (no secrets) so you can
  // copy/paste into Google Cloud Console → OAuth client → Authorized redirect URIs.
  // Usage: /api/auth/gmail/start?account=per&debug=1
  if (request.nextUrl.searchParams.get('debug') === '1') {
    const response = NextResponse.json({
      ok: true,
      account,
      origin: request.nextUrl.origin,
      redirectUri,
      authUrl,
      hint: 'Ensure redirectUri is listed under Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs.',
    })
    return setStateCookie(response, request, account, nonce)
  }

  return setStateCookie(NextResponse.redirect(authUrl), request, account, nonce)
}
