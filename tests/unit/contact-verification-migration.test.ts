import { describe, expect, it } from 'vitest'

import { contactVerificationMigration } from '@/lib/db/migrations/005_contact_verification'
import { collectMigrationStatements } from '@/lib/db/migrations/execution'

describe('contact verification migration', () => {
  it('adds verified lead metadata and a privacy-preserving challenge store', () => {
    const statements = collectMigrationStatements(contactVerificationMigration)
    const sql = statements.map((statement) => statement.text).join('\n').toLowerCase()
    const challengeTable = statements[1]?.text.toLowerCase() ?? ''

    expect(contactVerificationMigration.id).toBe('005_contact_verification')
    expect(statements).toHaveLength(6)
    expect(sql).toContain('add column if not exists location text')
    expect(sql).toContain('add column if not exists email_verified_at timestamptz')
    expect(challengeTable).toContain('email_hash')
    expect(challengeTable).toContain('code_hash')
    expect(challengeTable).toContain('expires_at')
    expect(challengeTable).toContain('verified_at')
    expect(challengeTable).toContain('completed_at')
    expect(sql).toContain("purpose in ('contact', 'intake')")
    expect(sql).toContain('attempts between 0 and 6')
    expect(sql).toContain('verified_at <= expires_at')
    expect(sql).toContain('completed_at <= expires_at')
    expect(sql).toContain('unique index if not exists contact_verification_purpose_submission_uidx')

    expect(challengeTable).not.toMatch(/\bemail\s+text\b/)
    expect(challengeTable).not.toMatch(/\bcode\s+text\b/)
    expect(challengeTable).not.toMatch(/\b(?:raw_)?ip\b|fingerprint|precise_location/)
    expect(challengeTable).not.toMatch(/message|project_text|requirements/)
  })
})
