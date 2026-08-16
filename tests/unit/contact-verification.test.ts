import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))

import {
  beginEmailVerification,
  cancelEmailVerification,
  completeEmailChallenge,
  verifyEmailChallenge,
} from '@/lib/contact-verification'

const SECRET = 'contact-verification-test-secret-at-least-32-bytes'
const VERIFIED_AT = new Date('2026-08-16T12:01:00.000Z')
const EXPIRES_AT = new Date('2026-08-16T12:10:00.000Z')

interface BegunChallenge {
  challengeId: string
  code: string
  codeHash: string
}

async function createChallenge(): Promise<BegunChallenge> {
  sqlMock.mockResolvedValueOnce([{ expires_at: EXPIRES_AT }])
  const challenge = await beginEmailVerification({
    purpose: 'contact',
    email: ' Person@Example.COM ',
    submissionId: 'submission-1',
  })
  const values = sqlMock.mock.calls[0]?.slice(1) as unknown[]
  const codeHash = values[4] as string
  sqlMock.mockReset()
  return { challengeId: challenge.challengeId, code: challenge.code, codeHash }
}

function verificationInput(challenge: BegunChallenge, code = challenge.code) {
  return {
    challengeId: challenge.challengeId,
    code,
    purpose: 'contact' as const,
    email: 'person@example.com',
    submissionId: 'submission-1',
  }
}

function challengeRow(
  challenge: BegunChallenge,
  overrides: Partial<{
    attempts: number
    expired: boolean
    verified_at: Date | string | null
    completed_at: Date | string | null
  }> = {},
) {
  return {
    id: challenge.challengeId,
    code_hash: challenge.codeHash,
    attempts: 0,
    expired: false,
    verified_at: null,
    completed_at: null,
    ...overrides,
  }
}

describe('email contact verification lifecycle', () => {
  beforeEach(() => {
    sqlMock.mockReset()
    vi.stubEnv('CONTACT_VERIFICATION_SECRET', SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('creates a six-digit, short-lived challenge without storing email or code plaintext', async () => {
    sqlMock.mockResolvedValueOnce([{ expires_at: EXPIRES_AT }])

    const result = await beginEmailVerification({
      purpose: 'contact',
      email: ' Person@Example.COM ',
      submissionId: 'submission-1',
    })

    expect(result).toMatchObject({ expiresAt: EXPIRES_AT.toISOString() })
    expect(result.challengeId).toMatch(/^[0-9a-f-]{36}$/)
    expect(result.code).toMatch(/^\d{6}$/)

    const [strings, ...values] = sqlMock.mock.calls[0] as [TemplateStringsArray, ...unknown[]]
    expect(strings.join(' ')).toContain('ON CONFLICT (purpose, submission_id)')
    expect(values).toHaveLength(6)
    expect(values[1]).toBe('contact')
    expect(values[2]).toBe('submission-1')
    expect(values[3]).toMatch(/^[0-9a-f]{64}$/)
    expect(values[4]).toMatch(/^[0-9a-f]{64}$/)
    expect(values[5]).toBe(600)
    expect(values).not.toContain('person@example.com')
    expect(values).not.toContain(result.code)
  })

  it('verifies the correct code atomically and permits a verified retry before completion', async () => {
    const challenge = await createChallenge()
    sqlMock
      .mockResolvedValueOnce([challengeRow(challenge)])
      .mockResolvedValueOnce([{ verified_at: VERIFIED_AT, completed_at: null }])

    await expect(verifyEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: true,
      verifiedAt: VERIFIED_AT.toISOString(),
      completed: false,
    })
    expect(sqlMock).toHaveBeenCalledTimes(2)
    expect((sqlMock.mock.calls[1]?.[0] as TemplateStringsArray).join(' ')).toContain(
      'AND attempts =',
    )

    sqlMock.mockReset()
    sqlMock.mockResolvedValueOnce([
      challengeRow(challenge, { verified_at: VERIFIED_AT }),
    ])
    await expect(verifyEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: true,
      verifiedAt: VERIFIED_AT.toISOString(),
      completed: false,
    })
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('recovers a concurrent successful verification through its compare-and-set retry', async () => {
    const challenge = await createChallenge()
    sqlMock
      .mockResolvedValueOnce([challengeRow(challenge)])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([challengeRow(challenge, { verified_at: VERIFIED_AT })])

    await expect(verifyEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: true,
      verifiedAt: VERIFIED_AT.toISOString(),
      completed: false,
    })
    expect(sqlMock).toHaveBeenCalledTimes(3)
  })

  it('increments failed attempts atomically and locks the challenge at the limit', async () => {
    const challenge = await createChallenge()
    const wrongCode = challenge.code === '000000' ? '000001' : '000000'
    sqlMock
      .mockResolvedValueOnce([challengeRow(challenge, { attempts: 4 })])
      .mockResolvedValueOnce([{ attempts: 5 }])

    await expect(verifyEmailChallenge(verificationInput(challenge, wrongCode))).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    })

    sqlMock.mockReset()
    sqlMock
      .mockResolvedValueOnce([challengeRow(challenge, { attempts: 5 })])
      .mockResolvedValueOnce([{ attempts: 6 }])
    await expect(verifyEmailChallenge(verificationInput(challenge, wrongCode))).resolves.toEqual({
      ok: false,
      reason: 'attempts',
    })
  })

  it('distinguishes expired, completed, exhausted, and unknown challenge state internally', async () => {
    const challenge = await createChallenge()

    sqlMock.mockResolvedValueOnce([challengeRow(challenge, { expired: true })])
    await expect(verifyEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: false,
      reason: 'expired',
    })

    sqlMock.mockReset()
    sqlMock.mockResolvedValueOnce([
      challengeRow(challenge, { completed_at: '2026-08-16T12:02:00.000Z' }),
    ])
    await expect(verifyEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: false,
      reason: 'used',
    })

    sqlMock.mockReset()
    sqlMock.mockResolvedValueOnce([challengeRow(challenge, { attempts: 6 })])
    await expect(verifyEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: false,
      reason: 'attempts',
    })

    sqlMock.mockReset()
    sqlMock.mockResolvedValueOnce([])
    await expect(verifyEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    })
  })

  it('completes exactly once and makes completion retries idempotent', async () => {
    const challenge = await createChallenge()
    const completedAt = new Date('2026-08-16T12:02:00.000Z')
    sqlMock.mockResolvedValueOnce([{ completed_at: completedAt, completed_now: true }])

    await expect(completeEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: true,
      completedAt: completedAt.toISOString(),
      completedNow: true,
    })

    sqlMock.mockReset()
    sqlMock.mockResolvedValueOnce([{ completed_at: completedAt, completed_now: false }])
    await expect(completeEmailChallenge(verificationInput(challenge))).resolves.toEqual({
      ok: true,
      completedAt: completedAt.toISOString(),
      completedNow: false,
    })
  })

  it('cancels only the exact, unverified challenge binding', async () => {
    const challenge = await createChallenge()
    sqlMock.mockResolvedValueOnce([])

    await cancelEmailVerification(verificationInput(challenge))

    expect(sqlMock).toHaveBeenCalledTimes(1)
    const [strings, ...values] = sqlMock.mock.calls[0] as [TemplateStringsArray, ...unknown[]]
    expect(strings.join(' ')).toContain('verified_at IS NULL')
    expect(strings.join(' ')).toContain('completed_at IS NULL')
    expect(values).toContain(challenge.challengeId)
    expect(values).toContain('submission-1')
    expect(values).not.toContain('person@example.com')
  })

  it('handles malformed bindings generically without querying storage', async () => {
    await expect(
      verifyEmailChallenge({
        challengeId: 'not-a-uuid',
        code: '123456',
        purpose: 'contact',
        email: 'person@example.com',
        submissionId: 'submission-1',
      }),
    ).resolves.toEqual({ ok: false, reason: 'invalid' })
    expect(sqlMock).not.toHaveBeenCalled()

    vi.stubEnv('CONTACT_VERIFICATION_SECRET', 'short')
    await expect(
      beginEmailVerification({
        purpose: 'contact',
        email: 'person@example.com',
        submissionId: 'submission-1',
      }),
    ).rejects.toThrow(/at least 32 bytes/)
    expect(sqlMock).not.toHaveBeenCalled()
  })
})
