import fs from 'fs/promises'
import path from 'path'

// Mock HUD data since the API endpoints aren't accessible
function generateMockHUDData() {
  console.log('📊 Generating mock HUD data (API endpoints not accessible)...')
  
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  ]
  
  const hudData = {}
  
  states.forEach(stateCode => {
    // Generate realistic mock data
    const basePriceIndex = Math.random() * 200 + 150 // 150-350 range
    const affordabilityIndex = Math.random() * 40 + 60 // 60-100 range
    const inventoryLevel = Math.random() > 0.5 ? 'moderate' : (Math.random() > 0.5 ? 'low' : 'high')
    
    hudData[stateCode] = {
      regionType: 'state',
      regionCode: stateCode,
      regionName: stateCode,
      state: stateCode,
      stateCode: stateCode,
      
      housingPriceIndex: {
        current: Math.round(basePriceIndex * 100) / 100,
        yearOverYearChange: Math.round((Math.random() * 10 - 5) * 100) / 100, // -5 to +5%
        quarterlyChange: Math.round((Math.random() * 4 - 2) * 100) / 100, // -2 to +2%
        historicalData: []
      },
      
      marketConditions: {
        affordabilityIndex: Math.round(affordabilityIndex * 100) / 100,
        inventoryLevel: inventoryLevel,
        marketVelocity: Math.round((Math.random() * 50 + 50) * 100) / 100, // 50-100
        priceAppreciation: Math.round((Math.random() * 8 - 2) * 100) / 100 // -2 to +6%
      },
      
      economicIndicators: {
        medianIncome: Math.round((Math.random() * 50000 + 50000)), // 50k-100k
        unemploymentRate: Math.round((Math.random() * 6 + 2) * 100) / 100, // 2-8%
        populationGrowth: Math.round((Math.random() * 4 - 1) * 100) / 100, // -1 to +3%
        jobGrowth: Math.round((Math.random() * 6 - 1) * 100) / 100 // -1 to +5%
      },
      
      affordability: {
        medianHomePrice: Math.round((Math.random() * 400000 + 200000)), // 200k-600k
        medianRent: Math.round((Math.random() * 1500 + 800)), // 800-2300
        incomeToPriceRatio: Math.round((Math.random() * 3 + 3) * 100) / 100, // 3-6x
        rentToIncomeRatio: Math.round((Math.random() * 20 + 20) * 100) / 100, // 20-40%
        affordableHousingUnits: Math.round(Math.random() * 50000 + 10000), // 10k-60k
        costBurdenedHouseholds: Math.round((Math.random() * 30 + 20) * 100) / 100 // 20-50%
      },
      
      lastUpdated: new Date().toISOString()
    }
  })
  
  console.log(`✅ Generated mock HUD data for ${Object.keys(hudData).length} states`)
  return hudData
}

async function main() {
  console.log('🏗  Building HUD cache (mock data)...')
  
  try {
    // Ensure cache directory exists
    const cacheDir = path.resolve(process.cwd(), '..', 'hud-data', 'cache')
    await fs.mkdir(cacheDir, { recursive: true })
    
    // Generate mock HUD data
    const hudData = generateMockHUDData()
    
    // Save to cache file
    const target = path.join(cacheDir, 'state.json')
    await fs.writeFile(target, JSON.stringify(hudData, null, 2))
    console.log(`💾 Wrote mock HUD data to ${target}`)
    
    // Show sample data
    const sampleState = Object.keys(hudData)[0]
    if (sampleState) {
      console.log(`\n📊 Sample mock HUD data for ${sampleState}:`)
      console.log(JSON.stringify(hudData[sampleState], null, 2))
    }
    
    console.log('✅ HUD mock cache build complete')
    console.log('📝 Note: This is mock data since HUD API endpoints are not accessible')
    
  } catch (error) {
    console.error('❌ HUD mock cache build failed:', error)
    process.exitCode = 1
  }
}

main()
