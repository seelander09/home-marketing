import fs from 'fs/promises'
import path from 'path'

const CENSUS_API_KEY = '676987a71483dae833c0d8e3d732f8f2add95f88'
const CENSUS_API_BASE = 'https://api.census.gov/data'

// ACS 5-Year Estimates Variables for housing and demographics
const ACS_VARIABLES = {
  'B25001_001E': 'totalHousingUnits',
  'B25003_001E': 'totalOccupiedUnits',
  'B25003_002E': 'ownerOccupiedUnits',
  'B25003_003E': 'renterOccupiedUnits',
  'B25077_001E': 'medianHomeValue',
  'B25064_001E': 'medianRent',
  'B25063_001E': 'medianGrossRent',
  'B25034_010E': 'unitsBuiltBefore1980',
  'B25034_011E': 'unitsBuilt1980to1989',
  'B25034_012E': 'unitsBuilt1990to1999',
  'B25034_013E': 'unitsBuilt2000to2009',
  'B25034_014E': 'unitsBuilt2010to2019',
  'B25034_015E': 'unitsBuiltAfter2020',
  'B25035_001E': 'medianYearBuilt',
  'B01003_001E': 'totalPopulation',
  'B01002_001E': 'medianAge',
  'B19013_001E': 'medianHouseholdIncome',
  'B17001_002E': 'povertyCount',
  'B17001_001E': 'povertyTotal',
  'B15003_022E': 'bachelorsDegree',
  'B15003_023E': 'mastersDegree',
  'B15003_024E': 'professionalDegree',
  'B15003_025E': 'doctorateDegree',
  'B15003_001E': 'educationTotal',
  'B23025_002E': 'laborForce',
  'B23025_005E': 'unemployed',
  'B23025_007E': 'notInLaborForce'
}

function parseNumber(value) {
  if (!value || value === '-666666666' || value === '-555555555' || value === 'null') {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

function calculateRates(occupied, total) {
  if (!occupied || !total || total === 0) return null
  return (occupied / total) * 100
}

async function fetchCensusData(regionType) {
  console.log(`📊 Fetching Census ${regionType} data...`)
  
  const year = '2022'
  const variables = Object.keys(ACS_VARIABLES).join(',')
  
  let url
  switch (regionType) {
    case 'state':
      url = `${CENSUS_API_BASE}/${year}/acs/acs5?get=NAME,${variables}&for=state:*&key=${CENSUS_API_KEY}`
      break
    default:
      throw new Error(`Unsupported region type: ${regionType}`)
  }

  try {
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
        medianGrossRent: parseNumber(rowData.B25063_001E),
        occupancyRate: calculateRates(occupiedUnits, totalHousingUnits),
        ownerOccupiedRate: calculateRates(ownerOccupied, occupiedUnits),
        renterOccupiedRate: calculateRates(renterOccupied, occupiedUnits),
        housingUnitsBuilt: {
          before1980: parseNumber(rowData.B25034_010E),
          between1980and1999: (() => {
            const eighties = parseNumber(rowData.B25034_011E) || 0
            const nineties = parseNumber(rowData.B25034_012E) || 0
            return eighties + nineties
          })(),
          between2000and2009: parseNumber(rowData.B25034_013E),
          between2010and2019: parseNumber(rowData.B25034_014E),
          after2020: parseNumber(rowData.B25034_015E)
        },
        medianYearBuilt: parseNumber(rowData.B25035_001E),
        lastUpdated: new Date().toISOString(),
        demographics: {
          totalPopulation: parseNumber(rowData.B01003_001E),
          medianAge: parseNumber(rowData.B01002_001E),
          medianHouseholdIncome: parseNumber(rowData.B19013_001E),
          povertyRate: (() => {
            const povertyCount = parseNumber(rowData.B17001_002E)
            const povertyTotal = parseNumber(rowData.B17001_001E)
            return calculateRates(povertyCount, povertyTotal)
          })(),
          educationLevel: {
            highSchoolOrLess: (() => {
              const total = parseNumber(rowData.B15003_001E)
              const bachelors = parseNumber(rowData.B15003_022E) || 0
              const masters = parseNumber(rowData.B15003_023E) || 0
              const professional = parseNumber(rowData.B15003_024E) || 0
              const doctorate = parseNumber(rowData.B15003_025E) || 0
              const collegePlus = bachelors + masters + professional + doctorate
              return total ? ((total - collegePlus) / total) * 100 : null
            })(),
            someCollege: null, // Would need additional variables
            bachelorsOrHigher: (() => {
              const total = parseNumber(rowData.B15003_001E)
              const bachelors = parseNumber(rowData.B15003_022E) || 0
              const masters = parseNumber(rowData.B15003_023E) || 0
              const professional = parseNumber(rowData.B15003_024E) || 0
              const doctorate = parseNumber(rowData.B15003_025E) || 0
              const collegePlus = bachelors + masters + professional + doctorate
              return total ? (collegePlus / total) * 100 : null
            })()
          },
          employmentRate: (() => {
            const laborForce = parseNumber(rowData.B23025_002E)
            const unemployed = parseNumber(rowData.B23025_005E)
            if (!laborForce || !unemployed) return null
            return ((laborForce - unemployed) / laborForce) * 100
          })(),
          unemploymentRate: (() => {
            const laborForce = parseNumber(rowData.B23025_002E)
            const unemployed = parseNumber(rowData.B23025_005E)
            return calculateRates(unemployed, laborForce)
          })()
        }
      }
      
      cache[stateCode] = censusData
    }
    
    console.log(`✅ Fetched ${Object.keys(cache).length} ${regionType} records from Census API`)
    return cache
    
  } catch (error) {
    console.error(`❌ Failed to fetch Census ${regionType} data:`, error)
    return {}
  }
}

async function main() {
  console.log('🏗  Building Census ACS cache...')
  
  try {
    // Ensure cache directory exists
    const cacheDir = path.resolve(process.cwd(), '..', 'census-data', 'cache')
    await fs.mkdir(cacheDir, { recursive: true })
    
    // Fetch state data
    const stateData = await fetchCensusData('state')
    
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
