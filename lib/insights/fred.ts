import fs from 'fs/promises'
import path from 'path'
import { FRED_CONFIG } from '@/lib/config/data-sources'
import { retryWithBackoff, fetchWithRetry } from '@/lib/data-pipeline/retry'
import { createAPIFetchError, createNetworkError } from '@/lib/data-pipeline/errors'
import { loadCacheWithMetadata, saveCacheWithMetadata } from '@/lib/data-pipeline/cache-manager'

export type FREDEconomicData = {
  // Interest rates and financial indicators
  mortgageRates: {
    rate30Year: number | null
    rate15Year: number | null
    rate5YearARM: number | null
    rate1YearARM: number | null
  }
  
  // Economic indicators
  economicIndicators: {
    gdpGrowth: number | null
    inflationRate: number | null
    unemploymentRate: number | null
    federalFundsRate: number | null
    consumerConfidenceIndex: number | null
    retailSalesGrowth: number | null
  }
  
  // Housing-specific economic data
  housingEconomic: {
    housingStarts: number | null
    buildingPermits: number | null
    newHomeSales: number | null
    existingHomeSales: number | null
    homeOwnershipRate: number | null
    mortgageDelinquencyRate: number | null
    foreclosureRate: number | null
  }
  
  // Regional economic data (if available)
  regionalData: {
    [stateCode: string]: {
      unemploymentRate: number | null
      medianIncome: number | null
      populationGrowth: number | null
      jobGrowth: number | null
    }
  }
  
  lastUpdated: string
}

// Use configuration from data-sources.ts
const CACHE_DIR = FRED_CONFIG.cacheDir

// FRED Series IDs for key economic indicators
const FRED_SERIES = {
  // Mortgage rates
  MORTGAGE30US: 'rate30Year',
  MORTGAGE15US: 'rate15Year',
  
  // Economic indicators
  GDPC1: 'gdpGrowth', // Real GDP
  CPIAUCSL: 'inflationRate', // Consumer Price Index
  UNRATE: 'unemploymentRate', // Unemployment Rate
  FEDFUNDS: 'federalFundsRate', // Federal Funds Rate
  UMCSENT: 'consumerConfidenceIndex', // Consumer Sentiment
  RRSFS: 'retailSalesGrowth', // Retail Sales
  
  // Housing indicators
  HOUST: 'housingStarts', // Housing Starts
  PERMIT: 'buildingPermits', // Building Permits
  HSN1F: 'newHomeSales', // New Home Sales
  EXHOSLUSM495S: 'existingHomeSales', // Existing Home Sales
  RHORUSQ156N: 'homeOwnershipRate', // Home Ownership Rate
  DRCCLACBS: 'mortgageDelinquencyRate', // Delinquency Rate
}

let economicDataPromise: Promise<FREDEconomicData | null> | null = null
const FRED_USER_AGENT = 'home-marketing/1.0 (+https://example.com)'

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create FRED cache directory', error)
  }
}

async function fetchFREDSeries(seriesId: string): Promise<{ date: string; value: number } | null> {
  const apiKey = FRED_CONFIG.apiKey
  if (!apiKey) {
    console.warn('FRED API key not provided')
    return null
  }

  if (!FRED_CONFIG.enabled) {
    console.warn('FRED data source is disabled')
    return null
  }

  try {
    const url = `${FRED_CONFIG.apiBase}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': FRED_USER_AGENT
      }
    }, {
      maxRetries: 3,
      initialDelayMs: 1000
    })

    const data = await response.json()
    
    if (data.observations && data.observations.length > 0) {
      const latest = data.observations[0]
      const value = Number.parseFloat(latest.value)
      return Number.isNaN(value) ? null : { date: latest.date, value }
    }
    
    return null
  } catch (error) {
    console.warn(`Error fetching FRED series ${seriesId}:`, error)
    return null
  }
}

async function fetchFREDRegionalData(): Promise<FREDEconomicData['regionalData']> {
  // Placeholder until regional series mappings are defined.
  return {}
}

async function fetchFREDData(): Promise<FREDEconomicData> {
  console.log('Fetching FRED economic data...')
  
  const seriesPromises = Object.entries(FRED_SERIES).map(async ([seriesId, fieldName]) => {
    const data = await fetchFREDSeries(seriesId)
    return { fieldName, value: data?.value || null, date: data?.date }
  })

  const seriesResults = await Promise.all(seriesPromises)
  const regionalData = await fetchFREDRegionalData()

  // Build the economic data object
  const economicData: FREDEconomicData = {
    mortgageRates: {
      rate30Year: seriesResults.find(r => r.fieldName === 'rate30Year')?.value || null,
      rate15Year: seriesResults.find(r => r.fieldName === 'rate15Year')?.value || null,
      rate5YearARM: null, // Would need additional series
      rate1YearARM: null // Would need additional series
    },
    
    economicIndicators: {
      gdpGrowth: seriesResults.find(r => r.fieldName === 'gdpGrowth')?.value || null,
      inflationRate: seriesResults.find(r => r.fieldName === 'inflationRate')?.value || null,
      unemploymentRate: seriesResults.find(r => r.fieldName === 'unemploymentRate')?.value || null,
      federalFundsRate: seriesResults.find(r => r.fieldName === 'federalFundsRate')?.value || null,
      consumerConfidenceIndex: seriesResults.find(r => r.fieldName === 'consumerConfidenceIndex')?.value || null,
      retailSalesGrowth: seriesResults.find(r => r.fieldName === 'retailSalesGrowth')?.value || null
    },
    
    housingEconomic: {
      housingStarts: seriesResults.find(r => r.fieldName === 'housingStarts')?.value || null,
      buildingPermits: seriesResults.find(r => r.fieldName === 'buildingPermits')?.value || null,
      newHomeSales: seriesResults.find(r => r.fieldName === 'newHomeSales')?.value || null,
      existingHomeSales: seriesResults.find(r => r.fieldName === 'existingHomeSales')?.value || null,
      homeOwnershipRate: seriesResults.find(r => r.fieldName === 'homeOwnershipRate')?.value || null,
      mortgageDelinquencyRate: seriesResults.find(r => r.fieldName === 'mortgageDelinquencyRate')?.value || null,
      foreclosureRate: seriesResults.find(r => r.fieldName === 'foreclosureRate')?.value || null
    },
    
    regionalData,
    
    lastUpdated: new Date().toISOString()
  }

  return economicData
}

async function loadCache(): Promise<FREDEconomicData | null> {
  const filePath = path.join(CACHE_DIR, 'national.json')
  
  // Try to load with metadata and TTL checking
  try {
    const result = await loadCacheWithMetadata<FREDEconomicData>(filePath, {
      ttlMs: FRED_CONFIG.ttlMs,
      maxStalenessMs: FRED_CONFIG.maxStalenessMs,
      version: FRED_CONFIG.version
    })
    
    if (result) {
      return result.data
    }
    
    // Cache expired or doesn't exist
    return null
  } catch (error) {
    // Fallback to legacy cache loading
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw) as FREDEconomicData
      console.warn('Loaded FRED cache without metadata (legacy format)')
      return parsed
    } catch (legacyError) {
      console.error(`Failed to read FRED cache from ${filePath}`, legacyError)
      return null
    }
  }
}

async function getCache(): Promise<FREDEconomicData | null> {
  economicDataPromise = economicDataPromise ?? loadCache()
  return economicDataPromise
}

export async function getFREDEconomicData(): Promise<FREDEconomicData | null> {
  return await getCache()
}

export async function getStateEconomicData(stateCode: string): Promise<FREDEconomicData['regionalData'][string] | null> {
  const economicData = await getCache()
  if (!economicData) return null
  
  return economicData.regionalData[stateCode.toUpperCase()] || null
}

export async function buildFREDCache(): Promise<void> {
  console.log('Building FRED economic cache...')
  await ensureCacheDir()

  const economicData = await fetchFREDData()

  const target = path.join(CACHE_DIR, 'national.json')
  await saveCacheWithMetadata(target, economicData, {
    ttlMs: FRED_CONFIG.ttlMs,
    maxStalenessMs: FRED_CONFIG.maxStalenessMs,
    version: FRED_CONFIG.version
  })
  console.log(`Wrote FRED economic data to ${target}`)

  console.log('FRED cache build complete')
}
export async function hasFREDCache(): Promise<boolean> {
  const filePath = path.join(CACHE_DIR, 'national.json')
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}








