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
 *  1. `X-Forwarded-Host` / `Host` + `X-Forwarded-Proto`, only when the ingress
 *     is trusted (`GCP_LOAD_BALANCER=true` or `TRUSTED_PROXY=true`). Cloud Run
 *     ingress must be restricted to the load balancer before enabling either,
 *     otherwise a direct caller could inject a host.
 *  2. `NEXT_PUBLIC_SITE_URL`, then `SITE.url`, in production builds.
 *  3. `request.url`'s origin — correct for `next dev` / `next start` locally.
 *
 * This module is imported by `src/proxy.ts`, so it must stay free of
 * Node-only imports.
 */

const HOSTNAME_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*(?::\d{1,5})?$/
const IPV6_HOST_PATTERN = /^\[[0-9a-f:.]+\](?::\d{1,5})?$/

/** True when forwarded host/proto headers were set by a trusted ingress. */
export function isForwardedOriginTrusted(): boolean {
  return process.env.GCP_LOAD_BALANCER === 'true' || process.env.TRUSTED_PROXY === 'true'
}

function firstHeaderValue(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',', 1)[0]?.trim().toLowerCase()
  return first ? first : null
}

function forwardedOrigin(request: Request): string | null {
  const host =
    firstHeaderValue(request.headers.get('x-forwarded-host')) ??
    firstHeaderValue(request.headers.get('host'))
  if (!host || !(HOSTNAME_PATTERN.test(host) || IPV6_HOST_PATTERN.test(host))) return null

  let proto = firstHeaderValue(request.headers.get('x-forwarded-proto'))
  if (!proto) {
    try {
      proto = new URL(request.url).protocol.replace(/:$/, '')
    } catch {
      return null
    }
  }
  if (proto !== 'https' && proto !== 'http') return null

  try {
    // URL normalizes default ports (`https://host:443` -> `https://host`) so
    // the result compares exactly against a browser-supplied Origin header.
    return new URL(`${proto}://${host}`).origin
  } catch {
    return null
  }
}

function configuredOrigin(): string | null {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE.url
  try {
    const origin = new URL(candidate).origin
    return origin === 'null' ? null : origin
  } catch {
    return null
  }
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

  if (process.env.NODE_ENV === 'production') {
    const origin = configuredOrigin()
    if (origin) return origin
  }

  try {
    return new URL(request.url).origin
  } catch {
    return configuredOrigin() ?? SITE.url
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
