import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Verify the admin session cookie using Web Crypto (Edge Runtime compatible).
 * Mirrors the Node.js HMAC-SHA256 logic in src/lib/admin-auth.ts.
 */
async function isAdminSession(request: NextRequest): Promise<boolean> {
  const cookieValue = request.cookies.get('av-admin-session')?.value
  const passphrase = process.env.ADMIN_PASSPHRASE
  if (!cookieValue || !passphrase) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('admin-session'))
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  // Constant-time comparison via length check + XOR fold
  if (cookieValue.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}


/**
 * HTTP Basic Auth site lock, checked in Edge Runtime (Web Crypto, no Buffer).
 * Returns a 401 response if the request should be blocked, or null to let
 * it through. Unset PREVIEW_PASSWORD disables the lock entirely — the site
 * is open by default and must be explicitly locked.
 */
function checkSiteLock(request: NextRequest): NextResponse | null {
  const password = process.env.PREVIEW_PASSWORD
  if (!password) return null

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice('Basic '.length))
    const separatorIndex = decoded.indexOf(':')
    const suppliedPassword = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1)
    if (constantTimeEqual(suppliedPassword, password)) {
      return null
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Aetheris Vision"' },
  })
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

function buildCsp(nonce: string): string {
  const allowEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${allowEval} https://analytics.google.com https://www.googletagmanager.com https://js.stripe.com https://giscus.app https://cal.com https://app.cal.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://giscus.app",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: https://avatars.githubusercontent.com https://github.githubassets.com",
    "connect-src 'self' https://api.stripe.com https://analytics.google.com https://giscus.app https://api.github.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://giscus.app https://cal.com https://app.cal.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip processing for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo/')
  ) {
    return NextResponse.next()
  }

  // Webhooks must be reachable by external services regardless of site-lock state
  if (pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  // Vercel Cron must reach /api/cron/* without site lock.
  // Cron routes enforce their own auth (e.g. CRON_SECRET) at the handler level.
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next()
  }

  // Site lock: the public site is intentionally gated while it's retooled
  // around Agentic OG. /admin/* keeps its own passphrase gate below and
  // stays reachable through this check (rather than being blocked by it)
  // so admin work isn't blocked by the site lock.
  if (!pathname.startsWith('/admin')) {
    const lockResponse = checkSiteLock(request)
    if (lockResponse) return lockResponse
  }

  // Generate nonce for CSP and security
  const nonce = crypto.randomUUID()
  const csp = buildCsp(nonce)

  // Coarse per-IP rate limit. Distributed (shared across all Vercel instances)
  // when Upstash/Vercel KV is configured, else in-memory fallback (issue #12).
  // Scoped to /api/* so we don't pay a Redis round-trip on every page view;
  // the abuse surface is the API, and sensitive POST routes add their own
  // tighter per-route limits.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const isApiRoute = pathname === '/api' || pathname.startsWith('/api/')
  const maxRequests = 100
  let rateRemaining = maxRequests - 1
  if (isApiRoute) {
    const result = await rateLimit(ip, {
      limit: maxRequests,
      windowMs: 15 * 60 * 1000, // 15 minutes
      prefix: 'proxy-api',
    })
    rateRemaining = result.remaining
    if (!result.success) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': result.retryAfterSeconds.toString() },
      })
    }
  }

  // Admin auth guard
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login'
    const hasSession = await isAdminSession(request)

    if (!isLoginPage && !hasSession) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isLoginPage && hasSession) {
      return NextResponse.redirect(new URL('/admin/clients', request.url))
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Security headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-CSP-Nonce', nonce)
  response.headers.set('X-Request-ID', crypto.randomUUID())

  // API routes report remaining rate-limit budget
  if (isApiRoute) {
    response.headers.set('X-Rate-Limit-Remaining', Math.max(0, rateRemaining).toString())
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
