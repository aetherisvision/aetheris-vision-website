import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { FirestoreExpenseStoreError } from '@/lib/expense-firestore'
import { deleteExpenseRecord, updateExpenseRecord } from '@/lib/expense-store'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return unauthorizedResponse()
  const { id } = await params
  const { date, vendor, description, category, amount, tax_year, receipt_url } =
    await request.json()

  try {
    const updated = await updateExpenseRecord(id, {
      date: date ?? null,
      vendor: vendor ?? null,
      description: description ?? null,
      category: category ?? null,
      amount: amount ?? null,
      tax_year: tax_year ?? null,
      receipt_url: receipt_url ?? null,
    })

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof FirestoreExpenseStoreError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return unauthorizedResponse()
  const { id } = await params

  try {
    await deleteExpenseRecord(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof FirestoreExpenseStoreError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
}
