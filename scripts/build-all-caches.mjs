import { buildCensusCache } from '../lib/insights/census.js'
import { buildFREDCache } from '../lib/insights/fred.js'
import { buildHUDCache } from '../lib/insights/hud.js'
import { execSync } from 'child_process'

async function buildAllCaches() {
  console.log('🏗  Building all housing data caches...\n')
  
  const startTime = Date.now()
  
  try {
    // Build Redfin cache (existing script)
    console.log('📊 Building Redfin cache...')
    execSync('npm run redfin:build-cache', { stdio: 'inherit' })
    console.log('✅ Redfin cache complete\n')
    
    // Build Census cache
    console.log('📊 Building Census ACS cache...')
    await buildCensusCache()
    console.log('✅ Census cache complete\n')
    
    // Build FRED cache
    console.log('📊 Building FRED economic cache...')
    await buildFREDCache()
    console.log('✅ FRED cache complete\n')
    
    // Build HUD cache
    console.log('📊 Building HUD market cache...')
    await buildHUDCache()
    console.log('✅ HUD cache complete\n')
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`🎉 All caches built successfully in ${elapsed}s`)
    
  } catch (error) {
    console.error('❌ Cache build failed:', error)
    process.exitCode = 1
  }
}

buildAllCaches()
