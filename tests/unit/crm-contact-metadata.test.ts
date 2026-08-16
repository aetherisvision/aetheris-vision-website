import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sql: Object.assign(vi.fn(), { transaction: vi.fn() }),
  transactionSql: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: mocks.sql }))

import { captureContactLead, createOrLinkIntakeGraph } from '@/lib/crm'

describe('verified CRM contact metadata', () => {
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

  it('records verified time and a coarse location on a contact lead', async () => {
    mocks.transactionSql.mockResolvedValueOnce([{ lead_id: 41, stage: 'new', created: true }])
    const verifiedAt = new Date('2026-08-16T12:01:00.000Z')

    await expect(
      captureContactLead({
        name: 'A Client',
        email: 'CLIENT@EXAMPLE.COM',
        message: 'Please contact us.',
        externalRef: 'submission-1',
        coarseLocation: ' Norman, Oklahoma ',
        emailVerifiedAt: verifiedAt,
      }),
    ).resolves.toEqual({ leadId: 41, stage: 'new', created: true })

    const [strings, ...values] = mocks.transactionSql.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(strings.join(' ')).toContain('location, email_verified_at')
    expect(strings.join(' ')).toContain(
      'email_verified_at = COALESCE(leads.email_verified_at, EXCLUDED.email_verified_at)',
    )
    expect(values[1]).toBe('client@example.com')
    expect(values[8]).toBe('Norman, Oklahoma')
    expect(values[9]).toBe(verifiedAt.toISOString())
  })

  it('keeps project location distinct from coarse lead location during intake', async () => {
    mocks.transactionSql.mockResolvedValueOnce([
      {
        lead_id: 41,
        client_id: 42,
        project_id: 43,
        intake_id: 44,
        lead_stage: 'new',
        project_status: 'proposal',
        created: true,
      },
    ])
    const verifiedAt = '2026-08-16T12:01:00.000Z'

    await expect(
      createOrLinkIntakeGraph({
        externalRef: 'intake-submission-1',
        companyName: 'Example Company',
        contactName: 'A Client',
        contactEmail: 'client@example.com',
        emailVerifiedAt: verifiedAt,
        location: 'Norman, Oklahoma',
      }),
    ).resolves.toMatchObject({ leadId: 41, clientId: 42, projectId: 43, intakeId: 44 })

    const [strings, ...values] = mocks.transactionSql.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ]
    const text = strings.join(' ')
    expect(text).toContain('location, email_verified_at')
    expect(values).toContain(null)
    expect(values).toContain('Norman, Oklahoma')
    expect(values).toContain(verifiedAt)
  })

  it('rejects overlong location labels and invalid verification times before a transaction', async () => {
    await expect(
      captureContactLead({
        name: 'A Client',
        email: 'client@example.com',
        message: 'Hello',
        coarseLocation: 'x'.repeat(161),
        emailVerifiedAt: '2026-08-16T12:01:00.000Z',
      }),
    ).rejects.toThrow(/160 characters or fewer/)

    await expect(
      captureContactLead({
        name: 'A Client',
        email: 'client@example.com',
        message: 'Hello',
        emailVerifiedAt: 'not-a-date',
      }),
    ).rejects.toThrow(/emailVerifiedAt is invalid/)
    expect(mocks.sql.transaction).not.toHaveBeenCalled()
  })
})
