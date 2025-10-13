import fs from 'fs/promises'
import path from 'path'

export type HUDMarketData = {
  regionType: 'state' | 'county' | 'metro'
  regionCode: string
  regionName: string
  state: string
  stateCode: string
  
  // Housing Price Index data
  housingPriceIndex: {
    current: number | null
    yearOverYearChange: number | null
    quarterlyChange: number | null
    historicalData: Array<{
      period: string
      index: number
    }>
  }
  
  // Market conditions
  marketConditions: {
    affordabilityIndex: number | null
    inventoryLevel: 'low' | 'moderate' | 'high' | null
    marketVelocity: number | null
    priceAppreciation: number | null
  }
  
  // Economic indicators
  economicIndicators: {
    medianIncome: number | null
    unemploymentRate: number | null
    populationGrowth: number | null
    jobGrowth: number | null
  }
  
  // Affordability metrics
  affordability: {
    medianHomePrice: number | null
    medianRent: number | null
    incomeToPriceRatio: number | null
    rentToIncomeRatio: number | null
    affordableHousingUnits: number | null
    costBurdenedHouseholds: number | null
  }
  
  lastUpdated: string
}

const HUD_API_KEY = process.env.HUD_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI2IiwianRpIjoiNWJiZGM0MDNjNzg2NjNkZjhhNzVlMGVjNDcxYjg1NzNhZjEyM2I2YTEyNjE0Nzk2NTFjNGRhYTg4OWY4NGIzNmEwNzM4ZjNjOWYwN2M1NWUiLCJpYXQiOjE3NjAzODU5NjIuMzgxMzAzLCJuYmYiOjE3NjAzODU5NjIuMzgxMzA4LCJleHAiOjIwNzU5MTg3NjIuMzc1MjIyLCJzdWIiOiIxMTExNTciLCJzY29wZXMiOltdfQ.UigsbK-IQmvA3_0tK9OHlWaylspqCQfvuCvPQ4cJAoL1i6xbMk2z4nhfXAr7GAfZhOeueneMfCXs9C0GSMtQhw'
const HUD_API_BASE = 'https://www.huduser.gov/portal/api'
const CACHE_DIR = path.resolve(process.cwd(), '..', 'hud-data', 'cache')

type CacheKind = 'state' | 'county' | 'metro'
type HUDCache = Record<string, HUDMarketData>

let stateCachePromise: Promise<HUDCache> | null = null
let countyCachePromise: Promise<HUDCache> | null = null
let metroCachePromise: Promise<HUDCache> | null = null

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create HUD cache directory', error)
  }
}

function parseNumber(value: string | number | undefined): number | null {
  if (value === null || value === undefined || value === '' || value === 'N/A') {
    return null
  }
  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? null : parsed
}

function determineInventoryLevel(inventory: number | null): 'low' | 'moderate' | 'high' | null {
  if (inventory === null) return null
  if (inventory < 3) return 'low'
  if (inventory < 6) return 'moderate'
  return 'high'
}

async function fetchHUDData(regionType: CacheKind): Promise<HUDCache> {
  if (!HUD_API_KEY) {
    console.warn('HUD API key not provided, returning empty cache')
    return {}
  }

  // Note: HUD API endpoints vary significantly. This is a template structure.
  // You'll need to adjust based on actual HUD API documentation.
  let endpoint: string
  
  switch (regionType) {
    case 'state':
      endpoint = `${HUD_API_BASE}/states`
      break
    case 'county':
      endpoint = `${HUD_API_BASE}/counties`
      break
    case 'metro':
      endpoint = `${HUD_API_BASE}/metros`
      break
    default:
      throw new Error(`Unsupported region type: ${regionType}`)
  }

  try {
    console.log(`Fetching HUD ${regionType} data...`)
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${HUD_API_KEY}`,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HUD API responded with ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    const cache: HUDCache = {}
    
    // Process the response based on actual HUD API structure
    // This is a template - adjust based on real API response
    if (Array.isArray(data)) {
      for (const item of data) {
        const snapshot = buildHUDSnapshot(item, regionType)
        const key = getCacheKey(regionType, item)
        
        if (key) {
          cache[key] = snapshot
        }
      }
    }
    
    console.log(`Fetched ${Object.keys(cache).length} ${regionType} records from HUD API`)
    return cache
    
  } catch (error) {
    console.error(`Failed to fetch HUD ${regionType} data:`, error)
    return {}
  }
}

function buildHUDSnapshot(item: any, regionType: CacheKind): HUDMarketData {
  // Template structure - adjust based on actual HUD API response
  return {
    regionType,
    regionCode: item.code || item.fips || '',
    regionName: item.name || item.region_name || '',
    state: item.state || '',
    stateCode: item.state_code || '',
    
    housingPriceIndex: {
      current: parseNumber(item.hpi_current),
      yearOverYearChange: parseNumber(item.hpi_yoy_change),
      quarterlyChange: parseNumber(item.hpi_quarterly_change),
      historicalData: item.hpi_history || []
    },
    
    marketConditions: {
      affordabilityIndex: parseNumber(item.affordability_index),
      inventoryLevel: determineInventoryLevel(parseNumber(item.inventory_level)),
      marketVelocity: parseNumber(item.market_velocity),
      priceAppreciation: parseNumber(item.price_appreciation)
    },
    
    economicIndicators: {
      medianIncome: parseNumber(item.median_income),
      unemploymentRate: parseNumber(item.unemployment_rate),
      populationGrowth: parseNumber(item.population_growth),
      jobGrowth: parseNumber(item.job_growth)
    },
    
    affordability: {
      medianHomePrice: parseNumber(item.median_home_price),
      medianRent: parseNumber(item.median_rent),
      incomeToPriceRatio: parseNumber(item.income_to_price_ratio),
      rentToIncomeRatio: parseNumber(item.rent_to_income_ratio),
      affordableHousingUnits: parseNumber(item.affordable_housing_units),
      costBurdenedHouseholds: parseNumber(item.cost_burdened_households)
    },
    
    lastUpdated: new Date().toISOString()
  }
}

function getCacheKey(regionType: CacheKind, item: any): string | null {
  switch (regionType) {
    case 'state':
      return item.state_code?.toUpperCase() || null
    case 'county':
      return `${item.state_code?.toUpperCase()}|${item.fips_code || item.county_code}`
    case 'metro':
      return item.metro_code || item.cbsa_code || null
    default:
      return null
  }
}

async function loadCache(kind: CacheKind): Promise<HUDCache> {
  const filePath = path.join(CACHE_DIR, `${kind}.json`)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as HUDCache
    return parsed
  } catch (error) {
    console.error(`Failed to read HUD ${kind} cache from ${filePath}`, error)
    return {}
  }
}

async function getCache(kind: CacheKind): Promise<HUDCache> {
  switch (kind) {
    case 'state':
      stateCachePromise = stateCachePromise ?? loadCache('state')
      return stateCachePromise
    case 'county':
      countyCachePromise = countyCachePromise ?? loadCache('county')
      return countyCachePromise
    case 'metro':
      metroCachePromise = metroCachePromise ?? loadCache('metro')
      return metroCachePromise
  }
}

export async function getStateHUDData(stateCode: string): Promise<HUDMarketData | null> {
  if (!stateCode) return null
  const cache = await getCache('state')
  return cache[stateCode.toUpperCase()] ?? null
}

export async function getCountyHUDData(stateCode: string, countyCode: string): Promise<HUDMarketData | null> {
  if (!stateCode || !countyCode) return null
  const cache = await getCache('county')
  return cache[`${stateCode.toUpperCase()}|${countyCode}`] ?? null
}

export async function getMetroHUDData(metroCode: string): Promise<HUDMarketData | null> {
  if (!metroCode) return null
  const cache = await getCache('metro')
  return cache[metroCode] ?? null
}

export async function buildHUDCache(): Promise<void> {
  console.log('🏗  Building HUD market cache...')
  await ensureCacheDir()

  const [stateData, countyData, metroData] = await Promise.all([
    fetchHUDData('state'),
    fetchHUDData('county'),
    fetchHUDData('metro')
  ])

  const outputs = [
    ['state.json', stateData],
    ['county.json', countyData],
    ['metro.json', metroData]
  ]

  await Promise.all(
    outputs.map(async ([filename, payload]) => {
      const target = path.join(CACHE_DIR, filename)
      await fs.writeFile(target, JSON.stringify(payload, null, 2))
      console.log(`💾 Wrote ${Object.keys(payload).length.toLocaleString()} records to ${target}`)
    })
  )

  console.log('✅ HUD cache build complete')
}

export async function hasHUDCache(kind: CacheKind): Promise<boolean> {
  const filePath = path.join(CACHE_DIR, `${kind}.json`)
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
