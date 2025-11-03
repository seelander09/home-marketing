import fs from 'fs/promises'
import path from 'path'
import { CENSUS_CONFIG, CENSUS_ACS_YEAR } from '@/lib/config/data-sources'
import { retryWithBackoff, fetchWithRetry } from '@/lib/data-pipeline/retry'
import { createAPIFetchError, createNetworkError } from '@/lib/data-pipeline/errors'
import { loadCacheWithMetadata, saveCacheWithMetadata, getCacheStatus } from '@/lib/data-pipeline/cache-manager'

export type CensusDemographics = {
  totalPopulation: number | null
  medianAge: number | null
  medianHouseholdIncome: number | null
  povertyRate: number | null
  educationLevel: {
    highSchoolOrLess: number | null
    someCollege: number | null
    bachelorsOrHigher: number | null
  }
  employmentRate: number | null
  unemploymentRate: number | null
}

export type CensusHousingData = {
  geoid: string
  regionType: 'state' | 'county' | 'place' | 'zip'
  regionName: string
  state: string
  stateCode: string
  totalHousingUnits: number | null
  occupiedHousingUnits: number | null
  ownerOccupiedUnits: number | null
  renterOccupiedUnits: number | null
  medianHomeValue: number | null
  medianRent: number | null
  medianGrossRent: number | null
  occupancyRate: number | null
  ownerOccupiedRate: number | null
  renterOccupiedRate: number | null
  housingUnitsBuilt: {
    before1980: number | null
    between1980and1999: number | null
    between2000and2009: number | null
    between2010and2019: number | null
    after2020: number | null
  }
  medianYearBuilt: number | null
  lastUpdated: string
  demographics?: CensusDemographics
}

// Use configuration from data-sources.ts
const CACHE_DIR = CENSUS_CONFIG.cacheDir

// ACS 5-Year Estimates Variables
const ACS_VARIABLES: Record<string, string> = {
  // Housing variables
  B25001_001E: 'totalHousingUnits',
  B25003_001E: 'totalOccupiedUnits',
  B25003_002E: 'ownerOccupiedUnits', 
  B25003_003E: 'renterOccupiedUnits',
  B25077_001E: 'medianHomeValue',
  B25064_001E: 'medianRent',
  B25063_001E: 'medianGrossRent',
  B25034_001E: 'totalUnitsByYearBuilt',
  B25034_002E: 'unitsBuilt2020OrLater',
  B25034_003E: 'unitsBuilt2010to2019',
  B25034_004E: 'unitsBuilt2000to2009',
  B25034_005E: 'unitsBuilt1990to1999',
  B25034_006E: 'unitsBuilt1980to1989',
  B25034_007E: 'unitsBuilt1970to1979',
  B25034_008E: 'unitsBuilt1960to1969',
  B25034_009E: 'unitsBuilt1950to1959',
  B25034_010E: 'unitsBuilt1940to1949',
  B25034_011E: 'unitsBuiltBefore1940',
  B25035_001E: 'medianYearBuilt',
  
  // Demographic variables
  B01003_001E: 'totalPopulation',
  B01002_001E: 'medianAge',
  B19013_001E: 'medianHouseholdIncome',
  B17001_002E: 'povertyCount',
  B17001_001E: 'povertyTotal',
  B15003_022E: 'bachelorsDegree',
  B15003_023E: 'mastersDegree',
  B15003_024E: 'professionalDegree',
  B15003_025E: 'doctorateDegree',
  B15003_001E: 'educationTotal',
  B23025_002E: 'laborForce',
  B23025_005E: 'unemployed',
  B23025_007E: 'notInLaborForce'
}

type CacheKind = 'state' | 'county' | 'place' | 'zip'
type CensusCache = Record<string, CensusHousingData>

let stateCachePromise: Promise<CensusCache> | null = null
let countyCachePromise: Promise<CensusCache> | null = null
let placeCachePromise: Promise<CensusCache> | null = null
let zipCachePromise: Promise<CensusCache> | null = null

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create census cache directory', error)
  }
}

function parseNumber(value: string | undefined): number | null {
  if (!value || value === '-666666666' || value === '-555555555' || value === 'null') {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

function calculateRates(occupied: number | null, total: number | null): number | null {
  if (!occupied || !total || total === 0) return null
  return (occupied / total) * 100
}

function buildCensusSnapshot(row: Record<string, string>, regionType: CacheKind): CensusHousingData {
  const totalHousingUnits = parseNumber(row.B25001_001E)
  const occupiedUnits = parseNumber(row.B25003_001E)
  const ownerOccupied = parseNumber(row.B25003_002E)
  const renterOccupied = parseNumber(row.B25003_003E)
  
  const demographics: CensusDemographics = {
    totalPopulation: parseNumber(row.B01003_001E),
    medianAge: parseNumber(row.B01002_001E),
    medianHouseholdIncome: parseNumber(row.B19013_001E),
    povertyRate: (() => {
      const povertyCount = parseNumber(row.B17001_002E)
      const povertyTotal = parseNumber(row.B17001_001E)
      return calculateRates(povertyCount, povertyTotal)
    })(),
    educationLevel: {
      highSchoolOrLess: (() => {
        const total = parseNumber(row.B15003_001E)
        const bachelors = parseNumber(row.B15003_022E) || 0
        const masters = parseNumber(row.B15003_023E) || 0
        const professional = parseNumber(row.B15003_024E) || 0
        const doctorate = parseNumber(row.B15003_025E) || 0
        const collegePlus = bachelors + masters + professional + doctorate
        return total ? ((total - collegePlus) / total) * 100 : null
      })(),
      someCollege: null, // Would need additional variables
      bachelorsOrHigher: (() => {
        const total = parseNumber(row.B15003_001E)
        const bachelors = parseNumber(row.B15003_022E) || 0
        const masters = parseNumber(row.B15003_023E) || 0
        const professional = parseNumber(row.B15003_024E) || 0
        const doctorate = parseNumber(row.B15003_025E) || 0
        const collegePlus = bachelors + masters + professional + doctorate
        return total ? (collegePlus / total) * 100 : null
      })()
    },
    employmentRate: (() => {
      const laborForce = parseNumber(row.B23025_002E)
      const unemployed = parseNumber(row.B23025_005E)
      if (!laborForce || !unemployed) return null
      return ((laborForce - unemployed) / laborForce) * 100
    })(),
    unemploymentRate: (() => {
      const laborForce = parseNumber(row.B23025_002E)
      const unemployed = parseNumber(row.B23025_005E)
      return calculateRates(unemployed, laborForce)
    })()
  }

  return {
    geoid: row.geoid || '',
    regionType,
    regionName: row.NAME || '',
    state: row.STATE_NAME || '',
    stateCode: row.STATE || '',
    totalHousingUnits,
    occupiedHousingUnits: occupiedUnits,
    ownerOccupiedUnits: ownerOccupied,
    renterOccupiedUnits: renterOccupied,
    medianHomeValue: parseNumber(row.B25077_001E),
    medianRent: parseNumber(row.B25064_001E),
    medianGrossRent: parseNumber(row.B25063_001E),
    occupancyRate: calculateRates(occupiedUnits, totalHousingUnits),
    ownerOccupiedRate: calculateRates(ownerOccupied, occupiedUnits),
    renterOccupiedRate: calculateRates(renterOccupied, occupiedUnits),
    housingUnitsBuilt: {
      before1980: (() => {
        const sixties = parseNumber(row.B25034_008E) || 0
        const fifties = parseNumber(row.B25034_009E) || 0
        const forties = parseNumber(row.B25034_010E) || 0
        const earlier = parseNumber(row.B25034_011E) || 0
        return sixties + fifties + forties + earlier
      })(),
      between1980and1999: (() => {
        const eighties = parseNumber(row.B25034_006E) || 0
        const nineties = parseNumber(row.B25034_005E) || 0
        return eighties + nineties
      })(),
      between2000and2009: parseNumber(row.B25034_004E),
      between2010and2019: parseNumber(row.B25034_003E),
      after2020: parseNumber(row.B25034_002E)
    },
    medianYearBuilt: parseNumber(row.B25035_001E),
    lastUpdated: new Date().toISOString(),
    demographics
  }
}

async function fetchCensusData(regionType: CacheKind): Promise<CensusCache> {
  const apiKey = CENSUS_CONFIG.apiKey
  if (!apiKey) {
    console.warn('Census API key not provided, returning empty cache')
    return {}
  }

  if (!CENSUS_CONFIG.enabled) {
    console.warn('Census data source is disabled')
    return {}
  }

  const year = CENSUS_ACS_YEAR
  const variables = Object.keys(ACS_VARIABLES).join(',')
  
  let url: string
  switch (regionType) {
    case 'state':
      url = `${CENSUS_CONFIG.apiBase}/${year}/acs/acs5?get=NAME,${variables}&for=state:*&key=${apiKey}`
      break
    case 'county':
      url = `${CENSUS_CONFIG.apiBase}/${year}/acs/acs5?get=NAME,${variables}&for=county:*&in=state:*&key=${apiKey}`
      break
    case 'place':
      url = `${CENSUS_CONFIG.apiBase}/${year}/acs/acs5?get=NAME,${variables}&for=place:*&in=state:*&key=${apiKey}`
      break
    case 'zip':
      url = `${CENSUS_CONFIG.apiBase}/${year}/acs/acs5?get=NAME,${variables}&for=zip%20code%20tabulation%20area:*&key=${apiKey}`
      break
    default:
      throw new Error(`Unsupported region type: ${regionType}`)
  }

  try {
    console.log(`Fetching Census ${regionType} data...`)
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'home-marketing/1.0 (+https://example.com)'
      }
    }, {
      maxRetries: 3,
      initialDelayMs: 1000
    })

    const data = await response.json()
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid Census API response format')
    }

    const headers = data[0] as string[]
    const rows = data.slice(1) as string[][]
    
    const cache: CensusCache = {}
    
    for (const row of rows) {
      if (!row || row.length !== headers.length) continue
      
      const rowData = headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = row[index] ?? ''
        return acc
      }, {})
      
      const snapshot = buildCensusSnapshot(rowData, regionType)
      const key = getCacheKey(regionType, rowData)
      
      if (key) {
        cache[key] = snapshot
      }
    }
    
    console.log(`Fetched ${Object.keys(cache).length} ${regionType} records from Census API`)
    return cache
    
  } catch (error) {
    console.error(`Failed to fetch Census ${regionType} data:`, error)
    // Try to load from cache as fallback
    try {
      const cached = await loadCache(regionType)
      if (Object.keys(cached).length > 0) {
        console.warn(`Using cached Census ${regionType} data due to fetch error`)
        return cached
      }
    } catch (cacheError) {
      console.error(`Unable to read cached Census ${regionType} data`, cacheError)
    }
    return {}
  }
}

function getCacheKey(regionType: CacheKind, row: Record<string, string>): string | null {
  switch (regionType) {
    case 'state':
      return row.state?.toUpperCase() || null
    case 'county':
      return `${row.state?.toUpperCase()}|${row.county}`
    case 'place':
      return `${row.state?.toUpperCase()}|${row.place}`
    case 'zip':
      return row['zip code tabulation area']
    default:
      return null
  }
}

async function loadCache(kind: CacheKind): Promise<CensusCache> {
  const filePath = path.join(CACHE_DIR, `${kind}.json`)
  
  // Try to load with metadata and TTL checking
  try {
    const result = await loadCacheWithMetadata<CensusCache>(filePath, {
      ttlMs: CENSUS_CONFIG.ttlMs,
      maxStalenessMs: CENSUS_CONFIG.maxStalenessMs,
      version: CENSUS_CONFIG.version
    })
    
    if (result) {
      return result.data
    }
    
    // Cache expired or doesn't exist - return empty to trigger refresh
    return {}
  } catch (error) {
    // Fallback to legacy cache loading (no metadata)
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw) as CensusCache
      console.warn(`Loaded Census ${kind} cache without metadata (legacy format)`)
      return parsed
    } catch (legacyError) {
      console.error(`Failed to read Census ${kind} cache from ${filePath}`, legacyError)
      return {}
    }
  }
}

async function getCache(kind: CacheKind): Promise<CensusCache> {
  switch (kind) {
    case 'state':
      stateCachePromise = stateCachePromise ?? loadCache('state')
      return stateCachePromise
    case 'county':
      countyCachePromise = countyCachePromise ?? loadCache('county')
      return countyCachePromise
    case 'place':
      placeCachePromise = placeCachePromise ?? loadCache('place')
      return placeCachePromise
    case 'zip':
      zipCachePromise = zipCachePromise ?? loadCache('zip')
      return zipCachePromise
  }
}

export async function getStateCensusData(stateCode: string): Promise<CensusHousingData | null> {
  if (!stateCode) return null
  const cache = await getCache('state')
  return cache[stateCode.toUpperCase()] ?? null
}

export async function getCountyCensusData(stateCode: string, countyCode: string): Promise<CensusHousingData | null> {
  if (!stateCode || !countyCode) return null
  const cache = await getCache('county')
  return cache[`${stateCode.toUpperCase()}|${countyCode}`] ?? null
}

export async function getPlaceCensusData(stateCode: string, placeCode: string): Promise<CensusHousingData | null> {
  if (!stateCode || !placeCode) return null
  const cache = await getCache('place')
  return cache[`${stateCode.toUpperCase()}|${placeCode}`] ?? null
}

export async function getZipCensusData(zip: string): Promise<CensusHousingData | null> {
  if (!zip) return null
  const cache = await getCache('zip')
  return cache[zip] ?? null
}

export async function buildCensusCache(): Promise<void> {
  console.log('Building Census ACS cache...')
  await ensureCacheDir()

  const [stateData, countyData, placeData, zipData] = await Promise.all([
    fetchCensusData('state'),
    fetchCensusData('county'),
    fetchCensusData('place'),
    fetchCensusData('zip')
  ])

  const outputs: Array<[string, CensusCache]> = [
    ['state.json', stateData],
    ['county.json', countyData],
    ['place.json', placeData],
    ['zip.json', zipData]
  ]

  await Promise.all(
    outputs.map(async ([filename, payload]) => {
      const target = path.join(CACHE_DIR, filename)
      await saveCacheWithMetadata(target, payload, {
        ttlMs: CENSUS_CONFIG.ttlMs,
        maxStalenessMs: CENSUS_CONFIG.maxStalenessMs,
        version: CENSUS_CONFIG.version
      })
      console.log(`Wrote ${Object.keys(payload).length.toLocaleString()} records to ${target}`)
    })
  )

  console.log('Census cache build complete')
}

export async function hasCensusCache(kind: CacheKind): Promise<boolean> {
  const filePath = path.join(CACHE_DIR, `${kind}.json`)
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}


