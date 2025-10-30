import data from '@/content/mock-data/realie-properties.json'
import { getSellerFeatureRecord } from '@/lib/features/seller/store'
import { getZipGeography } from '@/lib/geography/zip-crosswalk'
import type {
  EngagementSummary,
  ListingSummary,
  TransactionSummary
} from '@/lib/data-pipeline/types'
import {
  buildSellerFeatureVector,
  buildSellerSignals,
  type SellerFeatureVector,
  type SellerSignals
} from '@/lib/insights/seller-signals'

export type SellerOutcomeLabel = 'sold' | 'retained'

export type OwnerProfileType = 'first-time' | 'move-up' | 'empty-nester' | 'investor' | 'other'

export type PropertyOpportunity = {
  id: string
  address: string
  city: string
  state: string
  zip: string
  county?: string
  neighborhood?: string
  countyFips?: string
  msa?: string
  latitude?: number
  longitude?: number
  owner: string
  ownerBirthYear?: number
  ownerAge?: number | null
  householdIncomeBand?: string
  ownerType?: OwnerProfileType
  listingScore: number
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority'
  assessedValue: number
  marketValue: number
  estimatedEquity: number
  equityUpside: number
  loanBalance?: number | null
  loanInterestRate?: number | null
  monthlyMortgagePayment?: number | null
  propertyTaxAnnual?: number | null
  hasHomeEquityLine?: boolean
  digitalEngagementScore?: number | null
  lifeEventSignals?: string[]
  neighborsListed12Months?: number | null
  yearsInHome: number
  lastSaleDate?: string
  lastListingDate?: string
  soldDate?: string
  sellerOutcome?: 0 | 1
  sellerLabel?: SellerOutcomeLabel
  sellerSignals?: SellerSignals
  sellerFeatures?: SellerFeatureVector
  transactionSummary?: TransactionSummary
  listingActivity?: ListingSummary
  engagementActivity?: EngagementSummary
  featureCompleteness?: number
  featureSources?: string[]
}

const propertiesDataset: PropertyOpportunity[] = (data as PropertyOpportunity[]).map((property) => {
  const featureRecord = getSellerFeatureRecord(property.id)
  const transactionSummary: TransactionSummary | undefined = featureRecord?.transactionSummary
  const listingSummary: ListingSummary | undefined = featureRecord?.listingSummary
  const engagementSummary: EngagementSummary | undefined = featureRecord?.engagementSummary

  const geography = getZipGeography(property.zip)
  const ownerAge =
    typeof property.ownerBirthYear === 'number'
      ? new Date().getFullYear() - property.ownerBirthYear
      : null

  const derivedYearsInHome =
    Number.isFinite(property.yearsInHome) && property.yearsInHome > 0
      ? property.yearsInHome
      : Math.round(transactionSummary?.ownershipDurationYears ?? 0)

  const sellerLabel: SellerOutcomeLabel | undefined =
    property.sellerOutcome === 1
      ? 'sold'
      : property.sellerOutcome === 0 && property.sellerOutcome !== undefined
        ? 'retained'
        : undefined

  const digitalEngagementScore =
    property.digitalEngagementScore ?? engagementSummary?.multiChannelScore ?? null

  const neighborsListed12Months =
    property.neighborsListed12Months !== undefined && property.neighborsListed12Months !== null
      ? property.neighborsListed12Months
      : listingSummary?.listingsPast12Months ?? null

  const sellerSignals = buildSellerSignals({
    marketValue: property.marketValue,
    estimatedEquity: property.estimatedEquity,
    loanBalance: property.loanBalance,
    yearsInHome: derivedYearsInHome,
    householdIncomeBand: property.householdIncomeBand,
    monthlyMortgagePayment: property.monthlyMortgagePayment,
    digitalEngagementScore,
    neighborsListed12Months,
    lifeEventSignals: property.lifeEventSignals,
    recentListingCount: listingSummary?.listingsPast12Months,
    averageDaysOnMarket: listingSummary?.averageDaysOnMarket ?? null,
    transactionRecencyMonths: transactionSummary?.transactionRecencyMonths ?? null,
    refinanceCount36m: transactionSummary?.refinanceCount36m ?? 0,
    highIntentEngagement30d: engagementSummary?.highIntentEvents30Days ?? 0,
    engagementMultiChannelScore:
      engagementSummary?.multiChannelScore ?? digitalEngagementScore ?? null,
    eventsLast90Days: engagementSummary?.eventsLast90Days ?? undefined,
    ownershipDurationYears: transactionSummary?.ownershipDurationYears ?? derivedYearsInHome
  })

  const sellerFeatures = buildSellerFeatureVector({
    marketValue: property.marketValue,
    estimatedEquity: property.estimatedEquity,
    loanBalance: property.loanBalance,
    yearsInHome: derivedYearsInHome,
    householdIncomeBand: property.householdIncomeBand,
    monthlyMortgagePayment: property.monthlyMortgagePayment,
    digitalEngagementScore,
    neighborsListed12Months,
    lifeEventSignals: property.lifeEventSignals,
    listingScore: property.listingScore,
    equityUpside: property.equityUpside,
    ownerAge,
    sellerOutcome: property.sellerOutcome,
    sellerSignals,
    recentListingCount: listingSummary?.listingsPast12Months,
    averageDaysOnMarket: listingSummary?.averageDaysOnMarket ?? null,
    transactionRecencyMonths: transactionSummary?.transactionRecencyMonths ?? null,
    refinanceCount36m: transactionSummary?.refinanceCount36m ?? 0,
    highIntentEngagement30d: engagementSummary?.highIntentEvents30Days ?? 0,
    engagementMultiChannelScore:
      engagementSummary?.multiChannelScore ?? digitalEngagementScore ?? null,
    eventsLast90Days: engagementSummary?.eventsLast90Days ?? undefined,
    ownershipDurationYears: transactionSummary?.ownershipDurationYears ?? derivedYearsInHome
  })

  const lastSaleDate = property.lastSaleDate ?? transactionSummary?.lastSaleDate
  const lastListingDate = property.lastListingDate ?? listingSummary?.lastListedDate

  return {
    ...property,
    ownerAge,
    yearsInHome: derivedYearsInHome,
    digitalEngagementScore: digitalEngagementScore ?? null,
    neighborsListed12Months,
    lastSaleDate,
    lastListingDate,
    county: property.county ?? geography?.county,
    neighborhood: property.neighborhood ?? geography?.neighborhoods?.[0],
    countyFips: property.countyFips ?? geography?.countyFips,
    msa: property.msa ?? geography?.msa,
    latitude: property.latitude ?? geography?.latitude,
    longitude: property.longitude ?? geography?.longitude,
    sellerLabel,
    sellerSignals,
    sellerFeatures,
    transactionSummary: transactionSummary ?? undefined,
    listingActivity: listingSummary ?? undefined,
    engagementActivity: engagementSummary ?? undefined,
    featureCompleteness: featureRecord?.quality.completeness ?? undefined,
    featureSources: featureRecord?.quality.sources ?? undefined
  }
})

export type PropertyFilter = {
  query?: string
  city?: string
  state?: string
  zip?: string
  minScore?: number
  minEquity?: number
  minYears?: number
  sellerOutcome?: 0 | 1
  ownerType?: OwnerProfileType
  minDigitalEngagement?: number
  minEquityRatio?: number
  minLifeEventScore?: number
  minNeighborhoodListings?: number
}

export type PropertySummary = {
  total: number
  highPriority: number
  averageScore: number
  totalEquity: number
  soldShare: number
}

function normalize(value?: string) {
  return value?.trim().toLowerCase()
}

export function getPropertyOpportunities(filters: PropertyFilter = {}): {
  properties: PropertyOpportunity[]
  summary: PropertySummary
} {
  const {
    query,
    city,
    state,
    zip,
    minScore = 0,
    minEquity = 0,
    minYears = 0,
    sellerOutcome,
    ownerType,
    minDigitalEngagement,
    minEquityRatio,
    minLifeEventScore,
    minNeighborhoodListings
  } = filters

  const normalizedQuery = normalize(query)
  const normalizedCity = normalize(city)
  const normalizedState = normalize(state)
  const normalizedZip = normalize(zip)

  const items = propertiesDataset.filter((property) => {
    if (normalizedQuery) {
      const haystack = `${property.address} ${property.owner} ${property.city} ${property.zip}`.toLowerCase()
      if (!haystack.includes(normalizedQuery)) {
        return false
      }
    }
    if (normalizedCity && property.city.toLowerCase() !== normalizedCity) {
      return false
    }
    if (normalizedState && property.state.toLowerCase() !== normalizedState) {
      return false
    }
    if (normalizedZip && property.zip.toLowerCase() !== normalizedZip) {
      return false
    }
    if (property.listingScore < minScore) {
      return false
    }
    if (property.estimatedEquity < minEquity) {
      return false
    }
    if (property.yearsInHome < minYears) {
      return false
    }
    if (
      typeof sellerOutcome === 'number' &&
      property.sellerOutcome !== undefined &&
      property.sellerOutcome !== sellerOutcome
    ) {
      return false
    }
    if (ownerType && property.ownerType && property.ownerType !== ownerType) {
      return false
    }
    const signals = property.sellerSignals
    if (typeof minDigitalEngagement === 'number') {
      const digitalEngagementScore = signals?.digitalEngagementScore
      if (digitalEngagementScore != null && digitalEngagementScore < minDigitalEngagement) {
        return false
      }
    }
    if (typeof minEquityRatio === 'number') {
      const equityRatio = signals?.equityRatio
      if (equityRatio != null && equityRatio < minEquityRatio) {
        return false
      }
    }
    if (typeof minLifeEventScore === 'number') {
      const lifeEventScore = signals?.lifeEventScore
      if (lifeEventScore != null && lifeEventScore < minLifeEventScore) {
        return false
      }
    }
    if (
      typeof minNeighborhoodListings === 'number' &&
      property.neighborsListed12Months !== undefined &&
      property.neighborsListed12Months !== null &&
      property.neighborsListed12Months < minNeighborhoodListings
    ) {
      return false
    }
    return true
  })

  const totalEquity = items.reduce((acc, property) => acc + property.estimatedEquity, 0)
  const averageScore = items.length
    ? items.reduce((acc, property) => acc + property.listingScore, 0) / items.length
    : 0
  const highPriority = items.filter((property) => property.listingScore >= 80).length
  const soldCount = items.filter((property) => property.sellerOutcome === 1).length

  return {
    properties: items,
    summary: {
      total: items.length,
      highPriority,
      averageScore,
      totalEquity,
      soldShare: items.length ? soldCount / items.length : 0
    }
  }
}

export function listAllPropertyOpportunities(): PropertyOpportunity[] {
  return propertiesDataset
}
