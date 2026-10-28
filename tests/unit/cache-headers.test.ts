import { describe, expect, it } from 'vitest'
import {
  IMMUTABLE_ASSET_CACHE,
  META_FILE_CACHE,
  PRIVATE_NO_STORE,
  STATIC_ASSET_CACHE,
  STATIC_ASSET_PREFIXES,
  cacheControlHeaderRules,
  isStaticAssetPath,
} from '@/lib/cache-headers'
import nextConfig from '../../next.config'

type Rule = { source: string; headers: { key: string; value: string }[] }

function cacheControlFor(rules: Rule[], source: string): string | undefined {
  return rules.find((rule) => rule.source === source)?.headers.find((h) => h.key === 'Cache-Control')?.value
}

describe('CDN Cache-Control matrix', () => {
  const rules = cacheControlHeaderRules()

  it.each([
    ['/_next/static/:path*', IMMUTABLE_ASSET_CACHE],
    ['/earth-textures/:path*', STATIC_ASSET_CACHE],
    ['/logo/:path*', STATIC_ASSET_CACHE],
    ['/images/:path*', STATIC_ASSET_CACHE],
    ['/favicon.ico', STATIC_ASSET_CACHE],
    ['/manifest.json', META_FILE_CACHE],
    ['/robots.txt', META_FILE_CACHE],
    ['/sitemap.xml', META_FILE_CACHE],
    ['/admin/:path*', PRIVATE_NO_STORE],
    ['/client/:path*', PRIVATE_NO_STORE],
    ['/preview', PRIVATE_NO_STORE],
    ['/api/admin/:path*', PRIVATE_NO_STORE],
    ['/api/auth/:path*', PRIVATE_NO_STORE],
    ['/api/client/:path*', PRIVATE_NO_STORE],
    ['/api/expenses', PRIVATE_NO_STORE],
    ['/api/expenses/:path*', PRIVATE_NO_STORE],
    ['/api/receipts/:path*', PRIVATE_NO_STORE],
    ['/api/preview/:path*', PRIVATE_NO_STORE],
    ['/api/cron/:path*', PRIVATE_NO_STORE],
    ['/api/webhooks/:path*', PRIVATE_NO_STORE],
    ['/api/integrations/:path*', PRIVATE_NO_STORE],
  ])('%s -> %s', (source, expected) => {
    expect(cacheControlFor(rules, source)).toBe(expected)
  })

  it('uses shareable, long-lived values only for assets and private no-store elsewhere', () => {
    expect(IMMUTABLE_ASSET_CACHE).toBe('public, max-age=31536000, immutable')
    expect(STATIC_ASSET_CACHE).toMatch(/^public, max-age=\d+, stale-while-revalidate=\d+$/)
    expect(META_FILE_CACHE).toMatch(/^public, max-age=3600/)
    expect(PRIVATE_NO_STORE).toBe('private, no-store')
    for (const rule of rules) {
      const value = cacheControlFor(rules, rule.source) ?? ''
      if (rule.source.startsWith('/api/') || rule.source.startsWith('/admin') || rule.source.startsWith('/client') || rule.source === '/preview') {
        expect(value).toBe(PRIVATE_NO_STORE)
      } else {
        expect(value).toMatch(/^public, /)
        expect(value).not.toMatch(/private|no-store/)
      }
    }
  })

  it('never lists an HTML page route: the CSP nonce keeps HTML no-store', () => {
    const sources = rules.map((rule) => rule.source)
    for (const page of ['/', '/(.*)', '/about', '/services/:path*', '/blog/:path*', '/contact', '/omni-gridder']) {
      expect(sources).not.toContain(page)
    }
  })

  it('is wired into next.config.ts ahead of the security headers', async () => {
    const configured = (await nextConfig.headers?.()) ?? []
    const sources = configured.map((rule) => rule.source)
    for (const rule of rules) {
      expect(sources).toContain(rule.source)
      expect(cacheControlFor(configured as Rule[], rule.source)).toBe(cacheControlFor(rules, rule.source))
    }
    expect(sources.indexOf('/_next/static/:path*')).toBeLessThan(sources.indexOf('/(.*)'))
    expect(configured.filter((rule) => rule.source === '/(.*)')).toHaveLength(1)
    // Security headers still apply to everything, including cached assets.
    const global = configured.find((rule) => rule.source === '/(.*)')
    expect(global?.headers.map((h) => h.key)).toEqual(
      expect.arrayContaining(['X-Content-Type-Options', 'Strict-Transport-Security', 'Referrer-Policy']),
    )
  })
})

describe('isStaticAssetPath', () => {
  it('covers every public/ asset prefix the proxy may skip', () => {
    expect([...STATIC_ASSET_PREFIXES]).toEqual(['/_next/', '/favicon', '/logo/', '/images/', '/earth-textures/'])
    for (const path of [
      '/_next/static/chunks/main-app.js',
      '/_next/image?url=%2Flogo%2Fx.png',
      '/favicon.ico',
      '/logo/av-logo.png',
      '/images/insights/x.webp',
      '/earth-textures/hero-poster-512.webp',
    ]) {
      expect(isStaticAssetPath(path)).toBe(true)
    }
  })

  it('keeps HTML, API, and crawler meta routes on the nonce path', () => {
    for (const path of ['/', '/about', '/admin/leads', '/api/contact', '/robots.txt', '/sitemap.xml', '/manifest.json', '/earth-textures', '/imagesx']) {
      expect(isStaticAssetPath(path)).toBe(false)
    }
  })
})
