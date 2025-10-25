import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { buildSellerFeatureStoreSnapshot } from '@/lib/data-pipeline/feature-store'
import { loadIngestionBundle } from '@/lib/data-pipeline/loaders'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..', '..')

async function loadBundle() {
  const transactionsPath = path.join(rootDir, 'content/mock-data/property-transactions.json')
  const listingsPath = path.join(rootDir, 'content/mock-data/property-listings.json')
  const engagementPath = path.join(rootDir, 'content/mock-data/property-engagement.json')

  return loadIngestionBundle({ transactionsPath, listingsPath, engagementPath })
}

describe('seller feature store snapshot', () => {
  test('produces feature summaries with completeness', async () => {
    const bundle = await loadBundle()
    const snapshot = buildSellerFeatureStoreSnapshot({
      propertyIds: ['austin-elm-001', 'sf-oak-002'],
      bundle
    })

    expect(snapshot.recordCount).toBeGreaterThan(0)
    const record = snapshot.records.find((item) => item.propertyId === 'austin-elm-001')
    expect(record).toBeTruthy()
    expect(record?.transactionSummary.lastSaleDate).toBeDefined()
    expect(record?.engagementSummary.multiChannelScore).toBeDefined()
    expect(record?.quality.completeness).toBeGreaterThan(0)
    expect(record?.quality.sources).toContain('engagement')
  })
})
