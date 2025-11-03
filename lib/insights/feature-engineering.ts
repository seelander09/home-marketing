/**
 * Feature engineering utilities for seller propensity model
 * Provides functions to extract market context and other advanced features
 */

import type { ComprehensiveMarketData } from './unified'

/**
 * Normalize market health to 0-100 scale
 */
export function normalizeMarketHealth(
  marketHealth: 'excellent' | 'good' | 'fair' | 'poor' | null | undefined
): number | null {
  if (!marketHealth) return null
  const mapping: Record<string, number> = {
    excellent: 100,
    good: 75,
    fair: 50,
    poor: 25
  }
  return mapping[marketHealth] ?? null
}

/**
 * Extract market context features from ComprehensiveMarketData
 */
export function extractMarketContextFeatures(
  marketData: ComprehensiveMarketData | null
): {
  marketHealthScore: number | null
  affordabilityScore: number | null
  investmentPotential: number | null
  marketVelocityNormalized: number | null
  inventoryTightness: number | null
  mortgageRateTrend: number | null
  unemploymentLocal: number | null
  marketCompetitiveness: number | null
  priceAppreciationLocal: number | null
  medianDaysOnMarketLocal: number | null
} {
  if (!marketData) {
    return {
      marketHealthScore: null,
      affordabilityScore: null,
      investmentPotential: null,
      marketVelocityNormalized: null,
      inventoryTightness: null,
      mortgageRateTrend: null,
      unemploymentLocal: null,
      marketCompetitiveness: null,
      priceAppreciationLocal: null,
      medianDaysOnMarketLocal: null
    }
  }

  const insights = marketData.insights
  const redfin = marketData.redfin
  const hud = marketData.hud
  const economic = marketData.economic

  // Market health score
  const marketHealthScore = normalizeMarketHealth(insights?.marketHealth ?? null)

  // Affordability score (0-100)
  const affordabilityScore =
    insights?.affordabilityScore !== null && insights.affordabilityScore !== undefined
      ? Math.max(0, Math.min(100, insights.affordabilityScore))
      : null

  // Investment potential (0-100)
  const investmentPotential =
    insights?.investmentPotential !== null && insights.investmentPotential !== undefined
      ? Math.max(0, Math.min(100, insights.investmentPotential))
      : null

  // Market velocity normalized (0-100)
  const marketVelocityNormalized =
    insights?.marketVelocity !== null && insights.marketVelocity !== undefined
      ? Math.max(0, Math.min(100, insights.marketVelocity))
      : null

  // Inventory tightness: invert months of supply (lower supply = higher tightness = higher score)
  // Scale: 0 months = 100, 8+ months = 0
  const monthsOfSupply = redfin?.monthsOfSupply ?? null
  const inventoryTightness =
    monthsOfSupply !== null ? Math.max(0, Math.min(100, 100 - (monthsOfSupply / 8) * 100)) : null

  // Mortgage rate trend: current rate vs historical average (assume 5.5% historical avg)
  // Lower rates = higher score (0-100 scale)
  const currentMortgageRate = economic?.mortgageRates.rate30Year ?? null
  const historicalAvgMortgageRate = 5.5
  const mortgageRateTrend =
    currentMortgageRate !== null
      ? Math.max(0, Math.min(100, 100 - ((currentMortgageRate - 3) / 4) * 100))
      : null

  // Unemployment local impact (inverted: lower unemployment = higher score)
  const unemploymentRate = economic?.economicIndicators.unemploymentRate ?? null
  const unemploymentLocal =
    unemploymentRate !== null ? Math.max(0, Math.min(100, 100 - (unemploymentRate / 10) * 100)) : null

  // Market competitiveness: combination of sold above list + DOM
  // Higher % sold above list + lower DOM = higher competitiveness
  const soldAboveList = redfin?.soldAboveList ?? null
  const medianDom = redfin?.medianDom ?? null
  const marketCompetitiveness =
    soldAboveList !== null && medianDom !== null
      ? Math.max(
          0,
          Math.min(100, soldAboveList * 200 + Math.max(0, 100 - (medianDom / 90) * 100) * 0.5)
        )
      : soldAboveList !== null
        ? soldAboveList * 200
        : medianDom !== null
          ? Math.max(0, 100 - (medianDom / 90) * 100)
          : null

  // Price appreciation local
  const priceAppreciationLocal =
    hud && hud.marketConditions.priceAppreciation !== null &&
    hud.marketConditions.priceAppreciation !== undefined
      ? Math.max(0, Math.min(100, (hud.marketConditions.priceAppreciation + 5) * 5))
      : null

  // Median days on market local
  const medianDaysOnMarketLocal = medianDom

  return {
    marketHealthScore,
    affordabilityScore,
    investmentPotential,
    marketVelocityNormalized,
    inventoryTightness,
    mortgageRateTrend,
    unemploymentLocal,
    marketCompetitiveness,
    priceAppreciationLocal,
    medianDaysOnMarketLocal
  }
}

/**
 * Normalize value to 0-100 scale
 */
export function normalizeToScale(
  value: number | null | undefined,
  min: number,
  max: number,
  invert = false
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  if (max === min) return null

  const bounded = Math.max(Math.min(value, Math.max(min, max)), Math.min(min, max))
  const ratio = (bounded - min) / (max - min)
  const normalized = invert ? 1 - ratio : ratio
  return Math.max(0, Math.min(100, normalized * 100))
}

/**
 * Extract financial stress and property characteristics features
 */
export function extractFinancialPropertyFeatures(input: {
  marketValue: number
  estimatedEquity: number
  loanBalance?: number | null
  monthlyMortgagePayment?: number | null
  householdIncomeBand?: string
  propertyTaxAnnual?: number | null
  assessedValue?: number
  loanInterestRate?: number | null
  hasHomeEquityLine?: boolean
  censusData?: {
    medianYearBuilt?: number | null
    [key: string]: unknown
  }
}): {
  debtServiceRatio: number | null
  paymentToIncomeRatio: number | null
  taxBurdenRatio: number | null
  assessedValueRatio: number | null
  refinanceUrgencyScore: number | null
  negativeEquityRisk: number | null
  propertyAge: number | null
} {
  const INCOME_BAND_TO_AVERAGE: Record<string, number> = {
    '100k-125k': 112500,
    '125k-150k': 137500,
    '150k-175k': 162500,
    '150k-200k': 175000,
    '175k-200k': 187500,
    '200k+': 225000
  }

  const estimatedAnnualIncome = input.householdIncomeBand
    ? INCOME_BAND_TO_AVERAGE[input.householdIncomeBand] ?? 140000
    : 140000

  // Debt service ratio: monthly payments / monthly income
  const monthlyIncome = estimatedAnnualIncome / 12
  const debtServiceRatio =
    input.monthlyMortgagePayment && monthlyIncome > 0
      ? (input.monthlyMortgagePayment / monthlyIncome) * 100
      : null

  // Payment to income ratio
  const paymentToIncomeRatio = debtServiceRatio

  // Tax burden ratio: annual property tax / market value
  const taxBurdenRatio =
    input.propertyTaxAnnual && input.marketValue > 0
      ? (input.propertyTaxAnnual / input.marketValue) * 100
      : null

  // Assessed value ratio: assessed value / market value (indicates potential for tax appeal)
  const assessedValueRatio =
    input.assessedValue && input.marketValue > 0 ? input.assessedValue / input.marketValue : null

  // Refinance urgency score: combination of rate, payment, equity
  // Higher score = more likely to refinance (which might delay selling)
  const currentYear = new Date().getFullYear()
  const historicalAvgRate = 5.5
  const currentRate = input.loanInterestRate ?? historicalAvgRate
  const rateDiff = currentRate - historicalAvgRate // Positive = higher than historical
  const ltv = input.loanBalance && input.marketValue > 0 ? input.loanBalance / input.marketValue : null
  const equityRatio = input.marketValue > 0 ? input.estimatedEquity / input.marketValue : null

  const refinanceUrgencyScore =
    rateDiff > 0.5 && equityRatio !== null && equityRatio > 0.2 && ltv !== null && ltv < 0.8
      ? Math.min(100, Math.max(0, (rateDiff * 20) + (equityRatio * 30)))
      : null

  // Negative equity risk: probability of being underwater
  // Risk increases as equity ratio approaches 0 or goes negative
  const negativeEquityRisk =
    equityRatio !== null && equityRatio < 0
      ? Math.min(100, Math.abs(equityRatio) * 100)
      : equityRatio !== null && equityRatio < 0.1
        ? Math.min(100, (0.1 - equityRatio) * 1000)
        : null

  // Property age (from census data or estimate)
  const propertyAge = input.censusData?.medianYearBuilt
    ? currentYear - (input.censusData.medianYearBuilt as number)
    : null

  return {
    debtServiceRatio,
    paymentToIncomeRatio,
    taxBurdenRatio,
    assessedValueRatio,
    refinanceUrgencyScore,
    negativeEquityRisk,
    propertyAge
  }
}

/**
 * Extract interaction features (combinations of existing features)
 */
export function extractInteractionFeatures(input: {
  equityRatio: number | null
  yearsInHome: number
  marketHeatScore?: number | null
  lifeEventScore?: number | null
  engagementScore?: number | null
  ownerAge?: number | null
  mortgagePressure?: number | null
  marketVelocity?: number | null
  neighborhoodMomentum?: number | null
  listingScore: number
  debtRatio?: number | null
  incomePressure?: number | null
  refinanceIntensity?: number | null
  equityVelocity?: number | null
}): {
  equityRatioXYearsInHome: number | null
  marketHeatXEquityRatio: number | null
  lifeEventXEngagement: number | null
  ageXEquity: number | null
  mortgagePressureXMarketVelocity: number | null
  neighborhoodMomentumXListingScore: number | null
  debtRatioXIncomePressure: number | null
  refinanceSignalXEquityGrowth: number | null
} {
  // Interaction: Equity ratio × Years in home
  const equityRatioXYearsInHome =
    input.equityRatio !== null && input.yearsInHome > 0
      ? (input.equityRatio * 100) * input.yearsInHome / 10 // Normalize to 0-100
      : null

  // Interaction: Market heat × Equity ratio
  const marketHeatXEquityRatio =
    input.marketHeatScore !== null && input.marketHeatScore !== undefined && input.equityRatio !== null
      ? (input.marketHeatScore / 100) * (input.equityRatio * 100)
      : null

  // Interaction: Life event × Engagement
  const lifeEventXEngagement =
    input.lifeEventScore !== null && input.lifeEventScore !== undefined && input.engagementScore !== null && input.engagementScore !== undefined
      ? (input.lifeEventScore / 100) * input.engagementScore
      : null

  // Interaction: Owner age × Equity ratio (life stage indicator)
  const ageXEquity =
    input.ownerAge !== null && input.ownerAge !== undefined && input.equityRatio !== null
      ? (input.ownerAge / 100) * (input.equityRatio * 100)
      : null

  // Interaction: Mortgage pressure × Market velocity
  const mortgagePressureXMarketVelocity =
    input.mortgagePressure !== null && input.mortgagePressure !== undefined && input.marketVelocity !== null && input.marketVelocity !== undefined
      ? (input.mortgagePressure / 100) * input.marketVelocity
      : null

  // Interaction: Neighborhood momentum × Listing score
  const neighborhoodMomentumXListingScore =
    input.neighborhoodMomentum !== null && input.neighborhoodMomentum !== undefined
      ? (input.neighborhoodMomentum / 100) * input.listingScore
      : null

  // Interaction: Debt ratio × Income pressure
  const debtRatioXIncomePressure =
    input.debtRatio !== null && input.debtRatio !== undefined && input.incomePressure !== null && input.incomePressure !== undefined
      ? (input.debtRatio * 100) * (input.incomePressure / 100)
      : null

  // Interaction: Refinance signal × Equity growth
  const refinanceSignalXEquityGrowth =
    input.refinanceIntensity !== null && input.refinanceIntensity !== undefined && input.equityVelocity !== null && input.equityVelocity !== undefined
      ? (input.refinanceIntensity / 100) * Math.max(0, input.equityVelocity * 10)
      : null

  return {
    equityRatioXYearsInHome,
    marketHeatXEquityRatio,
    lifeEventXEngagement,
    ageXEquity,
    mortgagePressureXMarketVelocity,
    neighborhoodMomentumXListingScore,
    debtRatioXIncomePressure,
    refinanceSignalXEquityGrowth
  }
}

