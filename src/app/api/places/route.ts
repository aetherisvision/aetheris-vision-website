import { NextRequest, NextResponse } from 'next/server'

import { rateLimit } from '@/lib/rate-limit'
import {
  assertDistributedRateLimitAvailable,
  createOpaqueRateLimitKey,
  getTrustedClientIp,
  RequestSecurityError,
} from '@/lib/request-security'

interface NominatimResult {
  display_name: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country_code?: string
    'ISO3166-2-lvl4'?: string
  }
}

const QUERY_MAX_LENGTH = 100
const RESPONSE_MAX_BYTES = 256 * 1024
const NOMINATIM_TIMEOUT_MS = 4_500
const RATE_LIMIT = 30
const WINDOW_MS = 60 * 1000

function buildShort(result: NominatimResult): string {
  const address = result.address ?? {}
  const city = address.city ?? address.town ?? address.village ?? address.municipality
  const stateCode = address['ISO3166-2-lvl4']?.split('-').pop()
  const countryCode = address.country_code?.toUpperCase()

  const parts: string[] = []
  if (city) parts.push(city)
  if (address.state) parts.push(stateCode ?? address.state)
  if (countryCode && countryCode !== 'US') parts.push(countryCode)
  if (parts.length === 0) {
    return result.display_name
      .split(',')
      .slice(0, 2)
      .map((part) => part.trim())
      .join(', ')
  }
  return parts.join(', ')
}

function isNominatimResult(value: unknown): value is NominatimResult {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.display_name !== 'string' ||
    candidate.display_name.length > 1_000 ||
    /[\u0000-\u001f\u007f]/.test(candidate.display_name)
  ) {
    return false
  }
  if (candidate.address === undefined) return true
  if (
    candidate.address === null ||
    typeof candidate.address !== 'object' ||
    Array.isArray(candidate.address)
  ) return false

  const address = candidate.address as Record<string, unknown>
  const fields = [
    'city',
    'town',
    'village',
    'municipality',
    'state',
    'country_code',
    'ISO3166-2-lvl4',
  ]
  return fields.every((field) => {
    const fieldValue = address[field]
    return fieldValue === undefined || (
      typeof fieldValue === 'string' &&
      fieldValue.length <= 300 &&
      !/[\u0000-\u001f\u007f]/.test(fieldValue)
    )
  })
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

function invalidRequest(status: number, message: string) {
  return noStoreJson({ error: message }, { status })
}

function assertAllowedReadContext(request: NextRequest): void {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new RequestSecurityError('invalid-origin', 403, 'Request origin is not allowed')
  }

  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    throw new RequestSecurityError('invalid-origin', 403, 'Request origin is not allowed')
  }
}

async function readResponseTextLimited(response: Response, maxBytes: number): Promise<string | null> {
  if (!response.body) return null
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined)
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(body)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    assertAllowedReadContext(request)
    assertDistributedRateLimitAvailable()

    const queryKeys = [...request.nextUrl.searchParams.keys()]
    const values = request.nextUrl.searchParams.getAll('q')
    if (queryKeys.some((key) => key !== 'q') || values.length !== 1) {
      return invalidRequest(400, 'Invalid place query.')
    }

    const query = values[0].trim()
    if (query.length < 2) return noStoreJson([])
    if (query.length > QUERY_MAX_LENGTH || /[\u0000-\u001f\u007f]/.test(query)) {
      return invalidRequest(400, 'Invalid place query.')
    }

    const clientIp = getTrustedClientIp(request)
    const rateLimitKey = createOpaqueRateLimitKey('places', clientIp)
    const limited = await rateLimit(rateLimitKey, {
      limit: RATE_LIMIT,
      windowMs: WINDOW_MS,
      prefix: 'places',
    })
    if (!limited.success) {
      const response = invalidRequest(429, 'Too many place searches. Please wait and try again.')
      response.headers.set('Retry-After', String(limited.retryAfterSeconds))
      return response
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '8',
    })

    const upstream = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'AetherisVision/1.0 (+https://aetherisvision.com)',
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
    })

    if (!upstream.ok) return noStoreJson([])
    const mediaType = upstream.headers.get('content-type')?.split(';', 1)[0]?.trim()
    if (mediaType !== 'application/json') return noStoreJson([])

    const declaredLength = Number(upstream.headers.get('content-length'))
    if (Number.isFinite(declaredLength) && declaredLength > RESPONSE_MAX_BYTES) {
      return noStoreJson([])
    }

    const text = await readResponseTextLimited(upstream, RESPONSE_MAX_BYTES)
    if (text === null) return noStoreJson([])

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return noStoreJson([])
    }
    if (!Array.isArray(parsed)) return noStoreJson([])

    const places: Array<{ short: string }> = []
    const seen = new Set<string>()
    for (const result of parsed) {
      if (!isNominatimResult(result)) continue
      const short = buildShort(result).slice(0, 300)
      if (!short || seen.has(short)) continue
      seen.add(short)
      places.push({ short })
      if (places.length === 5) break
    }

    return noStoreJson(places)
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return invalidRequest(error.status, error.message)
    }
    console.error('Place lookup failed')
    return noStoreJson([])
  }
}
