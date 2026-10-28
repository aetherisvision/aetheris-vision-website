import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { getGcsReceipt, isValidReceiptPathname } from '@/lib/receipt-gcs'

/**
 * Streams a private receipt object from Google Cloud Storage to an
 * authenticated administrator. The proxy also gates /api/receipts/*, so this
 * is the second of two checks.
 */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const pathname = request.nextUrl.searchParams.get('path')
  if (!isValidReceiptPathname(pathname)) {
    return NextResponse.json({ error: 'Invalid receipt path' }, { status: 400 })
  }

  let result: Awaited<ReturnType<typeof getGcsReceipt>>
  try {
    result = await getGcsReceipt(pathname)
  } catch (error) {
    console.error('Receipt fetch failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
    return NextResponse.json({ error: 'Receipt unavailable' }, { status: 502 })
  }

  if (!result) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      'Content-Type': result.blob.contentType ?? 'application/octet-stream',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      // A financial record must never be cached by a shared cache.
      'Cache-Control': 'private, no-store',
    },
  })
}
