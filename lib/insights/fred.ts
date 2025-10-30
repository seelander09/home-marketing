import fs from 'fs/promises'
import path from 'path'

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

const FRED_API_KEY = process.env.FRED_API_KEY || '1329d932aae5ca43e09bf6fc9a4a308e'
const FRED_API_BASE = 'https://api.stlouisfed.org/fred'
const CACHE_DIR = path.resolve(process.cwd(), '..', 'fred-data', 'cache')

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
  if (!FRED_API_KEY) {
    console.warn('FRED API key not provided')
    return null
  }

  try {
    const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
    const response = await fetch(url, {
      headers: {
        'User-Agent': FRED_USER_AGENT
      }
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch FRED series ${seriesId}: ${response.status}`)
      return null
    }

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
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as FREDEconomicData
    return parsed
  } catch (error) {
    console.error(`Failed to read FRED cache from ${filePath}`, error)
    return null
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
  await fs.writeFile(target, JSON.stringify(economicData, null, 2))
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








