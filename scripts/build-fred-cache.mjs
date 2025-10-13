import { buildFREDCache } from '../lib/insights/fred.js'

async function main() {
  console.log('🏗  Building FRED economic cache...')
  
  try {
    await buildFREDCache()
    console.log('✅ FRED cache build complete')
  } catch (error) {
    console.error('❌ FRED cache build failed:', error)
    process.exitCode = 1
  }
}

main()
