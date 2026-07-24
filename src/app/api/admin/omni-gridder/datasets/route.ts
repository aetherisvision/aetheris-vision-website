import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { showcaseCatalogView } from '@/lib/showcase-catalog-view'

/**
 * The showcase dataset catalog, as the browser needs it.
 *
 * Serves the client-safe projection only — no `gs://` URIs. The client picks a
 * dataset by id and the server resolves the id to a URI, so internal storage
 * layout never reaches the page.
 *
 * Pure metadata computed in-process: no og-server call, no GCS read, no job
 * submitted. It is therefore not rate-limited — there is nothing here to
 * exhaust — but it is still admin-gated, because the catalog describes
 * unreleased capability and this surface is not public yet.
 */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  return NextResponse.json(
    { datasets: showcaseCatalogView() },
    // The catalog is a build-time constant in practice; let the browser reuse
    // it across a session's navigations rather than refetching per page load.
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  )
}
