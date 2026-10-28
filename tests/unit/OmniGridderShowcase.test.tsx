import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OmniGridderShowcase, {
  coldWarmPair,
  publicPollDelayMs,
} from '@/components/OmniGridderShowcase'
import { showcaseCatalogView } from '@/lib/showcase-catalog-view'

describe('OmniGridderShowcase helpers (#89)', () => {
  it('computes adaptive public poll backoff (5s -> 10s -> 15s)', () => {
    expect(publicPollDelayMs(1)).toBe(5_000)
    expect(publicPollDelayMs(6)).toBe(5_000)
    expect(publicPollDelayMs(7)).toBe(10_000)
    expect(publicPollDelayMs(15)).toBe(10_000)
    expect(publicPollDelayMs(16)).toBe(15_000)
  })

  it('pairs the first cold observation with the first subsequent warm observation', () => {
    expect(coldWarmPair(undefined)).toBeNull()
    expect(coldWarmPair([{ wallClockMs: 4200, cacheHit: false }])).toBeNull()
    expect(
      coldWarmPair([
        { wallClockMs: 4200, cacheHit: false },
        { wallClockMs: 950, cacheHit: true },
      ]),
    ).toEqual({
      cold: { wallClockMs: 4200, cacheHit: false },
      warm: { wallClockMs: 950, cacheHit: true },
    })
  })
})

describe('OmniGridderShowcase component (#89)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('loads the public dataset catalog, renders the compatibility matrix, and surfaces the daily budget-exhausted notice', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ datasets: showcaseCatalogView() }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "Today's public live-demo compute budget has been reached.",
            budgetExhausted: true,
          }),
          { status: 429 },
        ),
      )

    render(<OmniGridderShowcase mode="public" />)

    expect(
      await screen.findByText('GFS 500 hPa geopotential height'),
    ).toBeInTheDocument()
    expect(screen.getByText('GOES-18 ABI band 13 — clean IR window')).toBeInTheDocument()

    // Select GOES-18 swath dataset and verify bilinear/conservative refusal reason is shown
    fireEvent.click(screen.getByText('GOES-18 ABI band 13 — clean IR window'))
    expect(screen.getAllByText(/Not applicable to swath geometry/i).length).toBeGreaterThan(0)

    // Trigger a single run and verify the friendly budget-exhausted notice renders
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /run single job/i }))
    })

    await waitFor(() =>
      expect(
        screen.getByText('Daily live-demo compute budget reached'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: /schedule a free consultation/i })).toHaveAttribute(
      'href',
      '/book',
    )
  })
})
