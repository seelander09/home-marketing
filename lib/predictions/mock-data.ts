import { SELLER_PROPENSITY_COMPONENT_WEIGHTS, type SellerPropensityAnalysis, type SellerPropensityScore } from '@/lib/predictions/seller-propensity'

type MockProperty = {
  propertyId: string
  address: string
  owner: string
  priority: SellerPropensityScore['propertyDetails']['priority']
  city: string
  state: string
  zip: string
  county?: string
  neighborhood?: string
  msa?: string
  overallScore: number
  confidence?: number
  listingScore?: number
  estimatedEquity?: number
  equityUpside?: number
  yearsInHome?: number
  latitude?: number
  longitude?: number
}

type MockOptions = {
  filters?: Record<string, unknown> | null
  limit?: number | null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildComponentScore(base: number, delta: number) {
  const score = clamp(base + delta, 0, 100)
  return {
    score,
    confidence: 95,
    metrics: {},
    missingMetrics: [] as string[],
    drivers: delta >= 0 ? ['Favorable leading indicator'] : [],
    risks: delta < 0 ? ['Monitor trailing indicator'] : []
  }
}

function buildRankings(properties: MockProperty[], level: 'state' | 'region' | 'zip' | 'county' | 'neighborhood') {
  const groups = new Map<string, { property: MockProperty; score: number; confidence: number }[]>()

  for (const property of properties) {
    let key = ''

    switch (level) {
      case 'state':
        key = property.state
        break
      case 'region':
        key = `${property.city}, ${property.state}`
        break
      case 'zip':
        key = property.zip
        break
      case 'county':
        key = property.county ?? `${property.city} County`
        break
      case 'neighborhood':
        key = property.neighborhood ?? `${property.city} Neighborhood`
        break
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push({ property, score: property.overallScore, confidence: property.confidence ?? 95 })
  }

  return Array.from(groups.entries())
    .map(([key, entries]) => {
      const scores = entries.map((entry) => entry.score)
      const confidences = entries.map((entry) => entry.confidence)
      const averageScore = scores.reduce((acc, value) => acc + value, 0) / scores.length
      const sortedScores = [...scores].sort((a, b) => a - b)
      const medianScore =
        sortedScores.length % 2 === 0
          ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
          : sortedScores[Math.floor(sortedScores.length / 2)]

      const topProperties = entries
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((entry) => ({
          propertyId: entry.property.propertyId,
          score: Math.round(entry.score)
        }))

      return {
        key,
        label: key,
        sampleSize: entries.length,
        averageScore: Number(averageScore.toFixed(1)),
        medianScore: Number(medianScore.toFixed(1)),
        averageConfidence: Math.round(
          confidences.reduce((acc, value) => acc + value, 0) / confidences.length
        ),
        scoreRange: {
          min: Math.round(Math.min(...scores)),
          max: Math.round(Math.max(...scores))
        },
        topProperties
      }
    })
    .sort((a, b) => b.averageScore - a.averageScore)
}

function buildScore(property: MockProperty): SellerPropensityScore {
  const base = property.overallScore
  const confidence = property.confidence ?? 95
  const components: SellerPropensityScore['components'] = {
    ownerEquityReadiness: buildComponentScore(base, 5),
    marketHeat: buildComponentScore(base, -2),
    affordabilityPressure: buildComponentScore(base, -4),
    macroEconomicMomentum: buildComponentScore(base, 3)
  } as unknown as SellerPropensityScore['components']

  return {
    propertyId: property.propertyId,
    overallScore: Math.round(base),
    confidence: Math.round(confidence),
    components,
    drivers: ['High equity position', 'Strong buyer demand'],
    riskFlags: ['Monitor price reductions'],
    propertyDetails: {
      address: property.address,
      owner: property.owner,
      priority: property.priority
    },
    dataAvailability: {
      coverageScore: 95,
      missingMetrics: [],
      sources: {
        redfin: true,
        census: true,
        hud: true,
        economic: true
      }
    },
    geography: {
      state: property.state,
      city: property.city,
      region: `${property.city}, ${property.state}`,
      zip: property.zip,
      county: property.county ?? `${property.city} County`,
      neighborhood: property.neighborhood ?? `${property.city} Neighborhood`,
      countyFips: undefined,
      msa: property.msa ?? `${property.city} Metro`,
      coordinates:
        property.latitude !== undefined || property.longitude !== undefined
          ? {
              latitude: property.latitude,
              longitude: property.longitude
            }
          : undefined
    },
    propertySummary: {
      estimatedEquity: property.estimatedEquity ?? 320000,
      equityRatio: 0.56,
      equityUpside: property.equityUpside ?? 180000,
      yearsInHome: property.yearsInHome ?? 6,
      listingScore: property.listingScore ?? 85
    },
    marketData: null
  }
}

export function createSellerAnalysisMock(
  properties: MockProperty[],
  options: MockOptions = {}
): { analysis: SellerPropensityAnalysis; metadata: Record<string, unknown> } {
  const scores = properties.map((property) => buildScore(property))
  const averageScore = scores.reduce((acc, score) => acc + score.overallScore, 0) / scores.length
  const sortedScores = scores.map((score) => score.overallScore).sort((a, b) => a - b)
  const medianScore =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)]

  const summary = {
    averageScore: Number(averageScore.toFixed(1)),
    medianScore: Number(medianScore.toFixed(1)),
    averageConfidence:
      scores.reduce((acc, score) => acc + score.confidence, 0) / scores.length,
    scoreRange: {
      min: Math.min(...scores.map((score) => score.overallScore)),
      max: Math.max(...scores.map((score) => score.overallScore))
    }
  }

  const rankings = {
    state: buildRankings(properties, 'state'),
    region: buildRankings(properties, 'region'),
    zip: buildRankings(properties, 'zip'),
    county: buildRankings(properties, 'county'),
    neighborhood: buildRankings(properties, 'neighborhood')
  }

  const generatedAt = new Date().toISOString()

  const analysis: SellerPropensityAnalysis = {
    generatedAt,
    sampleSize: scores.length,
    scores,
    rankings,
    summary: {
      averageScore: summary.averageScore,
      medianScore: Number(summary.medianScore.toFixed(1)),
      averageConfidence: Number(summary.averageConfidence.toFixed(1)),
      scoreRange: {
        min: summary.scoreRange.min,
        max: summary.scoreRange.max
      }
    },
    componentWeights: { ...SELLER_PROPENSITY_COMPONENT_WEIGHTS },
    inputs: {
      filters: options.filters ?? null,
      limit: options.limit ?? null,
      propertyIds: scores.map((score) => score.propertyId)
    }
  }

  return {
    analysis,
    metadata: {
      filters: options.filters ?? null,
      limit: options.limit ?? null,
      persisted: false,
      generatedAt,
      componentWeights: analysis.componentWeights
    }
  }
}

export function createSellerAnalysisResponse(
  properties: MockProperty[],
  options: MockOptions = {}
) {
  return createSellerAnalysisMock(properties, options)
}

export const DEFAULT_SELLER_ANALYSIS_MOCK = createSellerAnalysisResponse(
  [
    {
      propertyId: 'austin-elm-001',
      address: '789 Elm Drive',
      owner: 'Michael Brown',
      priority: 'High Priority',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      county: 'Travis County',
      neighborhood: 'Downtown Austin',
      msa: 'Austin Metro',
      overallScore: 87,
      latitude: 30.2672,
      longitude: -97.7431,
      yearsInHome: 6,
      estimatedEquity: 331650,
      equityUpside: 325839
    },
    {
      propertyId: 'denver-birch-003',
      address: '987 Birch Boulevard',
      owner: 'Jennifer Garcia',
      priority: 'Medium Priority',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      county: 'Denver County',
      neighborhood: 'LoDo',
      msa: 'Denver Metro',
      overallScore: 78,
      latitude: 39.7527,
      longitude: -104.9998,
      yearsInHome: 8,
      estimatedEquity: 451505,
      equityUpside: 182910
    },
    {
      propertyId: 'chicago-maple-004',
      address: '45 Maple Avenue',
      owner: 'Priya Patel',
      priority: 'Medium Priority',
      city: 'Chicago',
      state: 'IL',
      zip: '60611',
      county: 'Cook County',
      neighborhood: 'Streeterville',
      msa: 'Chicago Metro',
      overallScore: 74,
      latitude: 41.8936,
      longitude: -87.6244,
      yearsInHome: 10,
      estimatedEquity: 372900,
      equityUpside: 190115
    }
  ],
  { filters: { state: 'TX', minScore: 70 }, limit: 25 }
)
