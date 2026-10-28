import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { FirestoreExpenseStoreError } from '@/lib/expense-firestore'
import { createExpenseRecord, listExpensesByTaxYear } from '@/lib/expense-store'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  const { searchParams } = new URL(request.url)
  const taxYear = searchParams.get('tax_year') || new Date().getFullYear()

  try {
    const { expenses, totals } = await listExpensesByTaxYear(taxYear)
    return NextResponse.json({ expenses, totals })
  } catch (error) {
    if (error instanceof FirestoreExpenseStoreError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  const body = await request.json()
  const {
    date,
    vendor,
    description,
    category,
    amount,
    tax_year,
    receipt_url,
    receipt_gcs_uri,
    receipt_sha256,
    receipt_content_type,
    receipt_size_bytes,
  } = body

  try {
    const { record } = await createExpenseRecord({
      date,
      vendor,
      description,
      category,
      amount,
      tax_year,
      receipt_url: receipt_url || null,
      receipt_gcs_uri: receipt_gcs_uri || null,
      receipt_sha256: receipt_sha256 || null,
      receipt_content_type: receipt_content_type || null,
      receipt_size_bytes: receipt_size_bytes ?? null,
      source: 'manual',
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof FirestoreExpenseStoreError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
}
