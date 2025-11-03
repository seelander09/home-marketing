import type { ComprehensiveMarketData } from './unified'
import { extractMarketContextFeatures, extractFinancialPropertyFeatures, extractInteractionFeatures } from './feature-engineering'
import { extractTemporalFeatures } from './temporal-features'
import { extractComparativeFeatures } from './comparative-features'

export type SellerSignals = {
  equityRatio: number | null
  equityVelocity: number | null
  loanToValue: number | null
  mortgagePressure: number | null
  digitalEngagementScore: number | null
  neighborhoodMomentum: number | null
  lifeEventScore: number | null
  listingMomentum: number | null
  transactionRecencyScore: number | null
  refinanceIntensity: number | null
  engagementIntentScore: number | null
  eventsLast90Days: number | null
  flags: string[]
}

export type SellerFeatureVector = {
  featureNames: string[]
  values: number[]
  metadata: {
    label?: 0 | 1
  }
}

export type SellerSignalInput = {
  marketValue: number
  estimatedEquity: number
  loanBalance?: number | null
  yearsInHome: number
  householdIncomeBand?: string
  monthlyMortgagePayment?: number | null
  digitalEngagementScore?: number | null
  neighborsListed12Months?: number | null
  lifeEventSignals?: string[]
  recentListingCount?: number
  averageDaysOnMarket?: number | null
  transactionRecencyMonths?: number | null
  refinanceCount36m?: number
  highIntentEngagement30d?: number
  engagementMultiChannelScore?: number | null
  eventsLast90Days?: number
  ownershipDurationYears?: number | null
}

export type SellerFeatureInput = SellerSignalInput & {
  listingScore: number
  equityUpside: number
  ownerAge?: number | null
  sellerOutcome?: 0 | 1
  sellerSignals?: SellerSignals
  marketData?: ComprehensiveMarketData | null
  property?: {
    id: string
    lastSaleDate?: string | null
    lastListingDate?: string | null
    propertyTaxAnnual?: number | null
    assessedValue?: number
    [key: string]: unknown
  }
  engagementActivity?: {
    lastEngagedAt?: string | null
    [key: string]: unknown
  }
}

const INCOME_BAND_TO_AVERAGE: Record<string, number> = {
  '100k-125k': 112500,
  '125k-150k': 137500,
  '150k-175k': 162500,
  '150k-200k': 175000,
  '175k-200k': 187500,
  '200k+': 225000
}

const LIFE_EVENT_WEIGHTS = new Map<string, number>([
  ['job-relocation', 1],
  ['promotion-announced', 0.8],
  ['remote-work-shift', 0.6],
  ['kids-off-to-college', 0.7],
  ['downsizing-research', 0.65],
  ['retirement-planning', 0.75],
  ['retirement-countdown', 0.85],
  ['expecting-child', 0.9],
  ['growing-family', 0.95],
  ['capital-gains-planning', 0.5],
  ['portfolio-rebalance', 0.55],
  ['new-business-launch', 0.4]
])

export function computeLifeEventScore(lifeEventSignals?: string[]) {
  if (!lifeEventSignals?.length) {
    return null
  }

  const baseScore = lifeEventSignals.reduce((acc, signal) => {
    const weight = LIFE_EVENT_WEIGHTS.get(signal) ?? 0.5
    return acc + weight
  }, 0)

  const normalized = baseScore / lifeEventSignals.length
  return Math.round(Math.min(1, normalized) * 100)
}

export function buildSellerSignals(input: SellerSignalInput): SellerSignals {
  const equityRatio =
    input.marketValue > 0 ? input.estimatedEquity / input.marketValue : null
  const equityVelocity =
    equityRatio !== null && input.yearsInHome > 0
      ? Math.round(((equityRatio * 100) / input.yearsInHome) * 10) / 10
      : null

  const loanToValue =
    input.marketValue > 0 && input.loanBalance !== undefined && input.loanBalance !== null
      ? input.loanBalance / input.marketValue
      : null

  const mortgagePressure =
    input.monthlyMortgagePayment && input.householdIncomeBand
      ? Math.round(
          ((input.monthlyMortgagePayment * 12) /
            (INCOME_BAND_TO_AVERAGE[input.householdIncomeBand] ?? 140000)) *
            100
        )
      : null

  const neighborhoodMomentum =
    typeof input.neighborsListed12Months === 'number'
      ? Math.round(Math.min(input.neighborsListed12Months * 8, 100))
      : null

  const lifeEventScore = computeLifeEventScore(input.lifeEventSignals)

  const listingMomentum =
    typeof input.recentListingCount === 'number'
      ? Math.round(
          Math.min(
            100,
            input.recentListingCount * 22 +
              Math.max(0, 60 - (input.averageDaysOnMarket ?? 60)) * 0.8
          )
        )
      : null

  const transactionRecencyScore =
    input.transactionRecencyMonths !== undefined && input.transactionRecencyMonths !== null
      ? Math.max(0, 100 - Math.min(input.transactionRecencyMonths, 60) * 1.5)
      : null

  const refinanceIntensity =
    typeof input.refinanceCount36m === 'number'
      ? Math.min(100, input.refinanceCount36m * 35)
      : null

  const eventsLast90Days =
    typeof input.eventsLast90Days === 'number' ? input.eventsLast90Days : null

  const engagementSource =
    typeof input.engagementMultiChannelScore === 'number'
      ? input.engagementMultiChannelScore
      : typeof input.digitalEngagementScore === 'number'
        ? input.digitalEngagementScore
        : null

  const engagementIntentScore =
    engagementSource !== null
      ? Math.round(
          Math.min(
            100,
            engagementSource * 0.6 +
              (input.highIntentEngagement30d ?? 0) * 10 +
              (eventsLast90Days ?? 0) * 2
          )
        )
      : typeof input.highIntentEngagement30d === 'number'
        ? Math.round(Math.min(100, input.highIntentEngagement30d * 12))
        : null

  const flags: string[] = []

  if (loanToValue !== null && loanToValue > 0.8) {
    flags.push('high-ltv')
  }
  if (mortgagePressure !== null && mortgagePressure > 35) {
    flags.push('payment-burden')
  }
  if (lifeEventScore !== null && lifeEventScore >= 70) {
    flags.push('life-event-disruption')
  }
  if (neighborhoodMomentum !== null && neighborhoodMomentum >= 60) {
    flags.push('neighborhood-turnover')
  }
  if (listingMomentum !== null && listingMomentum >= 70) {
    flags.push('recent-listing-activity')
  }
  if (transactionRecencyScore !== null && transactionRecencyScore <= 35) {
    flags.push('recent-transaction-history')
  }
  if (refinanceIntensity !== null && refinanceIntensity >= 60) {
    flags.push('refinance-signal')
  }
  if (engagementIntentScore !== null && engagementIntentScore >= 65) {
    flags.push('high-intent-engagement')
  }

  return {
    equityRatio: equityRatio !== null ? Math.round(equityRatio * 1000) / 10 : null,
    equityVelocity,
    loanToValue: loanToValue !== null ? Math.round(loanToValue * 1000) / 10 : null,
    mortgagePressure,
    digitalEngagementScore: input.digitalEngagementScore ?? null,
    neighborhoodMomentum,
    lifeEventScore,
    listingMomentum,
    transactionRecencyScore,
    refinanceIntensity,
    engagementIntentScore,
    eventsLast90Days,
    flags
  }
}

export function buildSellerFeatureVector(input: SellerFeatureInput): SellerFeatureVector {
  const signals = input.sellerSignals ?? buildSellerSignals(input)
  
  // Extract market context features if marketData is available
  const marketFeatures = input.marketData 
    ? extractMarketContextFeatures(input.marketData)
    : null

  // Extract temporal features
  const temporalFeatures = extractTemporalFeatures({
    lastSaleDate: input.property?.lastSaleDate ?? undefined,
    lastListingDate: input.property?.lastListingDate ?? undefined,
    lastEngagedAt: input.engagementActivity?.lastEngagedAt ?? undefined,
    lastRefinanceDate: undefined, // Would need from transaction summary
    transactionRecencyMonths: input.transactionRecencyMonths ?? null
  })

  // Extract comparative features (requires property object and marketData)
  const comparativeFeatures = input.property && input.marketData
    ? extractComparativeFeatures(input.property as any, input.marketData)
    : {
        equityRatioVsNeighborhood: null,
        valueVsNeighborhoodMedian: null,
        yearsInHomeVsAreaAverage: null,
        appreciationVsMarket: null,
        debtRatioVsNeighborhood: null,
        listingScoreVsNeighborhood: null
      }

  // Extract financial and property features
  const financialPropertyFeatures = extractFinancialPropertyFeatures({
    marketValue: input.marketValue,
    estimatedEquity: input.estimatedEquity,
    loanBalance: input.loanBalance,
    monthlyMortgagePayment: input.monthlyMortgagePayment,
    householdIncomeBand: input.householdIncomeBand,
    propertyTaxAnnual: input.property?.propertyTaxAnnual ?? null,
    assessedValue: input.property?.assessedValue,
    loanInterestRate: undefined, // Would need from property data
    hasHomeEquityLine: undefined,
    censusData: input.marketData?.census ? {
      medianYearBuilt: input.marketData.census.medianYearBuilt
    } : undefined
  })

  // Extract interaction features
  const interactionFeatures = extractInteractionFeatures({
    equityRatio: signals.equityRatio,
    yearsInHome: input.yearsInHome,
    marketHeatScore: marketFeatures?.marketHealthScore ?? null,
    lifeEventScore: signals.lifeEventScore,
    engagementScore: signals.engagementIntentScore,
    ownerAge: input.ownerAge ?? null,
    mortgagePressure: signals.mortgagePressure,
    marketVelocity: marketFeatures?.marketVelocityNormalized ?? null,
    neighborhoodMomentum: signals.neighborhoodMomentum,
    listingScore: input.listingScore,
    debtRatio: signals.loanToValue,
    incomePressure: signals.mortgagePressure,
    refinanceIntensity: signals.refinanceIntensity,
    equityVelocity: signals.equityVelocity
  })

  const featureNames = [
    // Original features (24)
    'equityRatio',
    'equityVelocity',
    'loanToValue',
    'mortgagePressure',
    'digitalEngagementScore',
    'neighborhoodMomentum',
    'lifeEventScore',
    'yearsInHome',
    'listingScore',
    'estimatedEquity',
    'equityUpside',
    'loanBalance',
    'ownerAge',
    'listingMomentum',
    'transactionRecencyScore',
    'refinanceIntensity',
    'engagementIntentScore',
    'recentListingCount',
    'averageDaysOnMarket',
    'highIntentEngagement30d',
    'multiChannelEngagementScore',
    'transactionRecencyMonths',
    'refinanceCount36m',
    'eventsLast90Days',
    // Phase 1: Market context features (10)
    'marketHealthScore',
    'affordabilityScore',
    'investmentPotential',
    'marketVelocityNormalized',
    'inventoryTightness',
    'mortgageRateTrend',
    'unemploymentLocal',
    'marketCompetitiveness',
    'priceAppreciationLocal',
    'medianDaysOnMarketLocal',
    // Phase 2: Temporal features (5)
    'monthsSinceLastSale',
    'daysSinceLastEngagement',
    'seasonalSellingWindow',
    'timeSinceRefinance',
    'ageOfListingHistory',
    // Phase 2: Comparative features (6)
    'equityRatioVsNeighborhood',
    'valueVsNeighborhoodMedian',
    'yearsInHomeVsAreaAverage',
    'appreciationVsMarket',
    'debtRatioVsNeighborhood',
    'listingScoreVsNeighborhood',
    // Phase 3: Financial & Property features (7)
    'debtServiceRatio',
    'paymentToIncomeRatio',
    'taxBurdenRatio',
    'assessedValueRatio',
    'refinanceUrgencyScore',
    'negativeEquityRisk',
    'propertyAge',
    // Phase 4: Interaction features (8)
    'equityRatioXYearsInHome',
    'marketHeatXEquityRatio',
    'lifeEventXEngagement',
    'ageXEquity',
    'mortgagePressureXMarketVelocity',
    'neighborhoodMomentumXListingScore',
    'debtRatioXIncomePressure',
    'refinanceSignalXEquityGrowth'
  ]

  const values = [
    // Original feature values (24)
    signals.equityRatio ?? 0,
    signals.equityVelocity ?? 0,
    signals.loanToValue ?? 0,
    signals.mortgagePressure ?? 0,
    signals.digitalEngagementScore ?? 0,
    signals.neighborhoodMomentum ?? 0,
    signals.lifeEventScore ?? 0,
    input.yearsInHome,
    input.listingScore,
    input.estimatedEquity,
    input.equityUpside,
    input.loanBalance ?? 0,
    input.ownerAge ?? 0,
    signals.listingMomentum ?? 0,
    signals.transactionRecencyScore ?? 0,
    signals.refinanceIntensity ?? 0,
    signals.engagementIntentScore ?? 0,
    input.recentListingCount ?? 0,
    input.averageDaysOnMarket ?? 0,
    input.highIntentEngagement30d ?? 0,
    input.engagementMultiChannelScore ?? 0,
    input.transactionRecencyMonths ?? 0,
    input.refinanceCount36m ?? 0,
    signals.eventsLast90Days ?? 0,
    // Phase 1: Market context feature values (10)
    marketFeatures?.marketHealthScore ?? 0,
    marketFeatures?.affordabilityScore ?? 0,
    marketFeatures?.investmentPotential ?? 0,
    marketFeatures?.marketVelocityNormalized ?? 0,
    marketFeatures?.inventoryTightness ?? 0,
    marketFeatures?.mortgageRateTrend ?? 0,
    marketFeatures?.unemploymentLocal ?? 0,
    marketFeatures?.marketCompetitiveness ?? 0,
    marketFeatures?.priceAppreciationLocal ?? 0,
    marketFeatures?.medianDaysOnMarketLocal ?? 0,
    // Phase 2: Temporal feature values (5)
    temporalFeatures.monthsSinceLastSale ?? 0,
    temporalFeatures.daysSinceLastEngagement ?? 0,
    temporalFeatures.seasonalSellingWindow,
    temporalFeatures.timeSinceRefinance ?? 0,
    temporalFeatures.ageOfListingHistory ?? 0,
    // Phase 2: Comparative feature values (6)
    comparativeFeatures.equityRatioVsNeighborhood ?? 0,
    comparativeFeatures.valueVsNeighborhoodMedian ?? 0,
    comparativeFeatures.yearsInHomeVsAreaAverage ?? 0,
    comparativeFeatures.appreciationVsMarket ?? 0,
    comparativeFeatures.debtRatioVsNeighborhood ?? 0,
    comparativeFeatures.listingScoreVsNeighborhood ?? 0,
    // Phase 3: Financial & Property feature values (7)
    financialPropertyFeatures.debtServiceRatio ?? 0,
    financialPropertyFeatures.paymentToIncomeRatio ?? 0,
    financialPropertyFeatures.taxBurdenRatio ?? 0,
    financialPropertyFeatures.assessedValueRatio ?? 0,
    financialPropertyFeatures.refinanceUrgencyScore ?? 0,
    financialPropertyFeatures.negativeEquityRisk ?? 0,
    financialPropertyFeatures.propertyAge ?? 0,
    // Phase 4: Interaction feature values (8)
    interactionFeatures.equityRatioXYearsInHome ?? 0,
    interactionFeatures.marketHeatXEquityRatio ?? 0,
    interactionFeatures.lifeEventXEngagement ?? 0,
    interactionFeatures.ageXEquity ?? 0,
    interactionFeatures.mortgagePressureXMarketVelocity ?? 0,
    interactionFeatures.neighborhoodMomentumXListingScore ?? 0,
    interactionFeatures.debtRatioXIncomePressure ?? 0,
    interactionFeatures.refinanceSignalXEquityGrowth ?? 0
  ]

  return {
    featureNames,
    values,
    metadata: {
      label: input.sellerOutcome
    }
  }
}
