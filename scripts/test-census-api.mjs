import fs from 'fs/promises'
import path from 'path'

const CENSUS_API_KEY = '676987a71483dae833c0d8e3d732f8f2add95f88'
const CENSUS_API_BASE = 'https://api.census.gov/data'

async function testCensusAPI() {
  console.log('🧪 Testing Census API connection...')
  
  try {
    // Test with a simple state query
    const year = '2022'
    const variables = 'NAME,B25001_001E,B25077_001E' // Total housing units, median home value
    const url = `${CENSUS_API_BASE}/${year}/acs/acs5?get=NAME,${variables}&for=state:TX&key=${CENSUS_API_KEY}`
    
    console.log('📡 Fetching data from Census API...')
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Census API responded with ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ Census API connection successful!')
    console.log('📊 Sample data:', JSON.stringify(data[0], null, 2))
    console.log('📈 Data records:', data.length - 1) // Subtract header row
    
    // Create cache directory
    const cacheDir = path.resolve(process.cwd(), '..', 'census-data', 'cache')
    await fs.mkdir(cacheDir, { recursive: true })
    
    // Save sample data
    const sampleFile = path.join(cacheDir, 'test-data.json')
    await fs.writeFile(sampleFile, JSON.stringify(data, null, 2))
    console.log(`💾 Sample data saved to ${sampleFile}`)
    
    console.log('🎉 Census API test completed successfully!')
    
  } catch (error) {
    console.error('❌ Census API test failed:', error.message)
    process.exitCode = 1
  }
}

testCensusAPI()
