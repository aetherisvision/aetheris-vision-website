// Server-side allowlist of omni-gridder demo input URIs — shared by the
// submit route (choosing the regrid input) and the status route (validating
// the compare_uri passed back for the before/after plot panel). Never accept
// an arbitrary client-supplied gs:// URI (SSRF / cross-tenant data exposure
// via og-server reading whatever bucket/object we hand it). First entry is
// the default. Configure via OG_DEMO_INPUT_URIS="gs://b/a.nc,gs://b/b.nc".
export const DEFAULT_DEMO_INPUT_URIS = [
  'gs://esmai-dev-esmai-objects/demo/hgt500_2026070706_f006.nc',
]

export function allowedInputUris(): string[] {
  const raw = process.env.OG_DEMO_INPUT_URIS
  if (!raw) return DEFAULT_DEMO_INPUT_URIS
  const uris = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return uris.length > 0 ? uris : DEFAULT_DEMO_INPUT_URIS
}
