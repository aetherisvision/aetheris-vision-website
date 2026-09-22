import { describe, expect, it } from 'vitest'
import { matchSentMessage, type CorrespondenceLead, type SentMessage } from '@/lib/lead-correspondence'

const sentAt = Date.parse('2026-09-22T12:00:00Z')
function lead(id: number, patch: Partial<CorrespondenceLead> = {}): CorrespondenceLead {
  return {
    id, stage:'new', name:'NAWCAD Long Range Acquisition Forecast', email:'officer@navy.mil',
    source:'opportunity-radar', created_at:'2026-09-01T00:00:00Z',
    gmail_draft_id:null, gmail_draft_created_at:null, gmail_draft_subject:null,
    gmail_thread_id:null, source_id:null, ...patch,
  }
}
function message(patch: Partial<SentMessage> = {}): SentMessage {
  return {id:'sent-1',threadId:'thread-1',sentAt,to:'Officer <officer@navy.mil>',
    subject:'NAWCAD Long Range Acquisition Forecast question',...patch}
}

describe('sent correspondence matching', () => {
  it('requires a sent message addressed to the exact lead contact after lead creation', () => {
    expect(matchSentMessage([lead(1)], message({to:'someone-else@navy.mil'}))).toBeNull()
    expect(matchSentMessage([lead(1, {created_at:'2026-09-23T00:00:00Z'})], message())).toBeNull()
    expect(matchSentMessage([lead(1)], message())?.id).toBe(1)
  })

  it('refuses a shared agency address when two opportunities fit the subject equally', () => {
    expect(matchSentMessage([lead(1),lead(2)],message())).toBeNull()
    expect(matchSentMessage([lead(1,{stage:'contacted'}),lead(2)],message())).toBeNull()
  })

  it('uses a unique opportunity reference rather than a shared address or similar title', () => {
    const first=lead(1,{source_id:'ff41905dc0864f419c8f60b673b6292b'})
    const second=lead(2,{source_id:'8a75a70fc12640c182b1d4e5c7ea8dee'})
    expect(matchSentMessage([first,second],message({subject:'Re: PEO-SDA notice ff41905dc0864f419c8f60b673b6292b'}))?.id).toBe(1)
  })

  it('matches a sent or replied draft by its thread or saved subject', () => {
    const first=lead(1,{gmail_thread_id:'thread-1'})
    const second=lead(2,{gmail_thread_id:'other-thread'})
    expect(matchSentMessage([first,second],message({subject:'Re: changed by sender'}))?.id).toBe(1)
    const saved=lead(1,{gmail_draft_subject:'Forecast question',gmail_draft_created_at:'2026-09-20T00:00:00Z'})
    expect(matchSentMessage([saved,lead(2)],message({subject:'Re: Forecast question'}))?.id).toBe(1)
    expect(matchSentMessage([saved],message({sentAt:Date.parse('2026-09-19T00:00:00Z'),subject:'Forecast question'}))).toBeNull()
  })

  it('uses a single drafted card for duplicate Radar listings when its title fits', () => {
    const drafted=lead(2,{gmail_draft_id:'draft-message',gmail_draft_created_at:'2026-09-20T00:00:00Z'})
    expect(matchSentMessage([lead(1),drafted],message())?.id).toBe(2)
  })

  it('can match a single website inquiry by its direct reply recipient', () => {
    expect(matchSentMessage([lead(3,{source:'website_intake'})],message({subject:'Re: Your inquiry'}))?.id).toBe(3)
  })
})
