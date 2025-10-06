import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mockApiResponse = [
  {
    marketId: 'test-market',
    marketName: 'Test Market',
    medianHomeValue: 600000,
    medianLoanBalance: 300000,
    medianSellerGoal: 80000,
    closingCostRate: 0.065,
    medianEquityAtListing: 190000,
    equityPercentiles: {
      p25: 150000,
      p50: 190000,
      p75: 240000
    },
    sampleSize: 120,
    medianDaysOnMarket: 24,
    lastUpdated: '2025-07-10'
  }
]

describe('getEquityInsights', () => {
  const originalUrl = process.env.REALIE_API_URL
  const originalKey = process.env.REALIE_API_KEY

  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    delete process.env.REALIE_API_URL
    delete process.env.REALIE_API_KEY
  })

  afterAll(() => {
    if (typeof originalUrl === 'string') {
      process.env.REALIE_API_URL = originalUrl
    } else {
      delete process.env.REALIE_API_URL
    }
    if (typeof originalKey === 'string') {
      process.env.REALIE_API_KEY = originalKey
    } else {
      delete process.env.REALIE_API_KEY
    }
  })

  it('computes equity readiness metrics from Realie API data', async () => {
    process.env.REALIE_API_URL = 'https://api.example.com/equity'
    const { getEquityInsights } = await import('@/lib/insights/realie')

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    })
    vi.stubGlobal('fetch', mockFetch)

    const results = await getEquityInsights({ marketId: 'test-market' })
    expect(results).toHaveLength(1)

    const insight = results[0]
    expect(insight.marketName).toBe('Test Market')
    expect(insight.breakEvenEquity).toBeCloseTo(600000 * 0.065 + 80000, 5)
    expect(insight.currentEquity).toBe(300000)
    expect(insight.equityBuffer).toBeCloseTo(insight.currentEquity - insight.breakEvenEquity, 5)
    expect(insight.percentileBreakdown).toEqual([
      { label: '25th', equity: 150000, ratio: 150000 / 600000 },
      { label: 'Median', equity: 190000, ratio: 190000 / 600000 },
      { label: '75th', equity: 240000, ratio: 240000 / 600000 }
    ])
    expect(mockFetch).toHaveBeenCalled()
  })

  it('falls back to mock dataset when fetch fails', async () => {
    const { getEquityInsights } = await import('@/lib/insights/realie')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const results = await getEquityInsights({ limit: 1 })
    expect(results).toHaveLength(1)
    expect(results[0].marketName).toBeTruthy()
  })
})
