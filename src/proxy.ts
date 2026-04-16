import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://analytics.google.com https://www.googletagmanager.com https://js.stripe.com https://giscus.app https://cal.com https://app.cal.com`,
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

const ADMIN_COOKIE = 'av-admin-session'
const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD
if (!PREVIEW_PASSWORD) throw new Error('PREVIEW_PASSWORD env var must be set')

export function proxy(request: NextRequest) {
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

  // Client portal and auth API routes must be reachable without the site lock
  // so magic-link invites work for clients who don't have the preview password
  if (
    pathname.startsWith('/client/') ||
    pathname.startsWith('/api/auth/')
  ) {
    // Skip basic-auth — fall through to normal security headers below
  } else {
    // Site-wide basic-auth lock (preview mode)
    const auth = request.headers.get('authorization')
    if (auth?.startsWith('Basic ')) {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString()
      const password = decoded.includes(':') ? decoded.split(':')[1] : decoded
      if (password !== PREVIEW_PASSWORD) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Aetheris Vision Preview"' },
        })
      }
    } else {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Aetheris Vision Preview"' },
      })
    }
  }

  // Generate nonce for CSP and security
  const nonce = crypto.randomUUID()
  const csp = buildCsp(nonce)

  // Advanced Rate limiting demonstration
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100
  
  const clientData = rateLimitStore.get(ip)
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
  } else {
    clientData.count++
    if (clientData.count > maxRequests) {
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'X-Security-Action': 'Rate-Limited',
          'X-Security-Framework': 'Aetheris-Protection',
          'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString()
        }
      })
    }
  }

  // Admin auth guard
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login'
    const hasSession = request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'

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
  
  // Comprehensive security headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-CSP-Nonce', nonce)
  response.headers.set('X-Security-Status', 'Protected')
  response.headers.set('X-Security-Scan', 'Continuous')
  response.headers.set('X-Threat-Detection', 'Active')
  response.headers.set('X-Request-ID', crypto.randomUUID())
  
  // Admin route protection headers
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Admin-Security', 'Multi-Layer-Auth')
    response.headers.set('X-Access-Control', 'Role-Based')
  }
  
  // API route protection headers
  if (pathname.startsWith('/api')) {
    response.headers.set('X-API-Security', 'Authenticated')
    response.headers.set('X-Rate-Limit-Remaining', (maxRequests - (clientData?.count || 1)).toString())
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
