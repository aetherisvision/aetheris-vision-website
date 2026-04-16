#!/usr/bin/env node
/**
 * Prints the Vercel team `id` to use with `vercel logs --scope`.
 * `vercel whoami` is always your user (e.g. marstonsward) — scope selects the org/team.
 *
 * Env:
 *   VERCEL_TOKEN (required)
 *   VERCEL_TEAM_SCOPE — if set, print as-is (skip discovery)
 *   VERCEL_TEAM_SLUG — optional hint (default: prefer slug "aetherisvision")
 */
import { execSync } from 'node:child_process'

const token = process.env.VERCEL_TOKEN
if (!token) {
  console.error('vercel-resolve-scope: VERCEL_TOKEN is not set')
  process.exit(2)
}

if (process.env.VERCEL_TEAM_SCOPE) {
  console.log(process.env.VERCEL_TEAM_SCOPE.trim())
  process.exit(0)
}

let raw
try {
  raw = execSync('vercel teams list -F json', {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, VERCEL_TOKEN: token },
  })
} catch (e) {
  const err = e instanceof Error ? e.message : String(e)
  console.error('vercel-resolve-scope: vercel teams list failed:', err)
  process.exit(1)
}

let data
try {
  data = JSON.parse(raw)
} catch {
  console.error('vercel-resolve-scope: could not parse JSON from vercel teams list')
  process.exit(1)
}

const teams = data.teams || []
const hintSlug = process.env.VERCEL_TEAM_SLUG || 'aetherisvision'

let picked =
  teams.find((t) => t.slug === hintSlug) ||
  teams.find((t) => /aetheris/i.test(t.name || '')) ||
  teams.find((t) => /aetheris/i.test(t.slug || ''))

// Do not fall back to "the only team" — a personal hobby team (e.g. marstonswards-projects)
// cannot see org projects like aetheris-vision-website; that caused misleading "project not found".

if (!picked) {
  console.error(
    'vercel-resolve-scope: No Aetheris Vision team found (expected slug aetherisvision or name/slug containing "aetheris").',
  )
  console.error('Teams your token can access:')
  for (const t of teams) {
    console.error(`  id=${t.id}  slug=${t.slug}  name=${t.name}`)
  }
  if (teams.length === 0) {
    console.error('')
    console.error('Fix: verify VERCEL_TOKEN is valid; run: vercel teams list -F json')
  } else if (teams.length === 1 && /projects/i.test(teams[0].slug || teams[0].name || '')) {
    console.error('')
    console.error(
      'This looks like a personal/hobby team only. The production site lives under the Aetheris Vision team.',
    )
    console.error(
      'Invite this Vercel user to Team → aetherisvision → Settings → Members (or accept a pending invite),',
    )
    console.error('then re-run. Or use a token created while logged in as a user who already has team access.')
  } else {
    console.error('')
    console.error('Fix: set VERCEL_TEAM_SCOPE to the team id= for Aetheris Vision (Vercel dashboard → Team → Settings),')
    console.error('or set VERCEL_TEAM_SLUG if your team slug differs from aetherisvision.')
  }
  process.exit(1)
}

console.log(picked.id)
