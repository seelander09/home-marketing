const CENSUS_API_KEY = '676987a71483dae833c0d8e3d732f8f2add95f88'
const CENSUS_API_BASE = 'https://api.census.gov/data'

async function debugCensusAPI() {
  console.log('🔍 Debugging Census API connection...')
  
  try {
    // Test with a simple state query
    const year = '2022'
    const variables = 'NAME,B25001_001E,B25077_001E' // Total housing units, median home value
    const url = `${CENSUS_API_BASE}/${year}/acs/acs5?get=NAME,${variables}&for=state:TX&key=${CENSUS_API_KEY}`
    
    console.log('📡 URL:', url)
    console.log('📡 Fetching data from Census API...')
    
    const response = await fetch(url)
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('📊 Raw response:', text.substring(0, 500) + '...')
    
    if (!response.ok) {
      throw new Error(`Census API responded with ${response.status}: ${response.statusText}`)
    }
    
    const data = JSON.parse(text)
    console.log('✅ Census API connection successful!')
    console.log('📊 Parsed data:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Census API debug failed:', error.message)
    console.error('❌ Full error:', error)
  }
}

debugCensusAPI()
