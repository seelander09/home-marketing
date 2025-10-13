const CENSUS_API_KEY = '676987a71483dae833c0d8e3d732f8f2add95f88'

async function validateCensusKey() {
  console.log('🔑 Validating Census API key...')
  
  try {
    // Try different API endpoints to validate the key
    const testUrls = [
      // Test with different year
      `https://api.census.gov/data/2021/acs/acs5?get=NAME&for=state:TX&key=${CENSUS_API_KEY}`,
      // Test with different dataset
      `https://api.census.gov/data/2020/dec/dp?get=NAME&for=state:TX&key=${CENSUS_API_KEY}`,
      // Test with different geography
      `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=state:*&key=${CENSUS_API_KEY}`,
      // Test with invalid key (should return 400)
      `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=state:TX&key=invalid_key`
    ]
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i]
      console.log(`\n📡 Test ${i + 1}: ${url.substring(0, 80)}...`)
      
      try {
        const response = await fetch(url)
        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.status === 200) {
          const text = await response.text()
          if (text.length > 0) {
            const data = JSON.parse(text)
            console.log(`   ✅ Success! Records: ${data.length - 1}`)
            if (i === 0) {
              console.log(`   📊 Sample data: ${JSON.stringify(data[0], null, 2)}`)
            }
            break
          }
        } else if (response.status === 400) {
          console.log(`   ❌ Bad Request - likely invalid key or parameters`)
        } else if (response.status === 204) {
          console.log(`   ⚠️  No Content - might be valid key but no data`)
        } else {
          console.log(`   ❓ Unexpected status: ${response.status}`)
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
  }
}

validateCensusKey()
