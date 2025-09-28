import territories from '@/content/mock-data/territories.json'
import type { TerritoryLookupPayload } from '@/lib/forms/schemas'

const API_URL = process.env.TERRITORY_LOOKUP_URL

export type TerritoryMatch = {
  city: string
  state: string
  zip: string
  score: number
  medianHomeValue: number
  turnoverRate: number
}

async function fetchFromApi(payload: TerritoryLookupPayload): Promise<TerritoryMatch[]> {
  if (!API_URL) {
    return []
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Lookup failed with status ${response.status}`)
    }

    const json = (await response.json()) as unknown
    if (Array.isArray(json)) {
      return json as TerritoryMatch[]
    }
    return []
  } catch (error) {
    console.warn('Territory API lookup failed, falling back to mock data', error)
    return []
  }
}

export async function findTerritory(payload: TerritoryLookupPayload): Promise<TerritoryMatch[]> {
  const apiResults = await fetchFromApi(payload)
  if (apiResults.length) {
    return apiResults
  }

  const normalizedZip = payload.zip?.trim()
  const normalizedCity = payload.city?.toLowerCase()
  const normalizedState = payload.state?.toUpperCase()

  return (territories as TerritoryMatch[]).filter((territory) => {
    if (normalizedZip) {
      return territory.zip === normalizedZip
    }
    if (normalizedCity && normalizedState) {
      return (
        territory.city.toLowerCase() === normalizedCity && territory.state.toUpperCase() === normalizedState
      )
    }
    return false
  })
}
