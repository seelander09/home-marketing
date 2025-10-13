import fs from 'fs/promises'
import path from 'path'

const CENSUS_API_KEY = '676987a71483dae833c0d8e3d732f8f2add95f88'
const CENSUS_API_BASE = 'https://api.census.gov/data'

function parseNumber(value) {
  if (!value || value === '-666666666' || value === '-555555555' || value === 'null') {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

async function fetchBasicHousingData() {
  console.log('📊 Fetching basic housing data...')
  
  const year = '2022'
  // Start with just basic housing variables
  const variables = 'B25001_001E,B25003_001E,B25003_002E,B25003_003E,B25077_001E,B25064_001E'
  const url = `${CENSUS_API_BASE}/${year}/acs/acs5?get=NAME,${variables}&for=state:*&key=${CENSUS_API_KEY}`

  try {
    console.log('📡 Fetching from:', url.substring(0, 100) + '...')
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Census API responded with ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid Census API response format')
    }

    const headers = data[0]
    const rows = data.slice(1)
    
    const cache = {}
    
    for (const row of rows) {
      if (!row || row.length !== headers.length) continue
      
      const rowData = headers.reduce((acc, header, index) => {
        acc[header] = row[index]
        return acc
      }, {})
      
      const stateCode = rowData.state?.toUpperCase()
      if (!stateCode) continue
      
      const totalHousingUnits = parseNumber(rowData.B25001_001E)
      const occupiedUnits = parseNumber(rowData.B25003_001E)
      const ownerOccupied = parseNumber(rowData.B25003_002E)
      const renterOccupied = parseNumber(rowData.B25003_003E)
      
      const censusData = {
        geoid: stateCode,
        regionType: 'state',
        regionName: rowData.NAME || '',
        state: rowData.NAME || '',
        stateCode: stateCode,
        totalHousingUnits,
        occupiedHousingUnits: occupiedUnits,
        ownerOccupiedUnits: ownerOccupied,
        renterOccupiedUnits: renterOccupied,
        medianHomeValue: parseNumber(rowData.B25077_001E),
        medianRent: parseNumber(rowData.B25064_001E),
        occupancyRate: totalHousingUnits && occupiedUnits ? (occupiedUnits / totalHousingUnits) * 100 : null,
        ownerOccupiedRate: occupiedUnits && ownerOccupied ? (ownerOccupied / occupiedUnits) * 100 : null,
        renterOccupiedRate: occupiedUnits && renterOccupied ? (renterOccupied / occupiedUnits) * 100 : null,
        lastUpdated: new Date().toISOString()
      }
      
      cache[stateCode] = censusData
    }
    
    console.log(`✅ Fetched ${Object.keys(cache).length} state records from Census API`)
    return cache
    
  } catch (error) {
    console.error(`❌ Failed to fetch Census data:`, error)
    return {}
  }
}

async function main() {
  console.log('🏗  Building Census ACS cache (basic version)...')
  
  try {
    // Ensure cache directory exists
    const cacheDir = path.resolve(process.cwd(), '..', 'census-data', 'cache')
    await fs.mkdir(cacheDir, { recursive: true })
    
    // Fetch basic housing data
    const stateData = await fetchBasicHousingData()
    
    if (Object.keys(stateData).length === 0) {
      console.log('⚠️  No data fetched, skipping cache creation')
      return
    }
    
    // Save to cache file
    const target = path.join(cacheDir, 'state.json')
    await fs.writeFile(target, JSON.stringify(stateData, null, 2))
    console.log(`💾 Wrote ${Object.keys(stateData).length.toLocaleString()} records to ${target}`)
    
    // Show sample data
    const sampleState = Object.keys(stateData)[0]
    if (sampleState) {
      console.log(`\n📊 Sample data for ${sampleState}:`)
      console.log(JSON.stringify(stateData[sampleState], null, 2))
    }
    
    console.log('✅ Census cache build complete')
    
  } catch (error) {
    console.error('❌ Census cache build failed:', error)
    process.exitCode = 1
  }
}

main()
