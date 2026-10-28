/**
 * Cache-Control policy for the CDN in front of Cloud Run.
 *
 * Shared by `next.config.ts` (response headers) and `src/proxy.ts` (which
 * skips the per-request CSP nonce and rate-limit work for pure static files).
 * HTML is intentionally absent: `src/app/layout.tsx` reads `headers()` for
 * the CSP nonce, so every page renders per request and Next.js emits
 * `private, no-cache, no-store` for it. Caching HTML would also pin one
 * visitor's nonce into another visitor's policy.
 *
 * Keep this module free of Node-only imports; the proxy runs on the edge
 * runtime and `next.config.ts` is evaluated before the app is built.
 */

/** Content-hashed build output; the URL changes whenever the bytes do. */
export const IMMUTABLE_ASSET_CACHE = 'public, max-age=31536000, immutable'

/**
 * Un-hashed files under public/. A week in browsers and the CDN, served stale
 * for up to a year while the next copy is fetched in the background.
 */
export const STATIC_ASSET_CACHE = 'public, max-age=604800, stale-while-revalidate=31536000'

/** Small metadata files that must pick up edits within the hour. */
export const META_FILE_CACHE = 'public, max-age=3600, stale-while-revalidate=86400'

/** Anything personalised, authenticated, or cookie/nonce dependent. */
export const PRIVATE_NO_STORE = 'private, no-store'

/**
 * Prefixes under public/ (plus the Next build output) that never carry a
 * cookie, nonce, or personalisation. The proxy returns early for these.
 */
export const STATIC_ASSET_PREFIXES = [
  '/_next/',
  '/favicon',
  '/logo/',
  '/images/',
  '/earth-textures/',
] as const

/** True for paths that must bypass the CSP-nonce / rate-limit path entirely. */
export function isStaticAssetPath(pathname: string): boolean {
  return STATIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Route prefixes whose responses depend on a session cookie, a bearer secret,
 * or a webhook signature. Handlers already set `no-store` individually; this
 * is the fail-closed default so a new route under one of these prefixes is
 * never shared by the CDN.
 */
export const PRIVATE_ROUTE_SOURCES = [
  '/admin/:path*',
  '/client/:path*',
  '/preview',
  '/api/admin/:path*',
  '/api/auth/:path*',
  '/api/client/:path*',
  '/api/expenses/:path*',
  '/api/expenses',
  '/api/receipts/:path*',
  '/api/preview/:path*',
  '/api/cron/:path*',
  '/api/webhooks/:path*',
  '/api/integrations/:path*',
] as const

export type HeaderRule = {
  source: string
  headers: { key: string; value: string }[]
}

const cacheControl = (value: string) => [{ key: 'Cache-Control', value }]

/** Ordered header rules for `next.config.ts` `headers()`. */
export function cacheControlHeaderRules(): HeaderRule[] {
  return [
    { source: '/_next/static/:path*', headers: cacheControl(IMMUTABLE_ASSET_CACHE) },
    { source: '/earth-textures/:path*', headers: cacheControl(STATIC_ASSET_CACHE) },
    { source: '/logo/:path*', headers: cacheControl(STATIC_ASSET_CACHE) },
    { source: '/images/:path*', headers: cacheControl(STATIC_ASSET_CACHE) },
    { source: '/favicon.ico', headers: cacheControl(STATIC_ASSET_CACHE) },
    { source: '/manifest.json', headers: cacheControl(META_FILE_CACHE) },
    { source: '/robots.txt', headers: cacheControl(META_FILE_CACHE) },
    { source: '/sitemap.xml', headers: cacheControl(META_FILE_CACHE) },
    ...PRIVATE_ROUTE_SOURCES.map((source) => ({ source, headers: cacheControl(PRIVATE_NO_STORE) })),
  ]
}
