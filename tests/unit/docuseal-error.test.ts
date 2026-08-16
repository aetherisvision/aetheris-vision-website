import { describe, expect, it } from 'vitest'

import { DocuSealApiError, isRetrySafeDocuSealError } from '@/lib/docuseal'

describe('DocuSeal error classification', () => {
  it.each([400, 401, 403, 404, 409, 422])(
    'allows retry after a definitive %i rejection',
    (status) => {
      expect(isRetrySafeDocuSealError(new DocuSealApiError(status))).toBe(true)
    },
  )

  it.each([408, 425, 429, 500, 502, 503])(
    'holds the reservation after an ambiguous %i response',
    (status) => {
      expect(isRetrySafeDocuSealError(new DocuSealApiError(status))).toBe(false)
    },
  )

  it('does not treat generic network errors as safe to retry', () => {
    expect(isRetrySafeDocuSealError(new TypeError('network failure'))).toBe(false)
  })
})
