import { buildHUDCache } from '../lib/insights/hud'

async function main() {
  try {
    console.log('Building HUD market cache...')
    await buildHUDCache()
  } catch (error) {
    console.error('HUD cache build failed:', error)
    process.exit(1)
  }
}

void main()
