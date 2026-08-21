import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { putReceipt } from '@/lib/receipt-blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const form = await request.formData()
  const file = form.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const extensionsByMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'application/pdf': 'pdf',
  }
  const ext = extensionsByMime[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Only images and PDFs are accepted' }, { status: 400 })
  }

  const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })
  }

  const filename = `receipts/${crypto.randomUUID()}.${ext}`

  const stored = await putReceipt(filename, file, file.type)

  return NextResponse.json({ url: stored.reference })
}
