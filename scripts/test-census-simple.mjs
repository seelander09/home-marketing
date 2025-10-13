const CENSUS_API_KEY = '676987a71483dae833c0d8e3d732f8f2add95f88'

async function testSimpleCensusAPI() {
  console.log('🔍 Testing simple Census API request...')
  
  try {
    // Try the most basic request possible
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=state:TX&key=${CENSUS_API_KEY}`
    
    console.log('📡 URL:', url)
    console.log('📡 Fetching data from Census API...')
    
    const response = await fetch(url)
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response status text:', response.statusText)
    
    if (response.status === 204) {
      console.log('⚠️  API returned 204 No Content - this might indicate:')
      console.log('   1. API key is invalid')
      console.log('   2. Request format is incorrect')
      console.log('   3. No data available for the requested parameters')
      return
    }
    
    const text = await response.text()
    console.log('📊 Raw response length:', text.length)
    console.log('📊 Raw response:', text)
    
    if (text.length > 0) {
      const data = JSON.parse(text)
      console.log('✅ Census API connection successful!')
      console.log('📊 Parsed data:', JSON.stringify(data, null, 2))
    } else {
      console.log('⚠️  Empty response body')
    }
    
  } catch (error) {
    console.error('❌ Census API test failed:', error.message)
  }
}

testSimpleCensusAPI()
