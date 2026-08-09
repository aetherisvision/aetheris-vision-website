import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { hasPreviewSession } from '@/lib/preview-auth'

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

  // Site lock: the public site remains gated while Agentic OG is prepared for
  // reliable demos and published results. A signed cookie avoids browser-native
  // Basic Auth dialogs, which do not work consistently in embedded browsers.
  // /admin/* retains its separate passphrase gate below.
  const isPreviewAccessRoute =
    pathname === '/preview' || pathname === '/api/preview/auth'
  if (
    process.env.PREVIEW_PASSWORD &&
    !pathname.startsWith('/admin') &&
    !isPreviewAccessRoute &&
    !(await hasPreviewSession(request))
  ) {
    const loginUrl = new URL('/preview', request.url)
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
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
  // Authenticated admin API traffic gets a far higher ceiling: the coarse
  // limit exists for anonymous abuse, but the passphrase-gated demo page
  // legitimately polls job status every few seconds (a 3-method comparison
  // run alone is ~100 requests), and the old shared 100/15min budget made
  // the Download button 429 right after a successful run.
  const isAuthedAdminApi =
    isApiRoute && pathname.startsWith('/api/admin/') && (await isAdminSession(request))
  const maxRequests = isAuthedAdminApi ? 2000 : 100
  let rateRemaining = maxRequests - 1
  if (isApiRoute) {
    const result = await rateLimit(ip, {
      limit: maxRequests,
      windowMs: 15 * 60 * 1000, // 15 minutes
      prefix: isAuthedAdminApi ? 'proxy-api-admin' : 'proxy-api',
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
