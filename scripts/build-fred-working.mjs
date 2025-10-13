import fs from 'fs/promises'
import path from 'path'

const FRED_API_KEY = '1329d932aae5ca43e09bf6fc9a4a308e'
const FRED_API_BASE = 'https://api.stlouisfed.org/fred'

// Key FRED series for economic data
const FRED_SERIES = {
  MORTGAGE30US: 'rate30Year',
  MORTGAGE15US: 'rate15Year',
  UNRATE: 'unemploymentRate',
  FEDFUNDS: 'federalFundsRate',
  GDPC1: 'gdpGrowth',
  CPIAUCSL: 'inflationRate'
}

async function fetchFREDSeries(seriesId) {
  try {
    const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
    const response = await fetch(url)
    
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
    console.warn(`Error fetching FRED series ${seriesId}:`, error.message)
    return null
  }
}

async function fetchFREDData() {
  console.log('📊 Fetching FRED economic data...')
  
  const economicData = {
    mortgageRates: {
      rate30Year: null,
      rate15Year: null,
      rate5YearARM: null,
      rate1YearARM: null
    },
    economicIndicators: {
      gdpGrowth: null,
      inflationRate: null,
      unemploymentRate: null,
      federalFundsRate: null,
      consumerConfidenceIndex: null,
      retailSalesGrowth: null
    },
    housingEconomic: {
      housingStarts: null,
      buildingPermits: null,
      newHomeSales: null,
      existingHomeSales: null,
      homeOwnershipRate: null,
      mortgageDelinquencyRate: null,
      foreclosureRate: null
    },
    regionalData: {},
    lastUpdated: new Date().toISOString()
  }

  // Fetch key economic indicators
  const seriesPromises = Object.entries(FRED_SERIES).map(async ([seriesId, fieldName]) => {
    const data = await fetchFREDSeries(seriesId)
    return { fieldName, value: data?.value || null, date: data?.date }
  })

  const seriesResults = await Promise.all(seriesPromises)
  
  // Map results to economic data structure
  for (const result of seriesResults) {
    switch (result.fieldName) {
      case 'rate30Year':
        economicData.mortgageRates.rate30Year = result.value
        break
      case 'rate15Year':
        economicData.mortgageRates.rate15Year = result.value
        break
      case 'unemploymentRate':
        economicData.economicIndicators.unemploymentRate = result.value
        break
      case 'federalFundsRate':
        economicData.economicIndicators.federalFundsRate = result.value
        break
      case 'gdpGrowth':
        economicData.economicIndicators.gdpGrowth = result.value
        break
      case 'inflationRate':
        economicData.economicIndicators.inflationRate = result.value
        break
    }
  }

  console.log(`✅ Fetched ${seriesResults.filter(r => r.value !== null).length} economic indicators from FRED API`)
  return economicData
}

async function main() {
  console.log('🏗  Building FRED economic cache...')
  
  try {
    // Ensure cache directory exists
    const cacheDir = path.resolve(process.cwd(), '..', 'fred-data', 'cache')
    await fs.mkdir(cacheDir, { recursive: true })
    
    // Fetch FRED data
    const economicData = await fetchFREDData()
    
    // Save to cache file
    const target = path.join(cacheDir, 'economic.json')
    await fs.writeFile(target, JSON.stringify(economicData, null, 2))
    console.log(`💾 Wrote FRED economic data to ${target}`)
    
    // Show sample data
    console.log(`\n📊 Sample economic data:`)
    console.log(JSON.stringify(economicData, null, 2))
    
    console.log('✅ FRED cache build complete')
    
  } catch (error) {
    console.error('❌ FRED cache build failed:', error)
    process.exitCode = 1
  }
}

main()
