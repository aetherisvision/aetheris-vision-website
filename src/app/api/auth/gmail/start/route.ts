import { NextRequest, NextResponse } from 'next/server'

const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly openid email'

export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get('account')
  if (account !== 'biz' && account !== 'per') {
    return NextResponse.json({ error: 'account must be biz or per' }, { status: 400 })
  }

  const params = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent select_account',
    state: account,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  )
}
