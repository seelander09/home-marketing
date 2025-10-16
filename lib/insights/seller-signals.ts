export type SellerSignals = {
  equityRatio: number | null
  equityVelocity: number | null
  loanToValue: number | null
  mortgagePressure: number | null
  digitalEngagementScore: number | null
  neighborhoodMomentum: number | null
  lifeEventScore: number | null
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

  return {
    equityRatio: equityRatio !== null ? Math.round(equityRatio * 1000) / 10 : null,
    equityVelocity,
    loanToValue: loanToValue !== null ? Math.round(loanToValue * 1000) / 10 : null,
    mortgagePressure,
    digitalEngagementScore: input.digitalEngagementScore ?? null,
    neighborhoodMomentum,
    lifeEventScore,
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
    'ownerAge'
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
    input.ownerAge ?? 0
  ]

  return {
    featureNames,
    values,
    metadata: {
      label: input.sellerOutcome
    }
  }
}
