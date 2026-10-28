import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mintAdminSessionToken } from '../helpers/admin-session'
import { hashMagicLinkToken } from '@/lib/magic-link-token'

// In Vitest's jsdom environment, Node's built-in TextEncoder returns an outer-realm
// Uint8Array, which fails jose's `plaintext instanceof Uint8Array` check during
// Auth.js v5 JWE encryption. Wrap TextEncoder.prototype.encode so it returns a
// current-realm Uint8Array.
const NativeTextEncoder = globalThis.TextEncoder
class RealmTextEncoder extends NativeTextEncoder {
  override encode(input?: string): Uint8Array<ArrayBuffer> {
    return new Uint8Array(super.encode(input))
  }
}
globalThis.TextEncoder = RealmTextEncoder

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: mocks.sql }))
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.sendEmail }
  },
}))

const TEST_AUTH_SECRET = 'test-authjs-v5-secret-at-least-32-characters-long'
const TEST_ADMIN_PASSPHRASE = 'test-admin-passphrase-for-portal'
const TEST_CONTACT_SECRET = 'test-contact-verification-secret-at-least-32-bytes'

function extractCookiePair(setCookieHeader: string | null): { name: string; value: string } {
  expect(setCookieHeader).toBeTruthy()
  const firstSegment = setCookieHeader!.split(';', 1)[0]
  const eq = firstSegment.indexOf('=')
  return {
    name: firstSegment.slice(0, eq),
    value: firstSegment.slice(eq + 1),
  }
}

describe('Auth.js v5 magic-link login round-trip and DocuSeal client portal wiring (#62, #15)', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.sql.mockReset()
    mocks.sendEmail.mockReset()
    mocks.sendEmail.mockResolvedValue({ data: { id: 'email-1' }, error: null })
    vi.stubEnv('NEXTAUTH_SECRET', TEST_AUTH_SECRET)
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_ADMIN_PASSPHRASE)
    vi.stubEnv('CONTACT_VERIFICATION_SECRET', TEST_CONTACT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('completes the full HTTPS magic-link round-trip, normalizes emails on write, and decodes __Secure-authjs.session-token across client routes', async () => {
    let storedTokenHash = ''
    let storedEmail = ''

    mocks.sql.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.join(' ')
      if (query.includes('SELECT id FROM clients')) {
        return [{ id: 1 }]
      }
      if (query.includes('INSERT INTO verification_tokens')) {
        storedEmail = String(values[0])
        storedTokenHash = String(values[1])
        return []
      }
      if (query.includes('DELETE FROM verification_tokens') && query.includes('RETURNING identifier')) {
        const email = String(values[0])
        const presentedHash = String(values[1])
        if (email === storedEmail && presentedHash === storedTokenHash && storedTokenHash) {
          storedTokenHash = ''
          return [{ identifier: email }]
        }
        return []
      }
      if (query.includes('SELECT id, contact_name AS name, email')) {
        return [{ id: 1, name: 'Jane Client', email: 'client@example.com' }]
      }
      if (query.includes('FROM projects') && query.includes('WHERE client_id =')) {
        return [
          {
            id: 1,
            name: 'Example Portal Project',
            status: 'signed',
            start_date: '2026-04-01',
            signed_at: '2026-04-02T12:00:00Z',
            docuseal_submission_id: 'sub_example_project_1',
            signed_doc_url: '/api/client/projects/1/signed-sow',
            current_phase: 'development',
            preview_url: 'https://preview.example.com',
          },
        ]
      }
      if (query.includes('SELECT name, signed_pdf_base64')) {
        const projectId = Number(values[0])
        const clientId = Number(values[1])
        if (projectId === 1 && clientId === 1) {
          return [
            {
              name: 'Example Portal Project',
              signed_pdf_base64: Buffer.from('%PDF-1.4 signed SOW').toString('base64'),
            },
          ]
        }
        return []
      }
      if (query.includes('FROM documents')) {
        return [{ id: 10, title: 'Statement of Work', updated_at: '2026-04-02T12:00:00Z' }]
      }
      if (query.includes('FROM invoices')) {
        return [
          {
            id: 20,
            number: 'INV-0001',
            description: 'Project deposit',
            amount_cents: 140000,
            status: 'sent',
            stripe_invoice_url: 'https://invoice.stripe.com/i/acct_test/test',
          },
        ]
      }
      return []
    })

    // 1. Request magic link with mixed-case email and verify lowercase storage on write
    const { POST: sendMagicPost } = await import('@/app/api/auth/send-magic/route')
    const sendRes = await sendMagicPost(
      new NextRequest('https://aetherisvision.com/api/auth/send-magic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://aetherisvision.com',
          'x-forwarded-for': '198.51.100.25',
        },
        body: JSON.stringify({ email: '  Jane.Client@Example.com  ' }),
      }),
    )
    expect(sendRes.status).toBe(200)
    await expect(sendRes.json()).resolves.toEqual({ sent: true })
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(storedEmail).toBe('jane.client@example.com')

    const emailPayload = mocks.sendEmail.mock.calls[0][0] as { html: string; to: string }
    expect(emailPayload.to).toBe('jane.client@example.com')
    const tokenMatch = emailPayload.html.match(/token=([a-f0-9]{64})/)
    expect(tokenMatch).not.toBeNull()
    const rawToken = tokenMatch![1]
    expect(hashMagicLinkToken(rawToken)).toBe(storedTokenHash)

    // 2. Redeem magic link via POST /api/auth/magic
    const { POST: verifyMagicPost } = await import('@/app/api/auth/magic/route')
    const form = new FormData()
    form.set('token', rawToken)
    form.set('email', 'Jane.Client@Example.com')

    const verifyRes = await verifyMagicPost(
      new NextRequest('https://aetherisvision.com/api/auth/magic', {
        method: 'POST',
        body: form,
      }),
    )
    expect(verifyRes.status).toBe(303)
    expect(verifyRes.headers.get('location')).toBe('https://aetherisvision.com/client/dashboard')

    const setCookie = verifyRes.headers.get('set-cookie')
    expect(setCookie).toContain('__Secure-authjs.session-token=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    const cookie = extractCookiePair(setCookie)
    expect(cookie.name).toBe('__Secure-authjs.session-token')

    // 3. Replaying the consumed magic-link token fails closed
    const replayForm = new FormData()
    replayForm.set('token', rawToken)
    replayForm.set('email', 'jane.client@example.com')
    const replayRes = await verifyMagicPost(
      new NextRequest('https://aetherisvision.com/api/auth/magic', {
        method: 'POST',
        body: replayForm,
      }),
    )
    expect(replayRes.status).toBe(303)
    expect(replayRes.headers.get('location')).toBe('https://aetherisvision.com/client/login?error=1')

    // 4. Authenticated client portal API routes decode the JWE token (proving encode salt === decode salt)
    const cookieHeader = `${cookie.name}=${cookie.value}`
    const { GET: getClientProjects } = await import('@/app/api/client/projects/route')
    const projectsRes = await getClientProjects(
      new NextRequest('https://aetherisvision.com/api/client/projects', {
        headers: { Cookie: cookieHeader },
      }),
    )
    expect(projectsRes.status).toBe(200)
    const projectsBody = (await projectsRes.json()) as {
      projects: Array<{ docuseal_submission_id: string; signed_doc_url: string }>
    }
    expect(projectsBody.projects[0]).toMatchObject({
      docuseal_submission_id: 'sub_example_project_1',
      signed_doc_url: '/api/client/projects/1/signed-sow',
    })

    // 5. Signed SOW route: 401 unauthenticated, 400 invalid ID, 404 other client, 200 owner
    const { GET: getSignedSow } = await import('@/app/api/client/projects/[id]/signed-sow/route')
    const unauthSowRes = await getSignedSow(
      new NextRequest('https://aetherisvision.com/api/client/projects/1/signed-sow'),
      { params: Promise.resolve({ id: '1' }) },
    )
    expect(unauthSowRes.status).toBe(401)

    const badIdSowRes = await getSignedSow(
      new NextRequest('https://aetherisvision.com/api/client/projects/abc/signed-sow', {
        headers: { Cookie: cookieHeader },
      }),
      { params: Promise.resolve({ id: 'abc' }) },
    )
    expect(badIdSowRes.status).toBe(400)

    const sowRes = await getSignedSow(
      new NextRequest('https://aetherisvision.com/api/client/projects/1/signed-sow', {
        headers: { Cookie: cookieHeader },
      }),
      { params: Promise.resolve({ id: '1' }) },
    )
    expect(sowRes.status).toBe(200)
    expect(sowRes.headers.get('content-type')).toBe('application/pdf')
    expect(sowRes.headers.get('cache-control')).toBe('private, no-store')
    expect(await sowRes.text()).toBe('%PDF-1.4 signed SOW')

    const otherSowRes = await getSignedSow(
      new NextRequest('https://aetherisvision.com/api/client/projects/999/signed-sow', {
        headers: { Cookie: cookieHeader },
      }),
      { params: Promise.resolve({ id: '999' }) },
    )
    expect(otherSowRes.status).toBe(404)

    const { GET: getClientDocs } = await import('@/app/api/client/documents/route')
    const docsRes = await getClientDocs(
      new NextRequest('https://aetherisvision.com/api/client/documents', {
        headers: { Cookie: cookieHeader },
      }),
    )
    expect(docsRes.status).toBe(200)

    const { GET: getClientInvoices } = await import('@/app/api/client/invoices/route')
    const invRes = await getClientInvoices(
      new NextRequest('https://aetherisvision.com/api/client/invoices', {
        headers: { Cookie: cookieHeader },
      }),
    )
    expect(invRes.status).toBe(200)
  })

  it('preserves existing milestone dates on partial PATCH, returns 409 on duplicate DocuSeal ID, and supports admin impersonation (#15)', async () => {
    mocks.sql.mockImplementation(async (strings: TemplateStringsArray) => {
      const query = strings.join(' ')
      if (query.includes('SELECT id, contact_name AS name, email')) {
        return [{ id: 1, name: 'Jane Client', email: 'client@example.com' }]
      }
      if (query.includes('FROM projects') && query.includes('WHERE client_id =')) {
        return [{ id: 1, name: 'Example Project', docuseal_submission_id: 'sub_project_2026' }]
      }
      return []
    })

    const adminCookie = `av-admin-session=${mintAdminSessionToken(TEST_ADMIN_PASSPHRASE)}`
    const { PATCH: patchAdminProject } = await import('@/app/api/admin/projects/route')

    // 1. Partial PATCH of docuseal_submission_id only must pass has<Date> = false for all 6 milestone dates
    const patchRes = await patchAdminProject(
      new NextRequest('https://aetherisvision.com/api/admin/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          id: 1,
          docuseal_submission_id: 'sub_project_2026',
        }),
      }),
    )
    expect(patchRes.status).toBe(200)

    const updateCall = mocks.sql.mock.calls[0]
    const updateQuery = (updateCall[0] as TemplateStringsArray).join(' ')
    const updateValues = updateCall.slice(1)
    expect(updateQuery).toContain('phase_proposal_date    = CASE')
    // hasCurrentPhase, hasProposalDate, hasKickoffDate, hasDesignDate, hasDevelopmentDate, hasReviewDate, hasLaunchedDate are all false
    expect(updateValues[0]).toBe(false) // hasCurrentPhase
    expect(updateValues[2]).toBe(false) // hasProposalDate
    expect(updateValues[4]).toBe(false) // hasKickoffDate
    expect(updateValues[6]).toBe(false) // hasDesignDate
    expect(updateValues[8]).toBe(false) // hasDevelopmentDate
    expect(updateValues[10]).toBe(false) // hasReviewDate
    expect(updateValues[12]).toBe(false) // hasLaunchedDate
    expect(updateValues[14]).toBe(true) // hasSubmissionPatch
    expect(updateValues[15]).toBe('sub_project_2026')

    // 2. Duplicate docuseal_submission_id (Postgres 23505 unique violation) returns 409
    mocks.sql.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key value violates unique constraint "projects_docuseal_submission_uidx"'), {
        code: '23505',
      }),
    )
    const dupRes = await patchAdminProject(
      new NextRequest('https://aetherisvision.com/api/admin/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          id: 2,
          docuseal_submission_id: 'sub_project_2026',
        }),
      }),
    )
    expect(dupRes.status).toBe(409)
    await expect(dupRes.json()).resolves.toEqual({
      error: 'That DocuSeal submission ID is already linked to another project',
    })

    // 3. Invalid DocuSeal submission ID is rejected with 400
    const badPatchRes = await patchAdminProject(
      new NextRequest('https://aetherisvision.com/api/admin/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          id: 1,
          docuseal_submission_id: 'https://evil.example/not-an-id',
        }),
      }),
    )
    expect(badPatchRes.status).toBe(400)

    // 4. Admin impersonates client id=1 and reads /api/client/projects
    const { POST: impersonatePost } = await import('@/app/api/admin/clients/impersonate/route')
    const impRes = await impersonatePost(
      new NextRequest('https://aetherisvision.com/api/admin/clients/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({ clientId: 1 }),
      }),
    )
    expect(impRes.status).toBe(200)
    const impCookie = extractCookiePair(impRes.headers.get('set-cookie'))

    const { GET: getClientProjects } = await import('@/app/api/client/projects/route')
    const projectsRes = await getClientProjects(
      new NextRequest('https://aetherisvision.com/api/client/projects', {
        headers: { Cookie: `${impCookie.name}=${impCookie.value}` },
      }),
    )
    expect(projectsRes.status).toBe(200)
  })
})
