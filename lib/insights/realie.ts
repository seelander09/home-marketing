import mockMarkets from '@/content/mock-data/realie-equity.json'

const REALIE_API_URL = process.env.REALIE_API_URL
const REALIE_API_KEY = process.env.REALIE_API_KEY
const DEFAULT_CLOSING_COST_RATE = 0.07

export type RealieEquityPercentiles = {
  p25: number
  p50: number
  p75: number
}

export type RealieEquityMarket = {
  marketId: string
  marketName: string
  medianHomeValue: number
  medianLoanBalance: number
  medianSellerGoal: number
  closingCostRate?: number
  medianEquityAtListing: number
  equityPercentiles?: Partial<RealieEquityPercentiles>
  sampleSize: number
  medianDaysOnMarket?: number
  lastUpdated: string
}

export type EquityInsight = {
  marketId: string
  marketName: string
  sampleSize: number
  lastUpdated: string
  medianDaysOnMarket?: number
  estimatedHomeValue: number
  estimatedLoanBalance: number
  currentEquity: number
  breakEvenEquity: number
  equityBuffer: number
  closingCostEstimate: number
  sellerNetGoal: number
  medianEquityAtListing: number
  medianEquityRatio: number
  readinessScore: number
  percentileBreakdown: Array<{
    label: string
    equity: number
    ratio: number
  }>
  assumptions: {
    closingCostRate: number
    methodology: string
  }
}

export type EquityInsightRequest = {
  marketId?: string
  limit?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

function normalizeMarkets(payload: unknown): RealieEquityMarket[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord).map((entry) => normalizeMarket(entry))
  }
  if (isRecord(payload) && Array.isArray(payload.markets)) {
    return payload.markets.filter(isRecord).map((entry) => normalizeMarket(entry))
  }
  return []
}

function normalizeMarket(entry: Record<string, unknown>): RealieEquityMarket {
  const rawPercentiles = isRecord(entry['equityPercentiles']) ? (entry['equityPercentiles'] as Record<string, unknown>) : undefined
  return {
    marketId: String(entry['marketId'] ?? entry['id'] ?? ''),
    marketName: String(entry['marketName'] ?? entry['name'] ?? 'Unknown market'),
    medianHomeValue: asNumber(entry['medianHomeValue'] ?? entry['avmMedian'], 0),
    medianLoanBalance: asNumber(entry['medianLoanBalance'] ?? entry['loanMedian'], 0),
    medianSellerGoal: asNumber(entry['medianSellerGoal'] ?? entry['sellerNetGoal'], 75000),
    closingCostRate: entry['closingCostRate'] ? asNumber(entry['closingCostRate'], DEFAULT_CLOSING_COST_RATE) : undefined,
    medianEquityAtListing: asNumber(entry['medianEquityAtListing'] ?? entry['equityMedian'], 0),
    equityPercentiles: rawPercentiles
      ? {
          p25: asNumber(rawPercentiles['p25'], 0),
          p50: asNumber(rawPercentiles['p50'] ?? rawPercentiles['median'], 0),
          p75: asNumber(rawPercentiles['p75'], 0)
        }
      : undefined,
    sampleSize: Math.max(0, Number.parseInt(String(entry['sampleSize'] ?? entry['listingCount'] ?? 0), 10)),
    medianDaysOnMarket: entry['medianDaysOnMarket'] ? asNumber(entry['medianDaysOnMarket'], 0) : undefined,
    lastUpdated: String(entry['lastUpdated'] ?? entry['updatedAt'] ?? '')
  }
}

async function fetchRealieMarkets(): Promise<RealieEquityMarket[]> {
  if (!REALIE_API_URL) {
    return normalizeMarkets(mockMarkets)
  }

  try {
    const response = await fetch(REALIE_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(REALIE_API_KEY ? { Authorization: `Bearer ${REALIE_API_KEY}` } : {})
      },
      cache: 'no-cache'
    })

    if (!response.ok) {
      throw new Error(`Realie API responded with ${response.status}`)
    }

    const json = await response.json()
    const markets = normalizeMarkets(json)

    if (!markets.length) {
      console.warn('Realie API returned an unexpected payload, falling back to mock data')
      return normalizeMarkets(mockMarkets)
    }

    return markets
  } catch (error) {
    console.warn('Unable to reach Realie API, falling back to mock data', error)
    return normalizeMarkets(mockMarkets)
  }
}

function toInsight(market: RealieEquityMarket): EquityInsight {
  const closingCostRate = market.closingCostRate ?? DEFAULT_CLOSING_COST_RATE
  const closingCostEstimate = market.medianHomeValue * closingCostRate
  const currentEquity = Math.max(0, market.medianHomeValue - market.medianLoanBalance)
  const breakEvenEquity = closingCostEstimate + market.medianSellerGoal
  const equityBuffer = currentEquity - breakEvenEquity
  const readinessScore = breakEvenEquity > 0 ? Math.round(Math.max(0, Math.min(200, (currentEquity / breakEvenEquity) * 100))) : 0
  const medianEquityRatio = market.medianHomeValue > 0 ? market.medianEquityAtListing / market.medianHomeValue : 0

  let percentileBreakdown: EquityInsight['percentileBreakdown']
  if (market.equityPercentiles) {
    const percentileTuples: Array<[string, number]> = [
      ['25th', market.equityPercentiles.p25 ?? 0],
      ['Median', market.equityPercentiles.p50 ?? market.medianEquityAtListing],
      ['75th', market.equityPercentiles.p75 ?? 0]
    ]
    percentileBreakdown = percentileTuples.map(([label, equity]) => ({
      label,
      equity,
      ratio: market.medianHomeValue > 0 ? equity / market.medianHomeValue : 0
    }))
  } else {
    percentileBreakdown = [
      {
        label: 'Median',
        equity: market.medianEquityAtListing,
        ratio: medianEquityRatio
      }
    ]
  }

  return {
    marketId: market.marketId,
    marketName: market.marketName,
    sampleSize: market.sampleSize,
    lastUpdated: market.lastUpdated,
    medianDaysOnMarket: market.medianDaysOnMarket,
    estimatedHomeValue: market.medianHomeValue,
    estimatedLoanBalance: market.medianLoanBalance,
    currentEquity,
    breakEvenEquity,
    equityBuffer,
    closingCostEstimate,
    sellerNetGoal: market.medianSellerGoal,
    medianEquityAtListing: market.medianEquityAtListing,
    medianEquityRatio,
    readinessScore,
    percentileBreakdown,
    assumptions: {
      closingCostRate,
      methodology:
        'Break-even equity = (Median home value * closing cost rate) + seller net goal. Current equity = median home value - median loan balance.'
    }
  }
}

export async function getEquityInsights(request: EquityInsightRequest = {}): Promise<EquityInsight[]> {
  const markets = await fetchRealieMarkets()

  const filtered = request.marketId
    ? markets.filter((market) => market.marketId === request.marketId || market.marketName === request.marketId)
    : markets

  const insights = filtered.map(toInsight).sort((a, b) => b.equityBuffer - a.equityBuffer)

  if (typeof request.limit === 'number' && request.limit > 0) {
    return insights.slice(0, request.limit)
  }

  return insights
}
