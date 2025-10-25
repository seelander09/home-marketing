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

  const featureNames = [
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
    'eventsLast90Days'
  ]

  const values = [
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
    signals.eventsLast90Days ?? 0
  ]

  return {
    featureNames,
    values,
    metadata: {
      label: input.sellerOutcome
    }
  }
}
