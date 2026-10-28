/**
 * Vercel Cron and the Cloud Run correspondence job authenticate with
 * `Authorization: Bearer <CRON_SECRET>`. A browser navigation cannot set that
 * header, so a signed-in admin following a link does not authorize a run.
 * Equal-length comparison only; a length mismatch is not the secret.
 */
export function hasCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization')
  if (!secret || !header) return false

  const expected = `Bearer ${secret}`
  if (header.length !== expected.length) return false

  let diff = 0
  for (let index = 0; index < expected.length; index++) {
    diff |= header.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return diff === 0
}
