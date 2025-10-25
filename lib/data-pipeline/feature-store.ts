import { differenceInCalendarMonths } from '@/lib/utils/date'
import type {
  EngagementEvent,
  EngagementSummary,
  FeatureStoreSourceVersions,
  IngestionBundle,
  ListingEvent,
  ListingSummary,
  SellerFeatureStoreRecord,
  SellerFeatureStoreSnapshot,
  TransactionEvent,
  TransactionSummary
} from '@/lib/data-pipeline/types'

const MILLIS_IN_DAY = 1000 * 60 * 60 * 24

function toDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function differenceInYears(later: Date, earlier: Date) {
  const diff = later.getTime() - earlier.getTime()
  return diff <= 0 ? 0 : diff / (MILLIS_IN_DAY * 365.25)
}

function computeTransactionSummary(
  events: TransactionEvent[],
  now: Date
): TransactionSummary {
  if (!events.length) {
    return {
      refinanceCount36m: 0,
      ownershipDurationYears: null,
      transactionRecencyMonths: null
    }
  }

  const sorted = events.slice().sort((a, b) => {
    return new Date(b.closedDate).getTime() - new Date(a.closedDate).getTime()
  })

  const lastSale = sorted.find((event) => event.eventType === 'sale') ?? sorted[0]
  const lastSaleDate = toDate(lastSale?.closedDate ?? '')
  const lastSalePrice = lastSale?.price
  const ownershipDurationYears =
    lastSaleDate !== null ? differenceInYears(now, lastSaleDate) : null
  const transactionRecencyMonths =
    lastSaleDate !== null ? differenceInCalendarMonths(now, lastSaleDate) : null

  const refinanceCount36m = events.filter((event) => {
    if (event.eventType !== 'refinance') {
      return false
    }
    const eventDate = toDate(event.closedDate)
    if (!eventDate) {
      return false
    }
    return differenceInCalendarMonths(now, eventDate) <= 36
  }).length

  return {
    lastSaleDate: lastSaleDate?.toISOString(),
    lastSalePrice,
    ownershipDurationYears:
      ownershipDurationYears !== null
        ? Math.round(ownershipDurationYears * 10) / 10
        : null,
    transactionRecencyMonths,
    refinanceCount36m
  }
}

function computeListingSummary(events: ListingEvent[], now: Date): ListingSummary {
  if (!events.length) {
    return {
      listingsPast12Months: 0,
      activeListings: 0
    }
  }

  const sorted = events.slice().sort((a, b) => {
    return new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime()
  })
  const lastListedDate = toDate(sorted[0]?.listedDate ?? '')
  const lastStatus = sorted[0]?.status

  const listingsPast12Months = events.filter((event) => {
    const listed = toDate(event.listedDate)
    if (!listed) return false
    return differenceInCalendarMonths(now, listed) <= 12
  }).length

  const activeListings = events.filter((event) =>
    ['active', 'pending', 'coming-soon'].includes(event.status)
  ).length

  const domValues = events
    .map((event) => event.daysOnMarket)
    .filter((value): value is number => typeof value === 'number' && value >= 0)
  const averageDaysOnMarket = domValues.length
    ? domValues.reduce((acc, value) => acc + value, 0) / domValues.length
    : null

  return {
    lastListedDate: lastListedDate?.toISOString(),
    lastStatus,
    listingsPast12Months,
    activeListings,
    averageDaysOnMarket:
      averageDaysOnMarket !== null
        ? Math.round(averageDaysOnMarket * 10) / 10
        : null
  }
}

const HIGH_INTENT_EVENTS = new Set([
  'valuation-check',
  'seller-guide-download',
  'form_submission',
  'conversation',
  'call',
  'link-click'
])

function computeEngagementSummary(
  events: EngagementEvent[],
  now: Date
): EngagementSummary {
  if (!events.length) {
    return {
      eventsLast90Days: 0,
      highIntentEvents30Days: 0,
      channelCounts: {},
      multiChannelScore: 0
    }
  }

  const ninetyDaysAgo = new Date(now.getTime() - 90 * MILLIS_IN_DAY)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MILLIS_IN_DAY)

  let eventsLast90Days = 0
  let highIntentEvents30Days = 0
  const channelCounts = new Map<string, number>()
  let lastEngagedAt: Date | null = null

  for (const event of events) {
    const occurredAt = toDate(event.occurredAt)
    if (!occurredAt) continue

    const channelCount = channelCounts.get(event.channel) ?? 0
    channelCounts.set(event.channel, channelCount + 1)

    if (occurredAt >= ninetyDaysAgo) {
      eventsLast90Days += 1
    }
    if (occurredAt >= thirtyDaysAgo && HIGH_INTENT_EVENTS.has(event.event)) {
      highIntentEvents30Days += 1
    }
    if (!lastEngagedAt || occurredAt > lastEngagedAt) {
      lastEngagedAt = occurredAt
    }
  }

  const uniqueChannelCount = channelCounts.size
  const multiChannelScore = Math.min(
    100,
    uniqueChannelCount * 20 +
      Math.min(eventsLast90Days, 12) * 3 +
      highIntentEvents30Days * 8
  )

  return {
    lastEngagedAt: lastEngagedAt?.toISOString(),
    eventsLast90Days,
    highIntentEvents30Days,
    channelCounts: Object.fromEntries(channelCounts.entries()),
    multiChannelScore
  }
}

function computeCompleteness(sources: string[], summary: {
  transactionSummary: TransactionSummary
  listingSummary: ListingSummary
  engagementSummary: EngagementSummary
}) {
  let score = sources.length * 25
  if (summary.transactionSummary.transactionRecencyMonths !== null) {
    score += 5
  }
  if (summary.listingSummary.averageDaysOnMarket !== null) {
    score += 5
  }
  if (summary.engagementSummary.highIntentEvents30Days > 0) {
    score += 5
  }

  return Math.min(100, score)
}

function groupByProperty<T extends { propertyId: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    if (!map.has(item.propertyId)) {
      map.set(item.propertyId, [])
    }
    map.get(item.propertyId)!.push(item)
  }
  return map
}

function uniquePropertyIds(bundle: IngestionBundle): Set<string> {
  const ids = new Set<string>()
  for (const event of bundle.transactions) ids.add(event.propertyId)
  for (const event of bundle.listings) ids.add(event.propertyId)
  for (const event of bundle.engagement) ids.add(event.propertyId)
  return ids
}

export function buildSellerFeatureStoreSnapshot(options: {
  propertyIds: string[]
  bundle: IngestionBundle
  sources?: FeatureStoreSourceVersions
  now?: Date
}): SellerFeatureStoreSnapshot {
  const now = options.now ?? new Date()
  const propertyIds = new Set(options.propertyIds)
  const dataPropertyIds = uniquePropertyIds(options.bundle)
  dataPropertyIds.forEach((id) => propertyIds.add(id))

  const transactionGroups = groupByProperty(options.bundle.transactions)
  const listingGroups = groupByProperty(options.bundle.listings)
  const engagementGroups = groupByProperty(options.bundle.engagement)

  const records: SellerFeatureStoreRecord[] = []

  let propertiesWithTransactions = 0
  let propertiesWithListings = 0
  let propertiesWithEngagement = 0
  let completenessTotal = 0

  for (const propertyId of propertyIds) {
    const transactions = transactionGroups.get(propertyId) ?? []
    const listings = listingGroups.get(propertyId) ?? []
    const engagementEvents = engagementGroups.get(propertyId) ?? []

    if (transactions.length) propertiesWithTransactions += 1
    if (listings.length) propertiesWithListings += 1
    if (engagementEvents.length) propertiesWithEngagement += 1

    const transactionSummary = computeTransactionSummary(transactions, now)
    const listingSummary = computeListingSummary(listings, now)
    const engagementSummary = computeEngagementSummary(engagementEvents, now)

    const sources = [
      transactions.length ? 'transactions' : null,
      listings.length ? 'listings' : null,
      engagementEvents.length ? 'engagement' : null
    ].filter((value): value is string => Boolean(value))

    const completeness = computeCompleteness(sources, {
      transactionSummary,
      listingSummary,
      engagementSummary
    })
    completenessTotal += completeness

    records.push({
      propertyId,
      transactionSummary,
      listingSummary,
      engagementSummary,
      macroSummary: {},
      quality: {
        sources,
        completeness
      }
    })
  }

  const recordCount = records.length
  const averageCompleteness = recordCount ? completenessTotal / recordCount : 0

  const qualityMetrics = [
    {
      id: 'transactions-coverage',
      label: 'Transaction coverage',
      value: recordCount ? (propertiesWithTransactions / recordCount) * 100 : 0,
      unit: '%' as const,
      target: 85
    },
    {
      id: 'listings-coverage',
      label: 'Listing coverage',
      value: recordCount ? (propertiesWithListings / recordCount) * 100 : 0,
      unit: '%' as const,
      target: 80
    },
    {
      id: 'engagement-coverage',
      label: 'Engagement coverage',
      value: recordCount ? (propertiesWithEngagement / recordCount) * 100 : 0,
      unit: '%' as const,
      target: 70
    },
    {
      id: 'average-completeness',
      label: 'Average record completeness',
      value: Math.round(averageCompleteness * 10) / 10,
      unit: '%' as const,
      target: 75
    }
  ]

  return {
    generatedAt: now.toISOString(),
    recordCount,
    stats: {
      propertiesWithTransactions,
      propertiesWithListings,
      propertiesWithEngagement,
      averageCompleteness: Math.round(averageCompleteness * 10) / 10
    },
    sources: options.sources ?? {},
    records,
    qualityMetrics
  }
}
