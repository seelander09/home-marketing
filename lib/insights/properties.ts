import data from '@/content/mock-data/realie-properties.json'

export type PropertyOpportunity = {
  id: string
  address: string
  city: string
  state: string
  zip: string
  owner: string
  listingScore: number
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority'
  assessedValue: number
  marketValue: number
  estimatedEquity: number
  equityUpside: number
  yearsInHome: number
}

const propertiesDataset = data as PropertyOpportunity[]

export type PropertyFilter = {
  query?: string
  city?: string
  state?: string
  zip?: string
  minScore?: number
  minEquity?: number
  minYears?: number
}

export type PropertySummary = {
  total: number
  highPriority: number
  averageScore: number
  totalEquity: number
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
    minYears = 0
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
    return true
  })

  const totalEquity = items.reduce((acc, property) => acc + property.estimatedEquity, 0)
  const averageScore = items.length
    ? items.reduce((acc, property) => acc + property.listingScore, 0) / items.length
    : 0
  const highPriority = items.filter((property) => property.listingScore >= 80).length

  return {
    properties: items,
    summary: {
      total: items.length,
      highPriority,
      averageScore,
      totalEquity
    }
  }
}

export function listAllPropertyOpportunities(): PropertyOpportunity[] {
  return propertiesDataset
}
