import { describe, expect, it } from 'vitest'

import { buildLeadPrompt, LeadDraftError, parseDraftedEmail } from '@/lib/lead-email-draft'

describe('parseDraftedEmail', () => {
  it('parses a Subject line and body separated by a blank line', () => {
    const parsed = parseDraftedEmail(
      'Subject: Question on NOAA forecast modernization\n\nHello,\n\nBody paragraph long enough to pass validation.\n\nRespectfully,',
    )
    expect(parsed.subject).toBe('Question on NOAA forecast modernization')
    expect(parsed.bodyText).toContain('Body paragraph')
    expect(parsed.bodyText.endsWith('Respectfully,')).toBe(true)
  })

  it('tolerates a code fence wrapped around the whole reply', () => {
    const parsed = parseDraftedEmail(
      '```\nSubject: Fenced subject\n\nHello,\n\nA body long enough to clear the minimum-length validation gate.\n```',
    )
    expect(parsed.subject).toBe('Fenced subject')
  })

  it('rejects a reply with no Subject line', () => {
    expect(() => parseDraftedEmail('Hello,\n\nJust a body with no subject line at all here.')).toThrow(
      LeadDraftError,
    )
  })

  it('rejects a reply whose body is too short to be a real email', () => {
    expect(() => parseDraftedEmail('Subject: Something\n\nToo short.')).toThrow(LeadDraftError)
  })
})

describe('buildLeadPrompt', () => {
  it('includes the govcon analysis fields and skips empties', () => {
    const prompt = buildLeadPrompt({
      title: 'NOAA Weather Program Office BAA',
      organization: 'NOAA',
      notes: null,
      source: 'opportunity-radar',
      govcon: {
        source: 'grants.gov',
        analysis: 'Strong fit for AI/ML downscaling.',
        fit_reasons: ['SDVOSB set-aside', 'Atmospheric science scope'],
        cautions: [],
        amount: '$500,000',
        deadline: '2026-10-01',
        irrelevant_key: 'should not appear',
      },
    })
    expect(prompt).toContain('Opportunity: NOAA Weather Program Office BAA')
    expect(prompt).toContain('Radar analysis: Strong fit for AI/ML downscaling.')
    expect(prompt).toContain('Fit reasons: SDVOSB set-aside; Atmospheric science scope')
    expect(prompt).toContain('Amount: $500,000')
    expect(prompt).not.toContain('Cautions:')
    expect(prompt).not.toContain('Notes:')
    expect(prompt).not.toContain('should not appear')
  })

  it('surfaces source_id as the solicitation/notice number but never a URL fallback', () => {
    const base = { title: 'Lead', organization: null, notes: null, source: null }
    expect(buildLeadPrompt({ ...base, govcon: { source_id: 'W912BV-26-R-0042' } })).toContain(
      'Solicitation / notice number: W912BV-26-R-0042',
    )
    expect(
      buildLeadPrompt({ ...base, govcon: { source_id: 'https://example.gov/notice/1' } }),
    ).not.toContain('Solicitation / notice number')
  })

  it('caps oversized fields instead of sending them whole', () => {
    const prompt = buildLeadPrompt({
      title: 'Lead',
      organization: null,
      notes: 'x'.repeat(5000),
      source: null,
      govcon: null,
    })
    expect(prompt).toContain('[truncated]')
    expect(prompt.length).toBeLessThan(3000)
  })
})
