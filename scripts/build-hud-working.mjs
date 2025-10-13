import fs from 'fs/promises'
import path from 'path'

const HUD_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI2IiwianRpIjoiNWJiZGM0MDNjNzg2NjNkZjhhNzVlMGVjNDcxYjg1NzNhZjEyM2I2YTEyNjE0Nzk2NTFjNGRhYTg4OWY4NGIzNmEwNzM4ZjNjOWYwN2M1NWUiLCJpYXQiOjE3NjAzODU5NjIuMzgxMzAzLCJuYmYiOjE3NjAzODU5NjIuMzgxMzA4LCJleHAiOjIwNzU5MTg3NjIuMzc1MjIyLCJzdWIiOiIxMTExNTciLCJzY29wZXMiOltdfQ.UigsbK-IQmvA3_0tK9OHlWaylspqCQfvuCvPQ4cJAoL1i6xbMk2z4nhfXAr7GAfZhOeueneMfCXs9C0GSMtQhw'

async function fetchHUDData() {
  console.log('📊 Fetching HUD data...')
  
  try {
    // Test different HUD API endpoints
    const testEndpoints = [
      'https://www.huduser.gov/portal/api/fmr',
      'https://www.huduser.gov/portal/api/fmr/list',
      'https://www.huduser.gov/portal/api/datasets',
      'https://www.huduser.gov/portal/api/states'
    ]
    
    let workingEndpoint = null
    let sampleData = null
    
    for (const endpoint of testEndpoints) {
      console.log(`📡 Testing endpoint: ${endpoint}`)
      
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${HUD_API_KEY}`,
            'Accept': 'application/json'
          }
        })
        
        console.log(`   Status: ${response.status}`)
        
        if (response.status === 200) {
          const data = await response.json()
          workingEndpoint = endpoint
          sampleData = data
          console.log(`   ✅ Success! Data structure:`, Object.keys(data))
          break
        } else if (response.status === 404) {
          console.log(`   ⚠️  Endpoint not found`)
        } else if (response.status === 401) {
          console.log(`   ❌ Authentication failed`)
        } else if (response.status === 403) {
          console.log(`   ❌ Access forbidden`)
        } else {
          console.log(`   ❓ Unexpected status: ${response.status}`)
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
    
    if (!workingEndpoint) {
      console.log('⚠️  No working HUD endpoints found')
      return {
        hudData: null,
        status: 'no_working_endpoints',
        message: 'HUD API key is valid but no accessible endpoints found'
      }
    }
    
    return {
      hudData: sampleData,
      status: 'success',
      endpoint: workingEndpoint,
      message: 'HUD API connection successful'
    }
    
  } catch (error) {
    console.error(`❌ Failed to fetch HUD data:`, error)
    return {
      hudData: null,
      status: 'error',
      message: error.message
    }
  }
}

async function main() {
  console.log('🏗  Building HUD cache...')
  
  try {
    // Ensure cache directory exists
    const cacheDir = path.resolve(process.cwd(), '..', 'hud-data', 'cache')
    await fs.mkdir(cacheDir, { recursive: true })
    
    // Fetch HUD data
    const result = await fetchHUDData()
    
    // Save result to cache file
    const target = path.join(cacheDir, 'hud-test.json')
    await fs.writeFile(target, JSON.stringify(result, null, 2))
    console.log(`💾 Wrote HUD test result to ${target}`)
    
    // Show result
    console.log(`\n📊 HUD API Test Result:`)
    console.log(`Status: ${result.status}`)
    console.log(`Message: ${result.message}`)
    if (result.endpoint) {
      console.log(`Working endpoint: ${result.endpoint}`)
    }
    if (result.hudData) {
      console.log(`Sample data structure:`, Object.keys(result.hudData))
    }
    
    if (result.status === 'success') {
      console.log('✅ HUD API integration successful')
    } else {
      console.log('⚠️  HUD API integration needs adjustment')
    }
    
    console.log('✅ HUD cache build complete')
    
  } catch (error) {
    console.error('❌ HUD cache build failed:', error)
    process.exitCode = 1
  }
}

main()
