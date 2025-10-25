import type { z } from 'zod'

import {
  EngagementEventSchema,
  ListingEventSchema,
  TransactionEventSchema
} from '@/lib/data-pipeline/validation-schemas'

export type TransactionEvent = z.infer<typeof TransactionEventSchema>
export type ListingEvent = z.infer<typeof ListingEventSchema>
export type EngagementEvent = z.infer<typeof EngagementEventSchema>

export type IngestionBundle = {
  transactions: TransactionEvent[]
  listings: ListingEvent[]
  engagement: EngagementEvent[]
}

export type DataQualityMetric = {
  id: string
  label: string
  value: number
  unit: '%' | 'count'
  target?: number
}

export type FeatureStoreSourceVersions = {
  transactionsVersion?: string
  listingsVersion?: string
  engagementVersion?: string
}

export type TransactionSummary = {
  lastSaleDate?: string
  lastSalePrice?: number
  ownershipDurationYears?: number | null
  transactionRecencyMonths?: number | null
  refinanceCount36m: number
}

export type ListingSummary = {
  lastListedDate?: string
  lastStatus?: string
  listingsPast12Months: number
  activeListings: number
  averageDaysOnMarket?: number | null
}

export type EngagementSummary = {
  lastEngagedAt?: string
  eventsLast90Days: number
  highIntentEvents30Days: number
  multiChannelScore: number
  channelCounts: Record<string, number>
}

export type MacroSummary = {
  affordabilityScore?: number | null
  marketVelocity?: number | null
  marketHealth?: 'excellent' | 'good' | 'fair' | 'poor' | null
}

export type SellerFeatureStoreRecord = {
  propertyId: string
  transactionSummary: TransactionSummary
  listingSummary: ListingSummary
  engagementSummary: EngagementSummary
  macroSummary: MacroSummary
  quality: {
    sources: string[]
    completeness: number
  }
}

export type SellerFeatureStoreSnapshot = {
  generatedAt: string
  recordCount: number
  stats: {
    propertiesWithTransactions: number
    propertiesWithListings: number
    propertiesWithEngagement: number
    averageCompleteness: number
  }
  sources: FeatureStoreSourceVersions
  records: SellerFeatureStoreRecord[]
  qualityMetrics: DataQualityMetric[]
}
