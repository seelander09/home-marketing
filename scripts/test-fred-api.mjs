const FRED_API_KEY = '1329d932aae5ca43e09bf6fc9a4a308e'

async function testFREDAPI() {
  console.log('🧪 Testing FRED API connection...')
  
  try {
    // Test with a simple mortgage rate query
    const seriesId = 'MORTGAGE30US' // 30-year mortgage rate
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
    
    console.log('📡 Fetching 30-year mortgage rate...')
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`FRED API responded with ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ FRED API connection successful!')
    console.log('📊 Response structure:', JSON.stringify(data, null, 2))
    
    if (data.observations && data.observations.length > 0) {
      const latest = data.observations[0]
      console.log(`📈 Latest 30-year mortgage rate: ${latest.value}% (${latest.date})`)
    }
    
  } catch (error) {
    console.error('❌ FRED API test failed:', error.message)
  }
}

testFREDAPI()
