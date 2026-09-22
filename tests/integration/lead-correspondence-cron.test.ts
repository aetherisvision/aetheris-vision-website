import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sqlMock, isAdminMock, decryptMock, accessMock } = vi.hoisted(() => ({
  sqlMock:vi.fn(), isAdminMock:vi.fn(), decryptMock:vi.fn(), accessMock:vi.fn(),
}))
vi.mock('@/lib/db', () => ({sql:sqlMock}))
vi.mock('@/lib/admin-auth', () => ({isAdmin:isAdminMock}))
vi.mock('@/lib/token-crypto', () => ({decryptToken:decryptMock}))
vi.mock('@/lib/gmail-client', () => ({GMAIL_API:'https://gmail.googleapis.com/gmail/v1',getGmailAccessToken:accessMock}))

import { GET } from '@/app/api/cron/lead-correspondence/route'

function request(query='',auth=false) {
  return new NextRequest(`http://localhost/api/cron/lead-correspondence${query}`, {
    headers:auth?{authorization:'Bearer test-cron-secret'}:{},
  })
}
function lead() {
  return {id:10,stage:'new',name:'NAWCAD Long Range Acquisition Forecast',email:'officer@navy.mil',
    source:'opportunity-radar',created_at:'2026-09-01T00:00:00Z',
    gmail_draft_id:'old-draft',gmail_draft_created_at:'2026-09-10T00:00:00Z',
    gmail_draft_subject:'NAWCAD forecast question',gmail_thread_id:null,source_id:null}
}
function gmailFetch() {
  return vi.fn(async (url: string) => {
    const body=url.includes('messages/sent-1')
      ? {id:'sent-1',threadId:'thread-1',labelIds:['SENT'],internalDate:String(Date.parse('2026-09-22T12:00:00Z')),
        payload:{headers:[{name:'To',value:'Officer <officer@navy.mil>'},{name:'Subject',value:'Re: NAWCAD forecast question'}]}}
      : {messages:[{id:'sent-1'}]}
    return {ok:true,json:async()=>body}
  })
}

describe('GET /api/cron/lead-correspondence', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET','test-cron-secret')
    vi.stubEnv('GMAIL_CLIENT_ID','test-client')
    vi.stubEnv('GMAIL_CLIENT_SECRET','test-secret')
    sqlMock.mockReset();isAdminMock.mockReset();decryptMock.mockReset();accessMock.mockReset()
    isAdminMock.mockReturnValue(false)
    decryptMock.mockReturnValue('refresh-token')
    accessMock.mockResolvedValue('access-token')
  })

  it('rejects unauthenticated callers before database or Gmail access', async () => {
    expect((await GET(request())).status).toBe(401)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('previews a verified sent message without changing the lead', async () => {
    sqlMock.mockResolvedValueOnce([{refresh_token:'encrypted',scopes:'https://www.googleapis.com/auth/gmail.readonly'}])
      .mockResolvedValueOnce([lead()])
    const fetchMock=gmailFetch();vi.stubGlobal('fetch',fetchMock)
    const response=await GET(request('?dry_run=1&days=90',true))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({dryRun:true,leadIds:[10],matched:1})
    expect(sqlMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('moves a verified lead once and records the Gmail message ID', async () => {
    sqlMock.mockResolvedValueOnce([{refresh_token:'encrypted',scopes:'https://www.googleapis.com/auth/gmail.readonly'}])
      .mockResolvedValueOnce([lead()]).mockResolvedValueOnce([{id:10}])
    vi.stubGlobal('fetch',gmailFetch())
    const response=await GET(request('',true))
    await expect(response.json()).resolves.toMatchObject({ok:true,matched:1,moved:1})
    const [parts,...values]=sqlMock.mock.calls[2] as [TemplateStringsArray,...unknown[]]
    expect(parts.join('?')).toContain("SET stage = 'contacted'")
    expect(parts.join('?')).toContain('last_sent_message_id')
    expect(parts.join('?')).toContain("'id', ?::text")
    expect(parts.join('?')).toContain("'gmail_message_id', ?::text")
    expect(values).toContain('sent-1')
  })

  it('keeps contacted duplicate cards in the candidate set so a rerun cannot move their twin', async () => {
    sqlMock.mockResolvedValueOnce([{refresh_token:'encrypted',scopes:'https://www.googleapis.com/auth/gmail.readonly'}])
      .mockResolvedValueOnce([{...lead(),stage:'contacted',gmail_draft_id:null,
        gmail_draft_created_at:null,gmail_draft_subject:null},{...lead(),id:11,
        gmail_draft_id:null,gmail_draft_created_at:null,gmail_draft_subject:null}])
    vi.stubGlobal('fetch',gmailFetch())
    const response=await GET(request('',true))
    await expect(response.json()).resolves.toMatchObject({ok:true,matched:0,moved:0})
    expect(sqlMock).toHaveBeenCalledTimes(2)
    expect((sqlMock.mock.calls[1][0] as TemplateStringsArray).join(' '))
      .toContain("FROM leads WHERE trim(email) <> ''")
  })

  it('never assigns a Gmail message that an earlier CRM sync already recorded', async () => {
    sqlMock.mockResolvedValueOnce([{refresh_token:'encrypted',scopes:'https://www.googleapis.com/auth/gmail.readonly'}])
      .mockResolvedValueOnce([{...lead(),id:11,gmail_draft_id:null,
        gmail_draft_created_at:null,gmail_draft_subject:null},
        {...lead(),id:10,stage:'contacted',last_sent_message_id:'sent-1'}])
    vi.stubGlobal('fetch',gmailFetch())
    const response=await GET(request('',true))
    await expect(response.json()).resolves.toMatchObject({ok:true,matched:0,moved:0})
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })
})
