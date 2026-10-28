import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mintAdminSessionToken } from '../helpers/admin-session'
import { hashMagicLinkToken } from '@/lib/magic-link-token'

// In Vitest's jsdom environment, Node's built-in TextEncoder returns a outer-realm
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
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('completes the full HTTPS magic-link round-trip and decodes the __Secure-authjs.session-token across client routes', async () => {
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
      if (query.includes('DELETE FROM verification_tokens')) {
        const email = String(values[0])
        const presentedHash = String(values[1])
        if (email === storedEmail && presentedHash === storedTokenHash && storedTokenHash) {
          storedTokenHash = '' // consumed atomically
          return [{ identifier: email }]
        }
        return []
      }
      if (query.includes('SELECT id, contact_name AS name, email')) {
        return [{ id: 1, name: 'Finny Koshy', email: 'finny.koshy1@gmail.com' }]
      }
      if (query.includes('FROM projects') && query.includes('WHERE client_id =')) {
        return [
          {
            id: 1,
            name: 'Tropical Hut OKC — Website project',
            status: 'signed',
            start_date: '2026-04-01',
            signed_at: '2026-04-02T12:00:00Z',
            docuseal_submission_id: 'sub_tropical_hut_1',
            signed_doc_url: '/api/client/projects/1/signed-sow',
            current_phase: 'development',
            preview_url: 'https://tropicalhut-preview.aetherisvision.com',
          },
        ]
      }
      if (query.includes('SELECT name, signed_pdf_base64')) {
        const projectId = Number(values[0])
        const clientId = Number(values[1])
        if (projectId === 1 && clientId === 1) {
          return [
            {
              name: 'Tropical Hut OKC',
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

    // 1. Request magic link with mixed-case email
    const { POST: sendMagicPost } = await import('@/app/api/auth/send-magic/route')
    const sendRes = await sendMagicPost(
      new NextRequest('https://aetherisvision.com/api/auth/send-magic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://aetherisvision.com',
          'x-forwarded-for': '198.51.100.25',
        },
        body: JSON.stringify({ email: 'Finny.Koshy1@Gmail.com' }),
      }),
    )
    expect(sendRes.status).toBe(200)
    await expect(sendRes.json()).resolves.toEqual({ sent: true })
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)

    // Extract raw token from the magic link sent via Resend
    const emailPayload = mocks.sendEmail.mock.calls[0][0] as { html: string }
    const tokenMatch = emailPayload.html.match(/token=([a-f0-9]{64})/)
    expect(tokenMatch).not.toBeNull()
    const rawToken = tokenMatch![1]
    expect(hashMagicLinkToken(rawToken)).toBe(storedTokenHash)

    // 2. Redeem magic link via POST /api/auth/magic
    const { POST: verifyMagicPost } = await import('@/app/api/auth/magic/route')
    const form = new FormData()
    form.set('token', rawToken)
    form.set('email', 'Finny.Koshy1@Gmail.com')

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
    replayForm.set('email', 'finny.koshy1@gmail.com')
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
      docuseal_submission_id: 'sub_tropical_hut_1',
      signed_doc_url: '/api/client/projects/1/signed-sow',
    })

    // 5. Client can stream their signed SOW PDF from /api/client/projects/1/signed-sow
    const { GET: getSignedSow } = await import('@/app/api/client/projects/[id]/signed-sow/route')
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

    // Another project ID not owned by this client returns 404 (no IDOR)
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

  it('mints a working client session via admin impersonation and wires DocuSeal submission IDs on projects (#15)', async () => {
    mocks.sql.mockImplementation(async (strings: TemplateStringsArray) => {
      const query = strings.join(' ')
      if (query.includes('SELECT id, contact_name AS name, email')) {
        return [{ id: 1, name: 'Finny Koshy', email: 'finny.koshy1@gmail.com' }]
      }
      if (query.includes('FROM projects') && query.includes('WHERE client_id =')) {
        return [{ id: 1, name: 'Tropical Hut OKC', docuseal_submission_id: 'sub_th_okc_2026' }]
      }
      return []
    })

    const adminCookie = `av-admin-session=${mintAdminSessionToken(TEST_ADMIN_PASSPHRASE)}`

    // Admin links DocuSeal submission ID and preview URL to Tropical Hut (project id=1)
    const { PATCH: patchAdminProject } = await import('@/app/api/admin/projects/route')
    const patchRes = await patchAdminProject(
      new NextRequest('https://aetherisvision.com/api/admin/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          id: 1,
          current_phase: 'proposal',
          docuseal_submission_id: 'sub_th_okc_2026',
          preview_url: 'https://tropicalhut-preview.aetherisvision.com',
        }),
      }),
    )
    expect(patchRes.status).toBe(200)

    // Invalid DocuSeal submission ID is rejected with 400
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

    // Admin impersonates client id=1 and reads /api/client/projects
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
