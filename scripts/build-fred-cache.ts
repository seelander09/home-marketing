import { buildFREDCache } from '../lib/insights/fred.ts'

async function main() {
  try {
    console.log('Building FRED economic cache...')
    await buildFREDCache()
  } catch (error) {
    console.error('FRED cache build failed:', error)
    process.exit(1)
  }
}

void main()
