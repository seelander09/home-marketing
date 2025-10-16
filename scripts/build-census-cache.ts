import { buildCensusCache } from '../lib/insights/census.ts'

async function main() {
  try {
    await buildCensusCache()
  } catch (error) {
    console.error('Census cache build failed:', error)
    process.exit(1)
  }
}

void main()
