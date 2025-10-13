const HUD_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI2IiwianRpIjoiNWJiZGM0MDNjNzg2NjNkZjhhNzVlMGVjNDcxYjg1NzNhZjEyM2I2YTEyNjE0Nzk2NTFjNGRhYTg4OWY4NGIzNmEwNzM4ZjNjOWYwN2M1NWUiLCJpYXQiOjE3NjAzODU5NjIuMzgxMzAzLCJuYmYiOjE3NjAzODU5NjIuMzgxMzA4LCJleHAiOjIwNzU5MTg3NjIuMzc1MjIyLCJzdWIiOiIxMTExNTciLCJzY29wZXMiOltdfQ.UigsbK-IQmvA3_0tK9OHlWaylspqCQfvuCvPQ4cJAoL1i6xbMk2z4nhfXAr7GAfZhOeueneMfCXs9C0GSMtQhw'

async function testHUDAPI() {
  console.log('🧪 Testing HUD API connection...')
  
  try {
    // Test with a simple HUD API endpoint
    const url = 'https://www.huduser.gov/portal/api/fmr'
    
    console.log('📡 Testing HUD API endpoint...')
    console.log('📡 URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${HUD_API_KEY}`,
        'Accept': 'application/json'
      }
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.status === 200) {
      const data = await response.json()
      console.log('✅ HUD API connection successful!')
      console.log('📊 Response structure:', JSON.stringify(data, null, 2))
    } else if (response.status === 401) {
      console.log('❌ Authentication failed - API key may be invalid')
    } else if (response.status === 403) {
      console.log('❌ Access forbidden - API key may not have required permissions')
    } else {
      const text = await response.text()
      console.log('📊 Response body:', text.substring(0, 500))
    }
    
  } catch (error) {
    console.error('❌ HUD API test failed:', error.message)
  }
}

testHUDAPI()
