/**
 * Shared same-origin check for browser mutations.
 *
 * Public form handlers call this through `assertSameOrigin`. The proxy uses
 * it directly so the helper stays free of Node-only imports.
 * Missing Origin fails closed. A present Sec-Fetch-Site must be same-origin.
 */
export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false

  let expectedOrigin: string
  try {
    expectedOrigin = new URL(request.url).origin
  } catch {
    return false
  }

  try {
    if (new URL(origin).origin !== expectedOrigin || origin !== new URL(origin).origin) {
      return false
    }
  } catch {
    return false
  }

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin') return false
  return true
}
