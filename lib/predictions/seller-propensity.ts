import {
  PropertyOpportunity,
  PropertyFilter,
  listAllPropertyOpportunities,
  getPropertyOpportunities
} from '@/lib/insights/properties'
import { getComprehensiveMarketData, ComprehensiveMarketData } from '@/lib/insights/unified'
import {
  loadLatestModelWeights,
  projectFeaturesWithModel,
  type SellerModelWeights
} from '@/lib/models/seller-training'

export type ComponentKey =
  | 'ownerEquityReadiness'
  | 'marketHeat'
  | 'affordabilityPressure'
  | 'macroEconomicMomentum'

type WeightedMetric = {
  id: string
  weight: number
  score: number | null
}

type ComponentResult = {
  score: number
  confidence: number
  metrics: Record<string, number | null>
  missingMetrics: string[]
  drivers: string[]
  risks: string[]
}

export type SellerPropensityScore = {
  propertyId: string
  overallScore: number
  confidence: number
  components: Record<ComponentKey, ComponentResult>
  drivers: string[]
  riskFlags: string[]
  modelPrediction?: {
    probability: number
    score: number
    modelId: string
    algorithm: string
  }
  propertyDetails: {
    address: string
    owner: string
    priority: PropertyOpportunity['priority']
  }
  dataAvailability: {
    coverageScore: number
    missingMetrics: string[]
    sources: {
      redfin: boolean
      census: boolean
      hud: boolean
      economic: boolean
    }
  }
  geography: {
    state: string
    city: string
    region: string
    zip: string
    county?: string
    neighborhood?: string
    countyFips?: string
    msa?: string
    coordinates?: {
      latitude?: number
      longitude?: number
    }
  }
  propertySummary: {
    estimatedEquity: number
    equityRatio: number | null
    equityUpside: number
    yearsInHome: number
    listingScore: number
  }
  marketData: ComprehensiveMarketData | null
}

export type GeographyLevel = 'state' | 'region' | 'zip' | 'county' | 'neighborhood'

export type GeographyRankingEntry = {
  key: string
  label: string
  sampleSize: number
  averageScore: number
  medianScore: number
  averageConfidence: number
  scoreRange: {
    min: number
    max: number
  }
  topProperties: Array<{
    propertyId: string
    score: number
  }>
}

export type SellerPropensityLeaderboard = Record<GeographyLevel, GeographyRankingEntry[]>

export type SellerPropensityAnalysis = {
  generatedAt: string
  sampleSize: number
  scores: SellerPropensityScore[]
  rankings: SellerPropensityLeaderboard
  summary: {
    averageScore: number
    medianScore: number
    averageConfidence: number
    scoreRange: {
      min: number
      max: number
    }
  }
  componentWeights: Record<ComponentKey, number>
  modelMetadata?: {
    modelId: string
    algorithm: string
    trainedAt: string
    metrics?: SellerModelWeights['metrics']
  }
  inputs: {
    filters?: SellerPropensityFilters
    limit?: number
    propertyIds: string[]
  }
}

export type SellerPropensityFilters = PropertyFilter

export type SellerPropensityOptions = {
  filters?: SellerPropensityFilters
  limit?: number
}

export const SELLER_PROPENSITY_COMPONENT_WEIGHTS: Record<ComponentKey, number> = {
  ownerEquityReadiness: 0.4,
  marketHeat: 0.3,
  affordabilityPressure: 0.2,
  macroEconomicMomentum: 0.1
}

const marketDataCache = new Map<string, Promise<ComprehensiveMarketData | null>>()
let sellerModelPromise: Promise<SellerModelWeights | null> | null = null

async function getSellerModelWeights() {
  if (!sellerModelPromise) {
    sellerModelPromise = (async () => {
      try {
        return await loadLatestModelWeights()
      } catch (error) {
        console.warn('Failed to load seller propensity model weights', error)
        return null
      }
    })()
  }
  return sellerModelPromise
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function scaleScore(
  value: number | null | undefined,
  options: { min: number; max: number; invert?: boolean }
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }

  const { min, max, invert = false } = options
  if (max === min) {
    return null
  }

  const bounded = clamp(value, Math.min(min, max), Math.max(min, max))
  const ratio = (bounded - min) / (max - min)
  const normalized = invert ? 1 - ratio : ratio
  return clamp(normalized * 100, 0, 100)
}

function yearsBetween(from: Date, to: Date) {
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25
  return (from.getTime() - to.getTime()) / millisecondsPerYear
}

function combineMetrics(metrics: WeightedMetric[]): {
  score: number
  confidence: number
  missingMetrics: string[]
} {
  if (metrics.length === 0) {
    return { score: 50, confidence: 0, missingMetrics: [] }
  }

  const totalWeight = metrics.reduce((acc, metric) => acc + metric.weight, 0)
  let usedWeight = 0
  let weightedSum = 0
  const missingMetrics: string[] = []

  for (const metric of metrics) {
    if (metric.score === null) {
      missingMetrics.push(metric.id)
      continue
    }
    usedWeight += metric.weight
    weightedSum += metric.score * metric.weight
  }

  if (usedWeight === 0) {
    return { score: 50, confidence: 0, missingMetrics }
  }

  const score = clamp(weightedSum / usedWeight, 0, 100)
  const confidence = totalWeight > 0 ? (usedWeight / totalWeight) * 100 : 0

  return {
    score,
    confidence,
    missingMetrics
  }
}

function median(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

async function getMarketDataForProperty(property: PropertyOpportunity) {
  const cacheKey = (() => {
    if (property.zip) return `zip:${property.zip}`
    if (property.city && property.state) return `city:${property.state.toUpperCase()}|${property.city.toLowerCase()}`
    if (property.state) return `state:${property.state.toUpperCase()}`
    return null
  })()

  if (!cacheKey) {
    return null
  }

  if (!marketDataCache.has(cacheKey)) {
    const promise = (async () => {
      try {
        if (cacheKey.startsWith('zip:')) {
          const zip = cacheKey.split(':')[1]
          return await getComprehensiveMarketData({ zip, includeInsights: true })
        }
        if (cacheKey.startsWith('city:')) {
          const [, payload] = cacheKey.split(':')
          const [state, city] = payload.split('|')
          return await getComprehensiveMarketData({
            state,
            city,
            includeInsights: true
          })
        }
        if (cacheKey.startsWith('state:')) {
          const state = cacheKey.split(':')[1]
          return await getComprehensiveMarketData({ state, includeInsights: true })
        }
        return null
      } catch (error) {
        console.error('Failed to load market data for property', { cacheKey, error })
        return null
      }
    })()

    marketDataCache.set(cacheKey, promise)
  }

  return marketDataCache.get(cacheKey)!
}

function computeOwnerEquityReadiness(property: PropertyOpportunity): ComponentResult {
  const equityRatio =
    property.marketValue > 0 ? property.estimatedEquity / property.marketValue : null
  const upsideRatio =
    property.marketValue > 0 ? property.equityUpside / property.marketValue : null

  const yearsSinceSale =
    property.lastSaleDate !== undefined
      ? (() => {
          const saleDate = new Date(property.lastSaleDate)
          if (Number.isNaN(saleDate.getTime())) return null
          return yearsBetween(new Date(), saleDate)
        })()
      : null

  const metrics: WeightedMetric[] = [
    {
      id: 'equityRatio',
      weight: 0.35,
      score:
        equityRatio !== null ? clamp(equityRatio * 120, 0, 100) : null // boost ratios > 50%
    },
    {
      id: 'tenure',
      weight: 0.3,
      score: property.yearsInHome !== undefined ? scaleScore(property.yearsInHome, { min: 1, max: 12 }) : null
    },
    {
      id: 'listingScore',
      weight: 0.2,
      score: property.listingScore ?? null
    },
    {
      id: 'equityUpsideRatio',
      weight: 0.15,
      score: upsideRatio !== null ? clamp(upsideRatio * 140, 0, 100) : null
    }
  ]

  const combined = combineMetrics(metrics)

  if (yearsSinceSale !== null) {
    // blend last sale recency if available by nudging the score slightly
    const saleScore = scaleScore(yearsSinceSale, { min: 1, max: 10 }) ?? 50
    combined.score = clamp((combined.score * 0.9) + (saleScore * 0.1), 0, 100)
  }

  const drivers: string[] = []
  const risks: string[] = []

  if (equityRatio !== null && equityRatio >= 0.55) {
    drivers.push(`~${Math.round(equityRatio * 100)}% equity cushion`)
  } else if (equityRatio !== null && equityRatio < 0.3) {
    risks.push(`Limited equity (~${Math.round(equityRatio * 100)}%)`)
  }

  if (property.yearsInHome >= 5) {
    drivers.push(`${property.yearsInHome} years in home`)
  } else if (property.yearsInHome < 3) {
    risks.push('Short ownership tenure (<3 years)')
  }

  if (property.listingScore >= 80) {
    drivers.push(`High internal listing readiness (${property.listingScore})`)
  } else if (property.listingScore < 60) {
    risks.push(`Low listing readiness (${property.listingScore})`)
  }

  if (upsideRatio !== null && upsideRatio >= 0.2) {
    drivers.push(`Strong appreciation upside (~${Math.round(upsideRatio * 100)}%)`)
  }

  if (yearsSinceSale !== null && yearsSinceSale < 2) {
    risks.push('Recent transaction history (<24 months)')
  }

  return {
    score: combined.score,
    confidence: combined.confidence,
    metrics: {
      equityRatio,
      upsideRatio,
      yearsInHome: property.yearsInHome,
      listingScore: property.listingScore,
      yearsSinceSale
    },
    missingMetrics: combined.missingMetrics,
    drivers,
    risks
  }
}

function computeMarketHeat(marketData: ComprehensiveMarketData | null): ComponentResult {
  const redfin = marketData?.redfin
  const insights = marketData?.insights
  const hud = marketData?.hud

  const domScore = scaleScore(redfin?.medianDom ?? null, { min: 10, max: 90, invert: true })
  const monthsOfSupplyScore = scaleScore(redfin?.monthsOfSupply ?? null, {
    min: 1,
    max: 8,
    invert: true
  })
  const soldAboveListScore =
    redfin?.soldAboveList !== null && redfin?.soldAboveList !== undefined
      ? clamp(redfin.soldAboveList * 200, 0, 100)
      : null
  const priceDropScore = scaleScore(redfin?.priceDrops ?? null, {
    min: 0.05,
    max: 0.4,
    invert: true
  })
  const velocityScore =
    insights?.marketVelocity !== null && insights?.marketVelocity !== undefined
      ? clamp(insights.marketVelocity, 0, 100)
      : null
  const priceAppreciationScore = scaleScore(hud?.marketConditions.priceAppreciation ?? null, {
    min: -5,
    max: 15
  })

  const combined = combineMetrics([
    { id: 'medianDom', weight: 0.3, score: domScore },
    { id: 'monthsOfSupply', weight: 0.25, score: monthsOfSupplyScore },
    { id: 'soldAboveList', weight: 0.2, score: soldAboveListScore },
    { id: 'priceDrops', weight: 0.15, score: priceDropScore },
    { id: 'velocity', weight: 0.05, score: velocityScore },
    { id: 'priceAppreciation', weight: 0.05, score: priceAppreciationScore }
  ])

  const drivers: string[] = []
  const risks: string[] = []

  const medianDom = redfin?.medianDom ?? null
  const monthsOfSupply = redfin?.monthsOfSupply ?? null
  const soldAboveList = redfin?.soldAboveList ?? null
  const priceDrops = redfin?.priceDrops ?? null

  if (medianDom !== null && medianDom !== undefined && medianDom <= 30) {
    drivers.push(`Fast market velocity (DOM ${medianDom} days)`)
  } else if (medianDom !== null && medianDom !== undefined && medianDom > 60) {
    risks.push(`Slower market (DOM ${medianDom} days)`)
  }

  if (monthsOfSupply !== null && monthsOfSupply !== undefined && monthsOfSupply <= 3) {
    drivers.push(`Tight inventory (${monthsOfSupply} months of supply)`)
  } else if (monthsOfSupply !== null && monthsOfSupply !== undefined && monthsOfSupply > 5) {
    risks.push(`Elevated inventory (${monthsOfSupply} months of supply)`)
  }

  if (soldAboveList !== null && soldAboveList !== undefined && soldAboveList >= 0.25) {
    drivers.push(`${Math.round(soldAboveList * 100)}% of homes selling above list price`)
  }

  if (priceDrops !== null && priceDrops !== undefined && priceDrops > 0.3) {
    risks.push(`High share of price drops (${Math.round(priceDrops * 100)}%)`)
  }

  if (
    hud?.marketConditions.priceAppreciation !== null &&
    hud?.marketConditions.priceAppreciation !== undefined &&
    hud.marketConditions.priceAppreciation > 5
  ) {
    drivers.push(
      `Recent HUD price appreciation ${hud.marketConditions.priceAppreciation.toFixed(1)}%`
    )
  }

  return {
    score: combined.score,
    confidence: combined.confidence,
    metrics: {
      medianDom: redfin?.medianDom ?? null,
      monthsOfSupply: redfin?.monthsOfSupply ?? null,
      soldAboveList: redfin?.soldAboveList ?? null,
      priceDrops: redfin?.priceDrops ?? null,
      marketVelocity: insights?.marketVelocity ?? null,
      priceAppreciation: hud?.marketConditions.priceAppreciation ?? null
    },
    missingMetrics: combined.missingMetrics,
    drivers,
    risks
  }
}

function computeAffordabilityPressure(marketData: ComprehensiveMarketData | null): ComponentResult {
  const hud = marketData?.hud
  const census = marketData?.census

  const affordabilityIndex = hud?.marketConditions.affordabilityIndex ?? null
  const incomeToPriceRatio = hud?.affordability.incomeToPriceRatio ?? null
  const costBurdened = hud?.affordability.costBurdenedHouseholds ?? null

  const priceToIncome =
    census?.medianHomeValue && census?.demographics?.medianHouseholdIncome
      ? census.medianHomeValue / census.demographics.medianHouseholdIncome
      : null

  const occupancyRate = census?.occupancyRate ?? null

  const combined = combineMetrics([
    {
      id: 'affordabilityIndex',
      weight: 0.3,
      score: scaleScore(affordabilityIndex, { min: 60, max: 140, invert: true })
    },
    {
      id: 'incomeToPriceRatio',
      weight: 0.25,
      score: scaleScore(incomeToPriceRatio, { min: 2, max: 6 })
    },
    {
      id: 'costBurdened',
      weight: 0.2,
      score: scaleScore(costBurdened, { min: 5, max: 35 })
    },
    {
      id: 'priceToIncome',
      weight: 0.15,
      score: scaleScore(priceToIncome, { min: 3, max: 9 })
    },
    {
      id: 'occupancyRate',
      weight: 0.1,
      score: scaleScore(occupancyRate, { min: 85, max: 99 })
    }
  ])

  const drivers: string[] = []
  const risks: string[] = []

  if (affordabilityIndex !== null && affordabilityIndex < 100) {
    drivers.push(`Affordability pressure (index ${affordabilityIndex})`)
  } else if (affordabilityIndex !== null && affordabilityIndex > 120) {
    risks.push(`Highly affordable market (index ${affordabilityIndex})`)
  }

  if (incomeToPriceRatio !== null && incomeToPriceRatio >= 4) {
    drivers.push(`Favorable income-to-price ratio (${incomeToPriceRatio.toFixed(1)}x)`)
  }

  if (costBurdened !== null && costBurdened >= 20) {
    drivers.push(`${costBurdened.toFixed(1)}% cost-burdened households`)
  }

  if (priceToIncome !== null && priceToIncome >= 6) {
    drivers.push(`High price-to-income ratio (${priceToIncome.toFixed(1)}x)`)
  }

  if (occupancyRate !== null && occupancyRate < 90) {
    risks.push(`Lower occupancy rate (${occupancyRate.toFixed(1)}%)`)
  }

  return {
    score: combined.score,
    confidence: combined.confidence,
    metrics: {
      affordabilityIndex,
      incomeToPriceRatio,
      costBurdenedHouseholds: costBurdened,
      priceToIncome,
      occupancyRate
    },
    missingMetrics: combined.missingMetrics,
    drivers,
    risks
  }
}

function computeMacroEconomicMomentum(marketData: ComprehensiveMarketData | null): ComponentResult {
  const economic = marketData?.economic

  const mortgageRate = economic?.mortgageRates.rate30Year ?? null
  const unemploymentRate = economic?.economicIndicators.unemploymentRate ?? null
  const gdpGrowth = economic?.economicIndicators.gdpGrowth ?? null
  const consumerConfidence = economic?.economicIndicators.consumerConfidenceIndex ?? null
  const homeOwnershipRate = economic?.housingEconomic.homeOwnershipRate ?? null

  const combined = combineMetrics([
    { id: 'mortgageRate', weight: 0.35, score: scaleScore(mortgageRate, { min: 3, max: 8, invert: true }) },
    {
      id: 'unemployment',
      weight: 0.3,
      score: scaleScore(unemploymentRate, { min: 3, max: 10, invert: true })
    },
    { id: 'gdpGrowth', weight: 0.15, score: scaleScore(gdpGrowth, { min: -2, max: 6 }) },
    {
      id: 'consumerConfidence',
      weight: 0.1,
      score: scaleScore(consumerConfidence, { min: 60, max: 120 })
    },
    {
      id: 'homeOwnershipRate',
      weight: 0.1,
      score: scaleScore(homeOwnershipRate, { min: 60, max: 70 })
    }
  ])

  const drivers: string[] = []
  const risks: string[] = []

  if (mortgageRate !== null && mortgageRate <= 4.75) {
    drivers.push(`Favorable mortgage environment (${mortgageRate.toFixed(2)}%)`)
  } else if (mortgageRate !== null && mortgageRate >= 6.5) {
    risks.push(`High mortgage rates (${mortgageRate.toFixed(2)}%)`)
  }

  if (unemploymentRate !== null && unemploymentRate <= 4.5) {
    drivers.push(`Healthy employment (${unemploymentRate.toFixed(1)}%)`)
  } else if (unemploymentRate !== null && unemploymentRate >= 6.5) {
    risks.push(`Elevated unemployment (${unemploymentRate.toFixed(1)}%)`)
  }

  if (gdpGrowth !== null && gdpGrowth < 0) {
    risks.push(`Negative GDP growth (${gdpGrowth.toFixed(1)}%)`)
  }

  return {
    score: combined.score,
    confidence: combined.confidence,
    metrics: {
      mortgageRate,
      unemploymentRate,
      gdpGrowth,
      consumerConfidence,
      homeOwnershipRate
    },
    missingMetrics: combined.missingMetrics,
    drivers,
    risks
  }
}

function aggregateComponentResults(components: Record<ComponentKey, ComponentResult>) {
  const totals = {
    weightedScore: 0,
    weightedConfidence: 0,
    maxWeight: 0
  }

  for (const key of Object.keys(SELLER_PROPENSITY_COMPONENT_WEIGHTS) as ComponentKey[]) {
    const weight = SELLER_PROPENSITY_COMPONENT_WEIGHTS[key]
    const component = components[key]
    totals.maxWeight += weight
    totals.weightedScore += component.score * weight * (component.confidence / 100)
    totals.weightedConfidence += weight * (component.confidence / 100)
  }

  const overallScore =
    totals.weightedConfidence > 0
      ? clamp(totals.weightedScore / totals.weightedConfidence, 0, 100)
      : 50

  const confidence =
    totals.maxWeight > 0 ? clamp((totals.weightedConfidence / totals.maxWeight) * 100, 0, 100) : 0

  return { overallScore, confidence }
}

export async function scorePropertyOpportunity(
  property: PropertyOpportunity,
  modelWeights?: SellerModelWeights | null
): Promise<SellerPropensityScore> {
  const marketData = await getMarketDataForProperty(property)

  const components: Record<ComponentKey, ComponentResult> = {
    ownerEquityReadiness: computeOwnerEquityReadiness(property),
    marketHeat: computeMarketHeat(marketData),
    affordabilityPressure: computeAffordabilityPressure(marketData),
    macroEconomicMomentum: computeMacroEconomicMomentum(marketData)
  }

  const heuristicAggregation = aggregateComponentResults(components)
  let blendedScore = heuristicAggregation.overallScore
  let blendedConfidence = heuristicAggregation.confidence
  let modelPrediction: SellerPropensityScore['modelPrediction']

  const activeModel = modelWeights ?? (await getSellerModelWeights())
  if (activeModel) {
    const projection = projectFeaturesWithModel(property, activeModel)
    if (projection) {
      const modelScore = projection.probability * 100
      blendedScore = clamp(blendedScore * 0.6 + modelScore * 0.4, 0, 100)
      blendedConfidence = clamp((blendedConfidence * 0.6) + 40, 0, 100)
      modelPrediction = {
        probability: Math.round(projection.probability * 1000) / 10,
        score: Math.round(modelScore),
        modelId: projection.modelId,
        algorithm: projection.algorithm
      }
    }
  }

  const drivers = [
    ...components.ownerEquityReadiness.drivers,
    ...components.marketHeat.drivers,
    ...components.affordabilityPressure.drivers,
    ...components.macroEconomicMomentum.drivers
  ]

  const riskFlags = [
    ...components.ownerEquityReadiness.risks,
    ...components.marketHeat.risks,
    ...components.affordabilityPressure.risks,
    ...components.macroEconomicMomentum.risks
  ]

  const missingMetrics = Array.from(
    new Set(
      [
        ...components.ownerEquityReadiness.missingMetrics,
        ...components.marketHeat.missingMetrics,
        ...components.affordabilityPressure.missingMetrics,
        ...components.macroEconomicMomentum.missingMetrics
      ].filter(Boolean)
    )
  )

  const fallbackRegion =
    marketData?.redfin?.regionType === 'city' && marketData.redfin?.regionName
      ? `${marketData.redfin.regionName}, ${marketData.redfin.stateCode ?? ''}`.trim()
      : `${property.city}, ${property.state}`.trim()

  const geographyRegion = property.msa ?? fallbackRegion

  return {
    propertyId: property.id,
    overallScore: Math.round(blendedScore),
    confidence: Math.round(blendedConfidence),
    components,
    drivers,
    riskFlags,
    modelPrediction,
    propertyDetails: {
      address: property.address,
      owner: property.owner,
      priority: property.priority
    },
    dataAvailability: {
      coverageScore: Math.round(blendedConfidence),
      missingMetrics,
      sources: {
        redfin: Boolean(marketData?.redfin),
        census: Boolean(marketData?.census),
        hud: Boolean(marketData?.hud),
        economic: Boolean(marketData?.economic)
      }
    },
    geography: {
      state: property.state,
      city: property.city,
      region: geographyRegion,
      zip: property.zip,
      county: property.county,
      neighborhood: property.neighborhood,
      countyFips: property.countyFips,
      msa: property.msa,
      coordinates:
        property.latitude || property.longitude
          ? {
              latitude: property.latitude,
              longitude: property.longitude
            }
          : undefined
    },
    propertySummary: {
      estimatedEquity: property.estimatedEquity,
      equityRatio:
        property.marketValue > 0 ? property.estimatedEquity / property.marketValue : null,
      equityUpside: property.equityUpside,
      yearsInHome: property.yearsInHome,
      listingScore: property.listingScore
    },
    marketData: marketData ?? null
  }
}

function buildRankingForLevel(
  scores: SellerPropensityScore[],
  level: GeographyLevel
): GeographyRankingEntry[] {
  const groups = new Map<string, SellerPropensityScore[]>()

  for (const score of scores) {
    const key = score.geography[level]
    if (!key) continue
    const trimmed = key.trim()
    if (!trimmed) continue
    if (!groups.has(trimmed)) {
      groups.set(trimmed, [])
    }
    groups.get(trimmed)!.push(score)
  }

  const entries: GeographyRankingEntry[] = []

  for (const [key, group] of groups.entries()) {
    const averageScore =
      group.reduce((acc, item) => acc + item.overallScore, 0) / group.length
    const medianScore = median(group.map((item) => item.overallScore))
    const scoreValues = group.map((item) => item.overallScore)
    const minScore = Math.min(...scoreValues)
    const maxScore = Math.max(...scoreValues)
    const averageConfidence =
      group.reduce((acc, item) => acc + item.confidence, 0) / group.length

    const topProperties = group
      .slice()
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5)
      .map((item) => ({
        propertyId: item.propertyId,
        score: item.overallScore
      }))

    const label =
      level === 'region' && !key.includes(',')
        ? `${key}, ${group[0]?.geography.state ?? ''}`.trim()
        : key

    entries.push({
      key,
      label,
      sampleSize: group.length,
      averageScore: Math.round(averageScore * 10) / 10,
      medianScore: Math.round(medianScore * 10) / 10,
      averageConfidence: Math.round(averageConfidence),
      scoreRange: {
        min: Math.round(minScore),
        max: Math.round(maxScore)
      },
      topProperties
    })
  }

  return entries.sort((a, b) => b.averageScore - a.averageScore)
}

export function buildGeographyRankings(
  scores: SellerPropensityScore[]
): SellerPropensityLeaderboard {
  return {
    state: buildRankingForLevel(scores, 'state'),
    region: buildRankingForLevel(scores, 'region'),
    zip: buildRankingForLevel(scores, 'zip'),
    county: buildRankingForLevel(scores, 'county'),
    neighborhood: buildRankingForLevel(scores, 'neighborhood')
  }
}

function buildAnalysisSummary(scores: SellerPropensityScore[]): SellerPropensityAnalysis['summary'] {
  if (scores.length === 0) {
    return {
      averageScore: 0,
      medianScore: 0,
      averageConfidence: 0,
      scoreRange: {
        min: 0,
        max: 0
      }
    }
  }

  const scoreValues = scores.map((item) => item.overallScore)
  const confidenceValues = scores.map((item) => item.confidence)

  const averageScore = scoreValues.reduce((acc, value) => acc + value, 0) / scoreValues.length
  const averageConfidence =
    confidenceValues.reduce((acc, value) => acc + value, 0) / confidenceValues.length

  return {
    averageScore: Math.round(averageScore * 10) / 10,
    medianScore: Math.round(median(scoreValues) * 10) / 10,
    averageConfidence: Math.round(averageConfidence * 10) / 10,
    scoreRange: {
      min: Math.min(...scoreValues),
      max: Math.max(...scoreValues)
    }
  }
}

export async function scoreAndRankProperties(
  properties: PropertyOpportunity[],
  options: SellerPropensityOptions = {}
): Promise<SellerPropensityAnalysis> {
  const modelWeights = await getSellerModelWeights()
  const scored = await Promise.all(
    properties.map((property) => scorePropertyOpportunity(property, modelWeights))
  )
  const sortedByScore = scored.slice().sort((a, b) => b.overallScore - a.overallScore)

  const limit = options.limit
  const selectedScores =
    typeof limit === 'number' && limit > 0 ? sortedByScore.slice(0, limit) : sortedByScore

  const rankings = buildGeographyRankings(selectedScores)
  const summary = buildAnalysisSummary(selectedScores)
  const propertyIds = selectedScores.map((item) => item.propertyId)

  return {
    generatedAt: new Date().toISOString(),
    sampleSize: selectedScores.length,
    scores: selectedScores,
    rankings,
    summary,
    componentWeights: { ...SELLER_PROPENSITY_COMPONENT_WEIGHTS },
    modelMetadata: modelWeights
      ? {
          modelId: modelWeights.id,
          algorithm: modelWeights.algorithm,
          trainedAt: modelWeights.trainedAt,
          metrics: modelWeights.metrics
        }
      : undefined,
    inputs: {
      filters: options.filters,
      limit,
      propertyIds
    }
  }
}

export async function scoreAllCachedPropertyOpportunities(
  options: SellerPropensityOptions = {}
) {
  const properties = options.filters
    ? getPropertyOpportunities(options.filters).properties
    : listAllPropertyOpportunities()

  return scoreAndRankProperties(properties, options)
}
