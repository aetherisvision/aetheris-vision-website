'use client'

import { useState, useEffect } from 'react'
import DatePicker from '../components/DatePicker'

const dark = {
  surface: '#0d1b2e',
  surfaceAlt: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  borderFocus: '#3b82f6',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  blueTag: 'rgba(59,130,246,0.15)',
  blueTagText: '#93c5fd',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
}

const CATEGORIES = [
  'Software Subscriptions',
  'Cloud Services',
  'Domain & Hosting',
  'Design Tools',
  'Contractors & Subcontractors',
  'Legal & Professional Fees',
  'Professional Certifications',
  'Professional Development & Training',
  'Conferences & Events',
  'Books & Research Materials',
  'Marketing & Advertising',
  'Business Insurance',
  'Banking & Financial Fees',
  'Equipment & Hardware',
  'Office Supplies',
  'Travel & Transportation',
  'Other',
]

type Expense = {
  id: number
  date: string
  vendor: string
  description: string
  category: string
  amount: string
  tax_year: number
  receipt_url?: string
}

type CategoryTotal = { category: string; total: string }

async function uploadReceipt(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/receipts/upload', { method: 'POST', body: fd })
  if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed')
  return (await res.json()).url
}

const currentYear = new Date().getFullYear()
const TAX_YEARS = [currentYear, currentYear - 1, currentYear - 2]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totals, setTotals] = useState<CategoryTotal[]>([])
  const [taxYear, setTaxYear] = useState(currentYear)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRow, setEditRow] = useState<Partial<Expense>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    category: CATEGORIES[0],
    amount: '',
    receipt_url: '',
  })

  async function fetchExpenses() {
    const res = await fetch(`/api/expenses?tax_year=${taxYear}`)
    const data = await res.json()
    setExpenses(data.expenses)
    setTotals(data.totals)
  }

  useEffect(() => { fetchExpenses() }, [taxYear])

  async function handleReceiptFile(file: File) {
    setUploadingReceipt(true)
    try {
      const url = await uploadReceipt(file)
      setForm(f => ({ ...f, receipt_url: url }))
    } catch {
      alert('Receipt upload failed. Try again.')
    } finally {
      setUploadingReceipt(false)
    }
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tax_year: taxYear }),
    })
    setForm({ ...form, vendor: '', description: '', amount: '', receipt_url: '' })
    setShowForm(false)
    setSubmitting(false)
    fetchExpenses()
  }

  function startEdit(e: Expense) {
    setEditingId(e.id)
    setEditRow({
      date: e.date.slice(0, 10),
      vendor: e.vendor,
      description: e.description,
      category: e.category,
      amount: e.amount,
      receipt_url: e.receipt_url ?? '',
    })
  }

  async function saveEdit(id: number) {
    setSavingEdit(true)
    await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editRow),
    })
    setSavingEdit(false)
    setEditingId(null)
    fetchExpenses()
  }

  async function deleteExpense(id: number) {
    setDeletingId(id)
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchExpenses()
  }

  async function exportExcel() {
    const { utils, writeFile } = await import('xlsx')
    const rows = expenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString('en-US'),
      Vendor: e.vendor,
      Description: e.description,
      Category: e.category,
      Amount: parseFloat(e.amount),
      'Receipt URL': e.receipt_url ?? '',
    }))

    // Summary sheet
    const summaryRows = totals.map(t => ({
      Category: t.category,
      Total: parseFloat(t.total),
    }))
    summaryRows.push({ Category: 'GRAND TOTAL', Total: totals.reduce((s, t) => s + parseFloat(t.total), 0) })

    const wb = utils.book_new()
    const ws = utils.json_to_sheet(rows)
    const wsSummary = utils.json_to_sheet(summaryRows)

    // Column widths
    ws['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 32 }, { wch: 28 }, { wch: 12 }, { wch: 36 }]
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 14 }]

    utils.book_append_sheet(wb, ws, `${taxYear} Expenses`)
    utils.book_append_sheet(wb, wsSummary, `${taxYear} Summary`)

    writeFile(wb, `AV-Expenses-${taxYear}.xlsx`)
  }

  const grandTotal = totals.reduce((sum, t) => sum + parseFloat(t.total), 0)

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: `1px solid ${dark.border}`, borderRadius: '7px',
    padding: '9px 12px', fontSize: '14px',
    color: dark.text, background: 'rgba(255,255,255,0.04)', outline: 'none',
  }

  const cellInputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: `1px solid ${dark.borderFocus}`,
    borderRadius: '5px', padding: '5px 8px',
    fontSize: '13px', color: dark.text,
    background: 'rgba(59,130,246,0.07)', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '600',
    color: dark.textDim, marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  }

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, margin: '0 0 4px' }}>Expenses</h1>
            <p style={{ color: dark.textMuted, fontSize: '13px', margin: 0 }}>Aetheris Vision LLC — Tax Records</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={taxYear}
              onChange={e => setTaxYear(Number(e.target.value))}
              style={{ border: `1px solid ${dark.border}`, borderRadius: '7px', padding: '8px 12px', fontSize: '14px', color: dark.text, background: dark.surface, outline: 'none', colorScheme: 'dark' }}
            >
              {TAX_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={exportExcel}
              disabled={expenses.length === 0}
              style={{
                padding: '9px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                border: `1px solid ${dark.border}`, background: 'rgba(255,255,255,0.04)',
                color: dark.textMuted, cursor: expenses.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                opacity: expenses.length === 0 ? 0.4 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export Excel
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', padding: '9px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
            >
              + Add Expense
            </button>
          </div>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '24px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <DatePicker required value={form.date} onChange={date => setForm({ ...form, date })} />
            </div>
            <div>
              <label style={labelStyle}>Vendor</label>
              <input type="text" required placeholder="e.g. GitHub" value={form.vendor}
                onChange={e => setForm({ ...form, vendor: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input type="text" required placeholder="e.g. Annual Pro plan" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ ...inputStyle, colorScheme: 'dark' }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount ($)</label>
              <input type="number" required step="0.01" min="0" placeholder="0.00" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Receipt (optional)</label>
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  border: `1px dashed ${form.receipt_url ? dark.blue : dark.border}`,
                  borderRadius: '7px', padding: '9px 12px', cursor: 'pointer',
                  background: form.receipt_url ? dark.blueTag : 'rgba(255,255,255,0.02)',
                  color: form.receipt_url ? dark.blueTagText : dark.textMuted, fontSize: '13px',
                }}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptFile(f) }}
                />
                {uploadingReceipt ? (
                  'Uploading...'
                ) : form.receipt_url ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Receipt attached — click to replace
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Upload photo or PDF
                  </>
                )}
              </label>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '9px 16px', fontSize: '14px', color: dark.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                style={{ background: submitting ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', padding: '9px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        )}

        {/* Category Totals */}
        {totals.length > 0 && (
          <div style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: '700', color: dark.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              {taxYear} Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {totals.map(t => (
                <div key={t.category} style={{ background: dark.surfaceAlt, borderRadius: '8px', padding: '12px', border: `1px solid ${dark.borderLight}` }}>
                  <p style={{ fontSize: '11px', color: dark.textDim, margin: '0 0 4px' }}>{t.category}</p>
                  <p style={{ fontSize: '17px', fontWeight: '700', color: dark.text, margin: 0 }}>${parseFloat(t.total).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${dark.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: dark.textMuted, fontSize: '14px' }}>Total {taxYear}</span>
              <span style={{ fontWeight: '800', color: dark.text, fontSize: '20px' }}>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${dark.border}` }}>
                {['Date', 'Vendor', 'Description', 'Category', 'Amount', ''].map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 4 ? 'right' : 'left',
                    padding: '11px 14px', fontSize: '11px', fontWeight: '700',
                    color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: dark.surfaceAlt, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: dark.textDim }}>
                    No expenses logged for {taxYear}
                  </td>
                </tr>
              )}
              {expenses.map((e, i) => {
                const isEditing = editingId === e.id
                return (
                  <tr key={e.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${dark.borderLight}`, background: isEditing ? 'rgba(59,130,246,0.04)' : 'transparent' }}>
                    <td style={{ padding: isEditing ? '8px 14px' : '11px 14px', color: dark.textMuted, whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <DatePicker
                          value={editRow.date ?? ''}
                          onChange={date => setEditRow(r => ({ ...r, date }))}
                        />
                      ) : new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td style={{ padding: isEditing ? '8px 14px' : '11px 14px', fontWeight: '600', color: dark.text }}>
                      {isEditing ? (
                        <input style={cellInputStyle} value={editRow.vendor ?? ''} onChange={ev => setEditRow(r => ({ ...r, vendor: ev.target.value }))} />
                      ) : e.vendor}
                    </td>
                    <td style={{ padding: isEditing ? '8px 14px' : '11px 14px', color: dark.textMuted }}>
                      {isEditing ? (
                        <input style={cellInputStyle} value={editRow.description ?? ''} onChange={ev => setEditRow(r => ({ ...r, description: ev.target.value }))} />
                      ) : e.description}
                    </td>
                    <td style={{ padding: isEditing ? '8px 14px' : '11px 14px' }}>
                      {isEditing ? (
                        <select style={{ ...cellInputStyle, colorScheme: 'dark' }} value={editRow.category ?? ''} onChange={ev => setEditRow(r => ({ ...r, category: ev.target.value }))}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span style={{ background: dark.blueTag, color: dark.blueTagText, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                          {e.category}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: isEditing ? '8px 14px' : '11px 14px', textAlign: 'right', fontWeight: '600', color: dark.text, whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input type="number" step="0.01" min="0" style={{ ...cellInputStyle, textAlign: 'right', width: '90px' }} value={editRow.amount ?? ''} onChange={ev => setEditRow(r => ({ ...r, amount: ev.target.value }))} />
                      ) : `$${parseFloat(e.amount).toFixed(2)}`}
                    </td>
                    <td style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => saveEdit(e.id)}
                            disabled={savingEdit}
                            style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', border: 'none', cursor: 'pointer' }}
                          >
                            {savingEdit ? '…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', color: dark.textMuted, background: 'transparent', border: `1px solid ${dark.border}`, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {e.receipt_url && (
                            <a
                              href={e.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', color: dark.blue, background: dark.blueTag, border: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                              title="View receipt"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => startEdit(e)}
                            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', color: dark.textMuted, background: 'transparent', border: `1px solid ${dark.border}`, cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteExpense(e.id)}
                            disabled={deletingId === e.id}
                            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', color: dark.dangerText, background: dark.danger, border: `1px solid ${dark.dangerBorder}`, cursor: 'pointer' }}
                          >
                            {deletingId === e.id ? '…' : 'Del'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
