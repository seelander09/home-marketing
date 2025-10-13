import { buildHUDCache } from '../lib/insights/hud.js'

async function main() {
  console.log('🏗  Building HUD market cache...')
  
  try {
    await buildHUDCache()
    console.log('✅ HUD cache build complete')
  } catch (error) {
    console.error('❌ HUD cache build failed:', error)
    process.exitCode = 1
  }
}

main()
