import { SITE } from '@/lib/constants'

/**
 * Public origin of the current request.
 *
 * Next.js standalone builds `request.url` from the listener address
 * (`HOSTNAME`/`PORT`, so `https://0.0.0.0:8080` on Cloud Run), not from the
 * visitor's Host header. Every absolute redirect, OAuth `redirect_uri`,
 * same-origin comparison, and Turnstile hostname check therefore has to derive
 * the origin here instead of from `request.url` / `request.nextUrl.origin`.
 *
 * Resolution order:
 *  1. Forwarded request headers, only from a trusted ingress AND only when the
 *     resulting host is on the allowlist ({@link allowedPublicHosts}):
 *     - Cloud Run behind the GCP load balancer (`K_SERVICE` set and
 *       `GCP_LOAD_BALANCER=true`): the LB preserves the client `Host` header
 *       and sets `X-Forwarded-Proto`, but it neither sets nor strips
 *       `X-Forwarded-Host`, so that header is ignored on this path.
 *     - `TRUSTED_PROXY=true`: an explicit opt-in for a reverse proxy that does
 *       rewrite `X-Forwarded-Host`; it is read before `Host`.
 *     In production the forwarded scheme must be `https`.
 *  2. `NEXT_PUBLIC_SITE_URL` when it parses, else `SITE.url`. Production
 *     always ends here when step 1 rejects the request; the listener address
 *     is never used.
 *  3. `request.url`'s origin — only outside production (`next dev`/`next start`).
 *
 * This module is imported by `src/proxy.ts`, so it must stay free of
 * Node-only imports.
 */

const HOSTNAME_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*(?::\d{1,5})?$/
const IPV6_HOST_PATTERN = /^\[[0-9a-f:.]+\](?::\d{1,5})?$/

/** Cloud Run origin hostname fronted by the GCP load balancer. */
export const GCP_ORIGIN_HOST = 'gcp-origin.aetherisvision.com'

/** Hosts accepted (on any port) outside production builds only. */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function isWellFormedHost(host: string): boolean {
  return HOSTNAME_PATTERN.test(host) || IPV6_HOST_PATTERN.test(host)
}

/** `host[:port]` of a URL string with default ports dropped, or null. */
function hostFromUrl(value: string | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.host.toLowerCase() || null
  } catch {
    return null
  }
}

/**
 * Lowercased `host[:port]` values a forwarded request may claim as its public
 * host. Anything else is treated as an injection attempt and ignored.
 */
export function allowedPublicHosts(): Set<string> {
  const hosts = new Set<string>()

  const site = hostFromUrl(SITE.url)
  if (site) {
    hosts.add(site)
    hosts.add(site.startsWith('www.') ? site.slice('www.'.length) : `www.${site}`)
  }
  hosts.add(GCP_ORIGIN_HOST)

  const configured = hostFromUrl(process.env.NEXT_PUBLIC_SITE_URL)
  if (configured) hosts.add(configured)

  // Comma-separated extra hosts, e.g. a preview service's public hostname.
  for (const entry of (process.env.ALLOWED_PUBLIC_HOSTS ?? '').split(',')) {
    const host = entry.trim().toLowerCase()
    if (host && isWellFormedHost(host)) hosts.add(host)
  }

  if (!isProduction()) {
    for (const host of LOCAL_HOSTNAMES) hosts.add(host)
  }
  return hosts
}

function isAllowedPublicHost(url: URL): boolean {
  const allowed = allowedPublicHosts()
  if (allowed.has(url.host)) return true
  return !isProduction() && LOCAL_HOSTNAMES.has(url.hostname)
}

/** Cloud Run (`K_SERVICE`) with ingress restricted to the GCP load balancer. */
function isGcpLoadBalancerIngress(): boolean {
  return Boolean(process.env.K_SERVICE) && process.env.GCP_LOAD_BALANCER === 'true'
}

/** Explicit opt-in for a reverse proxy that rewrites `X-Forwarded-Host`. */
function isExplicitTrustedProxy(): boolean {
  return process.env.TRUSTED_PROXY === 'true'
}

/** True when forwarded host/proto headers were set by a trusted ingress. */
export function isForwardedOriginTrusted(): boolean {
  return isGcpLoadBalancerIngress() || isExplicitTrustedProxy()
}

function firstHeaderValue(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',', 1)[0]?.trim().toLowerCase()
  return first ? first : null
}

function forwardedHost(request: Request): string | null {
  const host = firstHeaderValue(request.headers.get('host'))
  if (!isExplicitTrustedProxy()) return host
  return firstHeaderValue(request.headers.get('x-forwarded-host')) ?? host
}

function forwardedOrigin(request: Request): string | null {
  const host = forwardedHost(request)
  if (!host || !isWellFormedHost(host)) return null

  // Never inferred from `request.url`: that is the container listener.
  const proto = firstHeaderValue(request.headers.get('x-forwarded-proto'))
  if (proto !== 'https' && !(proto === 'http' && !isProduction())) return null

  try {
    // URL normalizes default ports (`https://host:443` -> `https://host`) so
    // the result compares exactly against a browser-supplied Origin header.
    const url = new URL(`${proto}://${host}`)
    return isAllowedPublicHost(url) ? url.origin : null
  } catch {
    return null
  }
}

/** `NEXT_PUBLIC_SITE_URL` when it parses, else the canonical `SITE.url`. */
function configuredOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) {
    try {
      const origin = new URL(configured).origin
      if (origin !== 'null') return origin
    } catch {
      // fall through to the canonical site
    }
  }
  return new URL(SITE.url).origin
}

/**
 * Origin (`scheme://host[:port]`, no trailing slash) the visitor used to reach
 * this request. Never returns the container listener address in production.
 */
export function getPublicOrigin(request: Request): string {
  if (isForwardedOriginTrusted()) {
    const origin = forwardedOrigin(request)
    if (origin) return origin
  }

  if (isProduction()) return configuredOrigin()

  try {
    const origin = new URL(request.url).origin
    return origin === 'null' ? configuredOrigin() : origin
  } catch {
    return configuredOrigin()
  }
}

/** Hostname component of {@link getPublicOrigin}; used for Turnstile checks. */
export function getPublicHostname(request: Request): string {
  return new URL(getPublicOrigin(request)).hostname
}

/** Resolve a site-relative path against the public origin. */
export function publicUrl(request: Request, path: string): URL {
  return new URL(path, `${getPublicOrigin(request)}/`)
}
