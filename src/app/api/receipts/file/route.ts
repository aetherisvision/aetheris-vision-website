import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

// Only blobs this application wrote, and only inside the receipts prefix.
const RECEIPT_PATHNAME = /^receipts\/[A-Za-z0-9._/-]{1,200}$/

/**
 * Streams a private receipt blob to an authenticated administrator.
 * The proxy also gates /api/receipts/*, so this is the second of two checks.
 */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const pathname = request.nextUrl.searchParams.get('path')
  if (!pathname || pathname.includes('..') || !RECEIPT_PATHNAME.test(pathname)) {
    return NextResponse.json({ error: 'Invalid receipt path' }, { status: 400 })
  }

  let result: Awaited<ReturnType<typeof get>>
  try {
    result = await get(pathname, { access: 'private' })
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
