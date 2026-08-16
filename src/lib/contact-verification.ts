import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'

import { sql } from '@/lib/db'

export type EmailVerificationPurpose = 'contact' | 'intake'

export type EmailVerificationFailureReason = 'invalid' | 'expired' | 'used' | 'attempts'

export type EmailVerificationResult =
  | { ok: true; verifiedAt: string; completed: boolean }
  | { ok: false; reason: EmailVerificationFailureReason }

export type CompleteEmailVerificationResult =
  | { ok: true; completedAt: string; completedNow: boolean }
  | { ok: false; reason: Exclude<EmailVerificationFailureReason, 'used'> }

interface ChallengeBinding {
  challengeId: string
  purpose: EmailVerificationPurpose
  submissionId: string
  emailHash: string
}

interface ChallengeRow {
  id: string
  code_hash: string
  attempts: number
  expired: boolean
  verified_at: Date | string | null
  completed_at: Date | string | null
}

interface BegunRow {
  expires_at: Date | string
}

interface AttemptRow {
  attempts: number
}

interface VerifiedRow {
  verified_at: Date | string
  completed_at: Date | string | null
}

interface CompletedRow {
  completed_at: Date | string
  completed_now: boolean
}

const CHALLENGE_TTL_SECONDS = 10 * 60
const MAX_ATTEMPTS = 6
const MAX_STATE_RETRIES = 6
const MINIMUM_SECRET_BYTES = 32
const EMAIL_MAX_LENGTH = 320
const SUBMISSION_ID_MAX_LENGTH = 128
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_PATTERN = /^\d{6}$/

function verificationSecret(): Buffer {
  const value = process.env.CONTACT_VERIFICATION_SECRET
  if (!value || Buffer.byteLength(value, 'utf8') < MINIMUM_SECRET_BYTES) {
    throw new Error(
      `CONTACT_VERIFICATION_SECRET must contain at least ${MINIMUM_SECRET_BYTES} bytes`,
    )
  }
  return Buffer.from(value, 'utf8')
}

function assertPurpose(value: EmailVerificationPurpose): EmailVerificationPurpose {
  if (value !== 'contact' && value !== 'intake') {
    throw new TypeError('purpose must be contact or intake')
  }
  return value
}

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase()
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new TypeError('email is invalid')
  }
  return email
}

function normalizeSubmissionId(value: string): string {
  const submissionId = value.trim()
  if (
    !submissionId ||
    submissionId.length > SUBMISSION_ID_MAX_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(submissionId)
  ) {
    throw new TypeError('submissionId is invalid')
  }
  return submissionId
}

function normalizeChallengeId(value: string): string | null {
  const challengeId = value.trim().toLowerCase()
  return UUID_PATTERN.test(challengeId) ? challengeId : null
}

function domainHmac(domain: string, ...values: string[]): string {
  const hmac = createHmac('sha256', verificationSecret())
  hmac.update('aetherisvision-contact-verification-v1\0', 'utf8')
  hmac.update(domain, 'utf8')
  for (const value of values) {
    hmac.update('\0', 'utf8')
    hmac.update(value, 'utf8')
  }
  return hmac.digest('hex')
}

function hashEmail(email: string): string {
  return domainHmac('email', email)
}

function hashCode(binding: ChallengeBinding, code: string): string {
  return domainHmac(
    'code',
    binding.challengeId,
    binding.purpose,
    binding.submissionId,
    binding.emailHash,
    code,
  )
}

function constantTimeEqualHex(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'hex')
  const rightBytes = Buffer.from(right, 'hex')
  if (leftBytes.byteLength !== 32 || rightBytes.byteLength !== 32) {
    const dummy = Buffer.alloc(32)
    timingSafeEqual(dummy, dummy)
    return false
  }
  return timingSafeEqual(leftBytes, rightBytes)
}

function buildBinding(input: {
  challengeId: string
  purpose: EmailVerificationPurpose
  email: string
  submissionId: string
}): ChallengeBinding | null {
  try {
    const challengeId = normalizeChallengeId(input.challengeId)
    const purpose = assertPurpose(input.purpose)
    const email = normalizeEmail(input.email)
    const submissionId = normalizeSubmissionId(input.submissionId)
    if (!challengeId) return null
    return { challengeId, purpose, submissionId, emailHash: hashEmail(email) }
  } catch {
    return null
  }
}

function isoTimestamp(value: Date | string): string {
  const timestamp = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(timestamp.valueOf())) throw new Error('Database returned an invalid timestamp')
  return timestamp.toISOString()
}

async function readChallenge(binding: ChallengeBinding): Promise<ChallengeRow | null> {
  const rows = (await sql`
    SELECT
      id,
      code_hash,
      attempts,
      expires_at <= now() AS expired,
      verified_at,
      completed_at
    FROM contact_verification_challenges
    WHERE id = ${binding.challengeId}::uuid
      AND purpose = ${binding.purpose}
      AND submission_id = ${binding.submissionId}
      AND email_hash = ${binding.emailHash}
    LIMIT 1
  `) as ChallengeRow[]
  return rows[0] ?? null
}

function stateFailure(row: ChallengeRow | null): EmailVerificationResult {
  if (!row) return { ok: false, reason: 'invalid' }
  if (row.completed_at !== null) return { ok: false, reason: 'used' }
  if (row.expired) return { ok: false, reason: 'expired' }
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'attempts' }
  return { ok: false, reason: 'invalid' }
}

/**
 * Create or replace the one active challenge for a submission. The plaintext
 * code is returned only so the server route can deliver it; it is never stored.
 */
export async function beginEmailVerification(input: {
  purpose: EmailVerificationPurpose
  email: string
  submissionId: string
}): Promise<{ challengeId: string; code: string; expiresAt: string }> {
  const purpose = assertPurpose(input.purpose)
  const email = normalizeEmail(input.email)
  const submissionId = normalizeSubmissionId(input.submissionId)
  const challengeId = randomUUID()
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  const binding: ChallengeBinding = {
    challengeId,
    purpose,
    submissionId,
    emailHash: hashEmail(email),
  }
  const codeHash = hashCode(binding, code)

  const rows = (await sql`
    INSERT INTO contact_verification_challenges (
      id, purpose, submission_id, email_hash, code_hash, attempts,
      expires_at, verified_at, completed_at, created_at, updated_at
    )
    VALUES (
      ${challengeId}::uuid, ${purpose}, ${submissionId}, ${binding.emailHash}, ${codeHash}, 0,
      now() + make_interval(secs => ${CHALLENGE_TTL_SECONDS}), NULL, NULL, now(), now()
    )
    ON CONFLICT (purpose, submission_id)
    DO UPDATE SET
      id = EXCLUDED.id,
      email_hash = EXCLUDED.email_hash,
      code_hash = EXCLUDED.code_hash,
      attempts = 0,
      expires_at = EXCLUDED.expires_at,
      verified_at = NULL,
      completed_at = NULL,
      created_at = now(),
      updated_at = now()
    RETURNING expires_at
  `) as BegunRow[]

  const begun = rows[0]
  if (!begun) throw new Error('Email verification challenge was not created')
  const expiresAt = isoTimestamp(begun.expires_at)

  return { challengeId, code, expiresAt }
}

/** Verify a code with constant-time comparison and an atomic attempts counter. */
export async function verifyEmailChallenge(input: {
  challengeId: string
  code: string
  purpose: EmailVerificationPurpose
  email: string
  submissionId: string
}): Promise<EmailVerificationResult> {
  const binding = buildBinding(input)
  const suppliedCode = typeof input.code === 'string' ? input.code.trim() : ''
  const candidateHash = hashCode(
    binding ?? {
      challengeId: '00000000-0000-4000-8000-000000000000',
      purpose: 'contact',
      submissionId: 'invalid-binding',
      emailHash: domainHmac('invalid-email'),
    },
    suppliedCode.slice(0, 64),
  )

  if (!binding) {
    constantTimeEqualHex(candidateHash, domainHmac('dummy-code'))
    return { ok: false, reason: 'invalid' }
  }

  for (let retry = 0; retry < MAX_STATE_RETRIES; retry += 1) {
    const row = await readChallenge(binding)
    const storedHash = row?.code_hash ?? domainHmac('dummy-code')
    const codeMatches = constantTimeEqualHex(candidateHash, storedHash) && CODE_PATTERN.test(suppliedCode)

    if (!row) return { ok: false, reason: 'invalid' }
    if (row.completed_at !== null) return { ok: false, reason: 'used' }
    if (row.expired) return { ok: false, reason: 'expired' }
    if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'attempts' }

    if (row.verified_at !== null) {
      return codeMatches
        ? {
            ok: true,
            verifiedAt: isoTimestamp(row.verified_at),
            completed: false,
          }
        : { ok: false, reason: 'invalid' }
    }

    if (!codeMatches) {
      const rows = (await sql`
        UPDATE contact_verification_challenges
        SET attempts = attempts + 1, updated_at = now()
        WHERE id = ${binding.challengeId}::uuid
          AND purpose = ${binding.purpose}
          AND submission_id = ${binding.submissionId}
          AND email_hash = ${binding.emailHash}
          AND attempts = ${row.attempts}
          AND attempts < ${MAX_ATTEMPTS}
          AND verified_at IS NULL
          AND completed_at IS NULL
          AND expires_at > now()
        RETURNING attempts
      `) as AttemptRow[]

      const attempted = rows[0]
      if (!attempted) continue
      return attempted.attempts >= MAX_ATTEMPTS
        ? { ok: false, reason: 'attempts' }
        : { ok: false, reason: 'invalid' }
    }

    const rows = (await sql`
      UPDATE contact_verification_challenges
      SET verified_at = now(), updated_at = now()
      WHERE id = ${binding.challengeId}::uuid
        AND purpose = ${binding.purpose}
        AND submission_id = ${binding.submissionId}
        AND email_hash = ${binding.emailHash}
        AND attempts = ${row.attempts}
        AND attempts < ${MAX_ATTEMPTS}
        AND verified_at IS NULL
        AND completed_at IS NULL
        AND expires_at > now()
      RETURNING verified_at, completed_at
    `) as VerifiedRow[]

    const verified = rows[0]
    if (!verified) continue
    return {
      ok: true,
      verifiedAt: isoTimestamp(verified.verified_at),
      completed: verified.completed_at !== null,
    }
  }

  return stateFailure(await readChallenge(binding))
}

/** Mark a verified challenge consumed; retries return the original completion. */
export async function completeEmailChallenge(input: {
  challengeId: string
  purpose: EmailVerificationPurpose
  email: string
  submissionId: string
}): Promise<CompleteEmailVerificationResult> {
  const binding = buildBinding(input)
  if (!binding) return { ok: false, reason: 'invalid' }

  const rows = (await sql`
    WITH current AS MATERIALIZED (
      SELECT id, completed_at
      FROM contact_verification_challenges
      WHERE id = ${binding.challengeId}::uuid
        AND purpose = ${binding.purpose}
        AND submission_id = ${binding.submissionId}
        AND email_hash = ${binding.emailHash}
        AND verified_at IS NOT NULL
        AND attempts < ${MAX_ATTEMPTS}
        AND (completed_at IS NOT NULL OR expires_at > now())
      FOR UPDATE
    ), completed AS (
      UPDATE contact_verification_challenges AS challenge
      SET completed_at = COALESCE(challenge.completed_at, now()),
          updated_at = CASE WHEN challenge.completed_at IS NULL THEN now() ELSE challenge.updated_at END
      FROM current
      WHERE challenge.id = current.id
      RETURNING challenge.completed_at, (current.completed_at IS NULL) AS completed_now
    )
    SELECT completed_at, completed_now FROM completed
  `) as CompletedRow[]

  const completed = rows[0]
  if (completed) {
    return {
      ok: true,
      completedAt: isoTimestamp(completed.completed_at),
      completedNow: completed.completed_now,
    }
  }

  const state = await readChallenge(binding)
  if (!state) return { ok: false, reason: 'invalid' }
  if (state.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'attempts' }
  if (state.expired) return { ok: false, reason: 'expired' }
  return { ok: false, reason: 'invalid' }
}

/** Remove an undelivered challenge without being able to cancel a newer reissue. */
export async function cancelEmailVerification(input: {
  challengeId: string
  purpose: EmailVerificationPurpose
  email: string
  submissionId: string
}): Promise<void> {
  const binding = buildBinding(input)
  if (!binding) return

  await sql`
    DELETE FROM contact_verification_challenges
    WHERE id = ${binding.challengeId}::uuid
      AND purpose = ${binding.purpose}
      AND submission_id = ${binding.submissionId}
      AND email_hash = ${binding.emailHash}
      AND verified_at IS NULL
      AND completed_at IS NULL
  `
}
