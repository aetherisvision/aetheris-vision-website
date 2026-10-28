import { NextResponse } from 'next/server'
import { showcaseCatalogView } from '@/lib/showcase-catalog-view'

/**
 * Public showcase dataset catalog (`#89`).
 * Serves the client-safe projection only — no `gs://` URIs.
 */
export async function GET() {
  return NextResponse.json(
    { datasets: showcaseCatalogView() },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
