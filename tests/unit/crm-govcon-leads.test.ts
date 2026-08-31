import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sql: Object.assign(vi.fn(), { transaction: vi.fn() }),
  transactionSql: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: mocks.sql }))

import { captureGovconLead, updateGovconLead, prepareLeadProposal } from '@/lib/crm'

describe('opportunity-radar govcon lead capture', () => {
  beforeEach(() => {
    mocks.transactionSql.mockReset()
    mocks.sql.transaction.mockReset()
    mocks.sql.transaction.mockImplementation(
      async (callback: (sql: typeof mocks.transactionSql) => unknown[]) => {
        const queries = callback(mocks.transactionSql)
        return Promise.all(queries)
      },
    )
  })

  it('captures a lead with no contact email without throwing, using empty string not null', async () => {
    mocks.transactionSql.mockResolvedValueOnce([{ lead_id: 7, stage: 'new', created: true }])

    await expect(
      captureGovconLead({
        title: 'Consulting Flood Hydrologist Services for FERC',
        externalRef: 'SAM.gov:abc123',
        agency: 'Federal Energy Regulatory Commission',
        govcon: { naics: '541620', deadline: '2026-09-01' },
      }),
    ).resolves.toEqual({ leadId: 7, stage: 'new', created: true })

    const [strings, ...values] = mocks.transactionSql.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(strings.join(' ')).toContain('govcon')
    // Bound-parameter order: name, email, organization, phone, message,
    // source, external_id, ... (service is a literal NULL, not a parameter).
    expect(values[1]).toBe('')
    expect(values[6]).toBe('SAM.gov:abc123')
  })

  it('always writes source as opportunity-radar -- callers cannot override it', async () => {
    mocks.transactionSql.mockResolvedValueOnce([{ lead_id: 8, stage: 'new', created: true }])

    await captureGovconLead({
      title: 'Water utility outreach',
      externalRef: 'water:OK0001',
    })

    const [, ...values] = mocks.transactionSql.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(values).toContain('opportunity-radar')
  })

  it('rejects a missing title or externalRef before opening a transaction', async () => {
    await expect(
      captureGovconLead({ title: '', externalRef: 'SAM.gov:x' }),
    ).rejects.toThrow(/title is required/)

    await expect(
      captureGovconLead({ title: 'A notice', externalRef: '' }),
    ).rejects.toThrow(/externalRef is required/)

    expect(mocks.sql.transaction).not.toHaveBeenCalled()
  })

  it('returns null when updating a lead that does not exist, instead of throwing', async () => {
    mocks.transactionSql.mockResolvedValueOnce([])

    await expect(
      updateGovconLead({ externalRef: 'SAM.gov:missing', stage: 'contacted' }),
    ).resolves.toBeNull()
  })

  it('scopes the update to source in the SQL WHERE clause, not just app logic', async () => {
    mocks.transactionSql.mockResolvedValueOnce([{ lead_id: 9, stage: 'contacted' }])

    await updateGovconLead({
      externalRef: 'SAM.gov:abc123',
      stage: 'contacted',
      govconPatch: { drive_folder: 'AV-2026-0011' },
    })

    const [strings, ...values] = mocks.transactionSql.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ]
    const text = strings.join(' ')
    expect(text).toContain('WHERE source =')
    expect(text).toContain('external_id =')
    expect(values).toContain('opportunity-radar')
    expect(values).toContain('SAM.gov:abc123')
  })

  it('guards stage moves with the transition table and never writes over won', async () => {
    mocks.transactionSql.mockResolvedValueOnce([{ lead_id: 9, stage: 'declined' }])

    await updateGovconLead({ externalRef: 'SAM.gov:abc123', stage: 'declined' })

    const [strings, ...values] = mocks.transactionSql.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ]
    const text = strings.join(' ')
    // Conditional SET, not WHERE: a blocked transition keeps the current
    // stage while the rest of the patch still applies.
    expect(text).toContain("stage <> 'won' AND stage = ANY(")
    // 'declined' is only reachable from the review inbox (or itself).
    expect(values).toContainEqual(['review', 'declined'])
  })

  it('passes a null transition list when no stage change is requested', async () => {
    mocks.transactionSql.mockResolvedValueOnce([{ lead_id: 9, stage: 'contacted' }])

    await updateGovconLead({
      externalRef: 'SAM.gov:abc123',
      govconPatch: { reply_status: 'replied' },
    })

    const [, ...values] = mocks.transactionSql.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(values[0]).toBeNull() // stage
    expect(values[1]).toBeNull() // allowed-from list
  })

  it('only refreshes value and follow-up while the lead is still scan-owned', async () => {
    mocks.transactionSql.mockResolvedValueOnce([{ lead_id: 7, stage: 'new', created: false }])

    await captureGovconLead({
      title: 'Re-synced notice',
      externalRef: 'SAM.gov:abc123',
      estimatedValueCents: 100_000,
      nextFollowUp: '2026-09-15T00:00:00Z',
    })

    const [strings] = mocks.transactionSql.mock.calls[0] as [TemplateStringsArray, ...unknown[]]
    const text = strings.join(' ')
    // Human-editable fields refresh only in review/declined; a lead a human
    // has advanced keeps its edited value and follow-up date.
    expect(text).toContain("WHEN leads.stage IN ('review', 'declined')")
    // govcon itself stays scan-owned and always refreshes.
    expect(text).toContain('govcon = COALESCE(EXCLUDED.govcon, leads.govcon)')
  })

  it('rejects preparing a proposal for a govcon lead with no contact email, without opening a transaction', async () => {
    mocks.sql.mockResolvedValueOnce([{ email: '' }])

    await expect(
      prepareLeadProposal({ leadId: 12, projectName: 'FERC hydrology consulting' }),
    ).rejects.toThrow(/no contact email on file/)

    expect(mocks.sql.transaction).not.toHaveBeenCalled()
  })

  it('also rejects a whitespace-only email, which normalizes to blank under btrim', async () => {
    mocks.sql.mockResolvedValueOnce([{ email: '   ' }])

    await expect(
      prepareLeadProposal({ leadId: 12, projectName: 'FERC hydrology consulting' }),
    ).rejects.toThrow(/no contact email on file/)

    expect(mocks.sql.transaction).not.toHaveBeenCalled()
  })

  it('proceeds to the transaction for a lead with a real contact email', async () => {
    mocks.sql.mockResolvedValueOnce([{ email: 'client@example.com' }])
    mocks.transactionSql.mockResolvedValueOnce([
      { lead_id: 12, client_id: 5, project_id: 9, lead_stage: 'proposal', project_status: 'proposal' },
    ])

    await expect(
      prepareLeadProposal({ leadId: 12, projectName: 'FERC hydrology consulting' }),
    ).resolves.toEqual({
      leadId: 12,
      clientId: 5,
      projectId: 9,
      leadStage: 'proposal',
      projectStatus: 'proposal',
    })
  })
})
