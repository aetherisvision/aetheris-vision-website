import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { hasPreviewSession } from '@/lib/preview-auth'

const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('')

/**
 * Verify the admin session cookie using Web Crypto (Edge Runtime compatible).
 * Token format and key derivation mirror src/lib/admin-auth.ts exactly:
 * `<sid>.<exp>.<HMAC-SHA256(key, "sid.exp")>`, key = ADMIN_SESSION_SECRET or
 * sha256("av-admin-session-key|" + ADMIN_PASSPHRASE) as hex.
 */
async function isAdminSession(request: NextRequest): Promise<boolean> {
  const cookieValue = request.cookies.get('av-admin-session')?.value
  if (!cookieValue) return false
  const enc = new TextEncoder()
  let keyMaterial = process.env.ADMIN_SESSION_SECRET
  if (!keyMaterial) {
    const passphrase = process.env.ADMIN_PASSPHRASE
    if (!passphrase) return false
    keyMaterial = hex(await crypto.subtle.digest('SHA-256', enc.encode(`av-admin-session-key|${passphrase}`)))
  }
  const parts = cookieValue.split('.')
  if (parts.length !== 3) return false
  const [sid, exp, sig] = parts
  if (!/^[a-f0-9]{32}$/.test(sid) || !/^\d{1,12}$/.test(exp) || !/^[a-f0-9]{64}$/.test(sig)) return false
  if (Number(exp) <= Math.floor(Date.now() / 1000)) return false
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(keyMaterial), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const expected = hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${sid}.${exp}`)))
  // Constant-time comparison via length check + XOR fold
  if (sig.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}


function buildCsp(nonce: string): string {
  const allowEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${allowEval} https://analytics.google.com https://www.googletagmanager.com https://js.stripe.com https://giscus.app https://cal.com https://app.cal.com https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://giscus.app",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: https://avatars.githubusercontent.com https://github.githubassets.com",
    "connect-src 'self' https://api.stripe.com https://analytics.google.com https://giscus.app https://api.github.com https://challenges.cloudflare.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://giscus.app https://cal.com https://app.cal.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ]

  // WebKit upgrades even localhost subresources when this directive is present,
  // which breaks local development because Next.js serves HTTP locally.
  if (process.env.NODE_ENV === 'production') {
    directives.push("upgrade-insecure-requests")
  }

  return directives.join('; ')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip processing for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo/') ||
    pathname.startsWith('/images/')
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

  // Site lock: the public site remains gated while the new consulting site is
  // prepared for launch. A signed cookie avoids browser-native
  // Basic Auth dialogs, which do not work consistently in embedded browsers.
  // /admin/* retains its separate passphrase gate below.
  // Every handler under /api/auth/gmail/ enforces isAdmin itself, so the whole
  // prefix bypasses the site lock — new routes there must keep that guarantee.
  const isPreviewAccessRoute =
    pathname === '/preview' ||
    pathname === '/api/preview/auth' ||
    pathname.startsWith('/api/auth/gmail/')
  // Crawler meta files bypass only the lock (crawlers must always be able to
  // read crawl policy) but stay in the matcher so they still get the
  // CSP/security headers applied below.
  const isCrawlerMetaRoute =
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json'
  if (
    process.env.PREVIEW_PASSWORD &&
    !pathname.startsWith('/admin') &&
    !isPreviewAccessRoute &&
    !isCrawlerMetaRoute &&
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
  const isAdminApiPath =
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/expenses') ||
    pathname.startsWith('/api/receipts/')
  // Verify once; both the rate-limit tier and the guard below reuse the result.
  const hasAdminSession =
    isAdminApiPath || pathname.startsWith('/admin') ? await isAdminSession(request) : false
  const isAuthedAdminApi = isApiRoute && pathname.startsWith('/api/admin/') && hasAdminSession
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

  // Admin API guard — every handler also checks isAdmin() itself; this makes a
  // forgotten check in a future route fail closed instead of open.
  const isAdminApi = isAdminApiPath && pathname !== '/api/admin/auth'
  if (isAdminApi && !hasAdminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin auth guard
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login'
    const hasSession = hasAdminSession

    if (!isLoginPage && !hasSession) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isLoginPage && hasSession) {
      return NextResponse.redirect(new URL('/admin/leads', request.url))
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  // Next.js reads the nonce from the request CSP while rendering server and
  // framework scripts. Keep the same policy on the request and response so
  // Turnstile can load without weakening script-src with unsafe-inline.
  requestHeaders.set('Content-Security-Policy', csp)

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
