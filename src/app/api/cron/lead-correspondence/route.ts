import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { sql } from '@/lib/db'
import { GMAIL_API, getGmailAccessToken } from '@/lib/gmail-client'
import { matchSentMessage, type CorrespondenceLead, type SentMessage } from '@/lib/lead-correspondence'
import { decryptToken } from '@/lib/token-crypto'

export const maxDuration = 300
const NO_STORE = { 'Cache-Control': 'no-store' }

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization')
  if (secret && header) {
    const expected = Buffer.from(`Bearer ${secret}`)
    const actual = Buffer.from(header)
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) return true
  }
  return isAdmin(request)
}

async function gmailGet(token: string, path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${GMAIL_API}/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Gmail read failed (${response.status})`)
  return await response.json() as Record<string, unknown>
}

function messageFromApi(value: Record<string, unknown>): SentMessage | null {
  const labels = value.labelIds
  if (!Array.isArray(labels) || !labels.includes('SENT')) return null
  const payload = value.payload as { headers?: { name: string; value: string }[] } | undefined
  const headers = new Map((payload?.headers ?? []).map(header => [header.name.toLowerCase(), header.value]))
  const sentAt = Number(value.internalDate)
  if (typeof value.id !== 'string' || typeof value.threadId !== 'string' ||
    !Number.isFinite(sentAt) || !headers.get('to')) return null
  return { id: value.id, threadId: value.threadId, sentAt,
    to: headers.get('to')!, subject: headers.get('subject') ?? '' }
}

async function sentMessages(token: string, days: number): Promise<SentMessage[]> {
  const after = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10).replaceAll('-', '/')
  const ids: string[] = []
  let pageToken = ''
  do {
    const params = new URLSearchParams({ q: `in:sent after:${after}`, maxResults: '500' })
    if (pageToken) params.set('pageToken', pageToken)
    const page = await gmailGet(token, `messages?${params}`)
    for (const message of (page.messages as { id?: string }[] | undefined) ?? []) {
      if (typeof message.id === 'string') ids.push(message.id)
    }
    pageToken = typeof page.nextPageToken === 'string' ? page.nextPageToken : ''
    if (ids.length > 2500 && pageToken) throw new Error('Sent-mail lookback is too large; narrow the range')
  } while (pageToken)

  const results: SentMessage[] = []
  for (let offset = 0; offset < ids.length; offset += 10) {
    const batch = await Promise.all(ids.slice(offset, offset + 10).map(async id => {
      const params = new URLSearchParams({format:'metadata'})
      params.append('metadataHeaders', 'To')
      params.append('metadataHeaders', 'Subject')
      return messageFromApi(await gmailGet(token, `messages/${encodeURIComponent(id)}?${params}`))
    }))
    results.push(...batch.filter((message): message is SentMessage => message !== null))
  }
  return results
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({error:'Unauthorized'}, {status:401,headers:NO_STORE})
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return NextResponse.json({error:'Gmail is not configured'}, {status:500,headers:NO_STORE})
  }
  const days = request.nextUrl.searchParams.get('days') === '90' ? 90 : 30
  const dryRun = request.nextUrl.searchParams.get('dry_run') === '1'
  try {
    const tokens = await sql`SELECT refresh_token, scopes FROM oauth_tokens WHERE account = 'biz'`
    const connection = tokens[0] as {refresh_token:string;scopes:string|null}|undefined
    if (!connection) return NextResponse.json({error:'Connect business Gmail first'}, {status:409,headers:NO_STORE})
    if (connection.scopes && !connection.scopes.split(/\s+/).includes('https://www.googleapis.com/auth/gmail.readonly')) {
      return NextResponse.json({error:'Reconnect business Gmail with read access'}, {status:409,headers:NO_STORE})
    }
    const leads = await sql`
      SELECT id,stage,name,email,source,created_at,removed_at,last_sent_message_id,
             gmail_draft_id,gmail_draft_created_at,
             gmail_draft_subject,gmail_thread_id,govcon->>'source_id' AS source_id
      FROM leads WHERE trim(email) <> ''
    ` as CorrespondenceLead[]
    if (!leads.length) return NextResponse.json({ok:true,checked:0,matched:0,moved:0}, {headers:NO_STORE})
    const token = await getGmailAccessToken(decryptToken(connection.refresh_token))
    const messages = await sentMessages(token, days)
    const alreadyRecorded = new Set(leads.map(lead => lead.last_sent_message_id).filter(Boolean))
    const matches = new Map<number, SentMessage>()
    for (const message of messages) {
      if (alreadyRecorded.has(message.id)) continue
      const lead = matchSentMessage(leads, message)
      if (lead && !lead.removed_at && (lead.stage === 'review' || lead.stage === 'new') &&
        (!matches.has(lead.id) || message.sentAt < matches.get(lead.id)!.sentAt)) {
        matches.set(lead.id, message)
      }
    }
    if (dryRun) return NextResponse.json({ok:true,dryRun:true,checked:messages.length,
      matched:matches.size,leadIds:[...matches.keys()].sort((a,b)=>a-b)}, {headers:NO_STORE})

    let moved = 0
    for (const lead of leads) {
      const message = matches.get(lead.id)
      if (!message) continue
      const rows = await sql`
        UPDATE leads
        SET stage = 'contacted',
            next_follow_up = COALESCE(next_follow_up, to_timestamp(${message.sentAt / 1000}) + interval '7 days'),
            gmail_draft_id = CASE WHEN gmail_draft_created_at IS NULL OR
              gmail_draft_created_at <= to_timestamp(${message.sentAt / 1000}) THEN NULL ELSE gmail_draft_id END,
            gmail_draft_created_at = CASE WHEN gmail_draft_created_at IS NULL OR
              gmail_draft_created_at <= to_timestamp(${message.sentAt / 1000}) THEN NULL ELSE gmail_draft_created_at END,
            last_sent_message_id = ${message.id},
            activity_history = activity_history || jsonb_build_array(jsonb_build_object(
              'id', ${'gmail:' + message.id}::text, 'kind', 'outreach',
              'note', 'Email sent in business Gmail', 'created_at', now(),
              'sent_at', to_timestamp(${message.sentAt / 1000}),
              'from_stage', stage, 'to_stage', 'contacted',
              'gmail_message_id', ${message.id}::text
            )),
            workflow_version = workflow_version + 1,
            updated_at = now()
        WHERE id = ${lead.id} AND removed_at IS NULL AND stage IN ('review','new')
          AND lower(trim(email)) = ${lead.email.trim().toLowerCase()}
          AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(activity_history) event
            WHERE event->>'id' = ${'gmail:' + message.id})
        RETURNING id
      `
      moved += rows.length
    }
    return NextResponse.json({ok:true,checked:messages.length,matched:matches.size,moved}, {headers:NO_STORE})
  } catch (error) {
    console.error('Lead correspondence sync failed', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({error:'Sent mail could not be checked'}, {status:502,headers:NO_STORE})
  }
}
