/**
 * Temporal and seasonal feature extraction
 * Time-based features that capture patterns and recency
 */

/**
 * Calculate months since a given date
 */
export function monthsSinceDate(date: Date | string | null | undefined, now = new Date()): number | null {
  if (!date) return null
  const targetDate = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(targetDate.getTime())) return null
  
  const months = (now.getFullYear() - targetDate.getFullYear()) * 12 + (now.getMonth() - targetDate.getMonth())
  return Math.max(0, months)
}

/**
 * Calculate days since a given date
 */
export function daysSinceDate(date: Date | string | null | undefined, now = new Date()): number | null {
  if (!date) return null
  const targetDate = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(targetDate.getTime())) return null
  
  const days = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

/**
 * Seasonal selling window score (0-100)
 * Higher scores for spring/summer months when selling activity peaks
 */
export function computeSeasonalSellingWindow(now = new Date()): number {
  const month = now.getMonth() + 1 // 1-12
  
  // Peak selling months: March (3) through August (8)
  // Score based on proximity to peak (May/June = 100)
  if (month >= 3 && month <= 8) {
    // Spring/summer peak
    if (month === 5 || month === 6) return 100
    if (month === 4 || month === 7) return 85
    if (month === 3 || month === 8) return 70
  } else if (month >= 9 && month <= 11) {
    // Fall shoulder season
    return 50
  } else {
    // Winter (Dec, Jan, Feb) - lower activity
    return 30
  }
  
  return 50
}

/**
 * Extract temporal features
 */
export function extractTemporalFeatures(input: {
  lastSaleDate?: string | null
  lastListingDate?: string | null
  lastEngagedAt?: string | null
  lastRefinanceDate?: string | null
  transactionRecencyMonths?: number | null
}): {
  monthsSinceLastSale: number | null
  daysSinceLastEngagement: number | null
  seasonalSellingWindow: number
  timeSinceRefinance: number | null
  ageOfListingHistory: number | null
} {
  const now = new Date()
  
  return {
    monthsSinceLastSale: input.transactionRecencyMonths ?? monthsSinceDate(input.lastSaleDate, now),
    daysSinceLastEngagement: daysSinceDate(input.lastEngagedAt, now),
    seasonalSellingWindow: computeSeasonalSellingWindow(now),
    timeSinceRefinance: monthsSinceDate(input.lastRefinanceDate, now),
    ageOfListingHistory: monthsSinceDate(input.lastListingDate, now)
  }
}

