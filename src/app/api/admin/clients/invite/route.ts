import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/send-magic-link'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  await sendMagicLink(email)

  return NextResponse.json({ sent: true })
}
