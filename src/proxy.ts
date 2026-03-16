import { NextRequest, NextResponse } from 'next/server'

function buildCsp(nonce: string): string {
  return [
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://giscus.app https://cal.com https://app.cal.com`,
    "frame-src 'self' https://giscus.app https://cal.com https://app.cal.com",
    "style-src 'self' 'unsafe-inline' https://giscus.app",
    "img-src 'self' data: https://avatars.githubusercontent.com https://github.githubassets.com",
    "connect-src 'self' https://giscus.app https://api.github.com",
    "font-src 'self'",
    "default-src 'self'",
  ].join('; ')
}

const ADMIN_COOKIE = 'av-admin-session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo/')
  ) {
    return NextResponse.next()
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

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
