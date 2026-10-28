/**
 * Canonical business and tax expense categories used across the Admin Expenses
 * UI, Gmail receipt scanner, CSV backfill script, and Firestore metadata store.
 */
export const EXPENSE_CATEGORIES = [
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
  'Home Office',
  'Travel & Transportation',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

const CATEGORY_SET = new Set<string>(EXPENSE_CATEGORIES)

/** Legacy category labels from earlier CSV imports and Gmail scanner rules. */
export const LEGACY_CATEGORY_ALIASES: Readonly<Record<string, ExpenseCategory>> = {
  'Software/SaaS': 'Software Subscriptions',
  'AI/API': 'Cloud Services',
  Hosting: 'Domain & Hosting',
  Shipping: 'Office Supplies',
  Security: 'Software Subscriptions',
  Equipment: 'Equipment & Hardware',
  'Office & Equipment': 'Equipment & Hardware',
}

/** True only when `value` is one of the canonical EXPENSE_CATEGORIES. */
export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && CATEGORY_SET.has(value.trim())
}

/**
 * Strictly validate a category submitted via the Admin API (`POST`/`PATCH`).
 * Returns `null` when the category is missing or not in `EXPENSE_CATEGORIES`.
 */
export function validateStrictExpenseCategory(raw: unknown): ExpenseCategory | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return CATEGORY_SET.has(trimmed) ? (trimmed as ExpenseCategory) : null
}

/**
 * Normalize a category string from automated Gmail ingestion or legacy
 * migrations to a canonical ExpenseCategory, defaulting unknown legacy labels
 * to 'Other'.
 */
export function normalizeExpenseCategory(raw: unknown): ExpenseCategory {
  if (typeof raw !== 'string') return 'Other'
  const trimmed = raw.trim()
  if (!trimmed) return 'Other'
  if (CATEGORY_SET.has(trimmed)) return trimmed as ExpenseCategory
  return LEGACY_CATEGORY_ALIASES[trimmed] ?? 'Other'
}
