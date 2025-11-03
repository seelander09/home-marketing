/**
 * Comparative feature extraction
 * Features that compare property attributes to neighborhood/market averages
 */

import type { ComprehensiveMarketData } from './unified'
import type { PropertyOpportunity } from './properties'

/**
 * Extract comparative features
 */
export function extractComparativeFeatures(
  property: PropertyOpportunity,
  marketData: ComprehensiveMarketData | null
): {
  equityRatioVsNeighborhood: number | null
  valueVsNeighborhoodMedian: number | null
  yearsInHomeVsAreaAverage: number | null
  appreciationVsMarket: number | null
  debtRatioVsNeighborhood: number | null
  listingScoreVsNeighborhood: number | null
} {
  if (!marketData) {
    return {
      equityRatioVsNeighborhood: null,
      valueVsNeighborhoodMedian: null,
      yearsInHomeVsAreaAverage: null,
      appreciationVsMarket: null,
      debtRatioVsNeighborhood: null,
      listingScoreVsNeighborhood: null
    }
  }

  const census = marketData.census
  const hud = marketData.hud
  const redfin = marketData.redfin

  // Equity ratio vs neighborhood (property equity ratio vs area median - approximated)
  const propertyEquityRatio = property.marketValue > 0 ? property.estimatedEquity / property.marketValue : null
  const medianHomeValue = census?.medianHomeValue ?? null
  
  // Approximate area equity ratio: assume typical LTV of 70% for area (30% equity)
  // This is a simplification but provides useful relative comparison
  const typicalAreaEquityRatio = 0.3 // Assume 30% equity on average
  const equityRatioVsNeighborhood =
    propertyEquityRatio !== null
      ? ((propertyEquityRatio - typicalAreaEquityRatio) / typicalAreaEquityRatio) * 100
      : null

  // Value vs neighborhood median
  const valueVsNeighborhoodMedian =
    medianHomeValue && property.marketValue
      ? Math.round(((property.marketValue - medianHomeValue) / medianHomeValue) * 1000) / 10
      : null

  // Years in home vs area average
  // Estimate area average from census data: median age of housing + typical ownership tenure
  // Typical ownership tenure is ~8-10 years, use 9 as baseline
  const areaAvgOwnershipYears = 9 // Baseline estimate
  const yearsInHomeVsAreaAverage =
    property.yearsInHome !== undefined
      ? Math.round(((property.yearsInHome - areaAvgOwnershipYears) / areaAvgOwnershipYears) * 1000) / 10
      : null

  // Appreciation vs market
  // Use equity upside as proxy for property appreciation potential
  // Compare to market price appreciation
  const marketAppreciation = hud?.marketConditions.priceAppreciation ?? null
  const propertyEquityUpside = property.equityUpside && property.marketValue > 0 
    ? (property.equityUpside / property.marketValue) * 100 
    : null
  const appreciationVsMarket =
    propertyEquityUpside !== null && marketAppreciation !== null
      ? Math.round((propertyEquityUpside - marketAppreciation) * 10) / 10
      : null

  // Debt ratio vs neighborhood (LTV comparison)
  const propertyLTV = property.marketValue > 0 && property.loanBalance ? property.loanBalance / property.marketValue : null
  // Assume typical area LTV of 70%
  const typicalAreaLTV = 0.7
  const debtRatioVsNeighborhood =
    propertyLTV !== null
      ? Math.round(((propertyLTV - typicalAreaLTV) / typicalAreaLTV) * 1000) / 10
      : null

  // Listing score vs neighborhood (relative ranking)
  // Normalize listing score vs a baseline (70 is average)
  const listingScoreVsNeighborhood =
    property.listingScore !== undefined ? Math.round((property.listingScore - 70) * 10) / 10 : null

  return {
    equityRatioVsNeighborhood,
    valueVsNeighborhoodMedian,
    yearsInHomeVsAreaAverage,
    appreciationVsMarket,
    debtRatioVsNeighborhood,
    listingScoreVsNeighborhood
  }
}

