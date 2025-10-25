#!/usr/bin/env -S ts-node --esm
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import properties from '@/content/mock-data/realie-properties.json'
import { loadIngestionBundle } from '@/lib/data-pipeline/loaders'
import { buildSellerFeatureStoreSnapshot } from '@/lib/data-pipeline/feature-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..', '..')
const OUTPUT_DIR = path.join(ROOT, 'predictions-data', 'feature-store', 'seller')

async function getFileVersion(relativePath: string) {
  const resolved = path.join(ROOT, relativePath)
  const stats = await fs.stat(resolved)
  return `${relativePath}@${stats.mtime.toISOString()}`
}

async function persistSnapshot(snapshot: ReturnType<typeof buildSellerFeatureStoreSnapshot>) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const timestamp = snapshot.generatedAt.replace(/[:.]/g, '-')
  const versionedPath = path.join(OUTPUT_DIR, `snapshot-${timestamp}.json`)
  const latestPath = path.join(OUTPUT_DIR, 'latest.json')
  const qualityPath = path.join(OUTPUT_DIR, 'quality.json')

  await Promise.all([
    fs.writeFile(versionedPath, JSON.stringify(snapshot, null, 2), 'utf-8'),
    fs.writeFile(latestPath, JSON.stringify(snapshot, null, 2), 'utf-8'),
    fs.writeFile(qualityPath, JSON.stringify(snapshot.qualityMetrics, null, 2), 'utf-8')
  ])

  return { versionedPath, latestPath }
}

async function main() {
  const transactionsPath = 'content/mock-data/property-transactions.json'
  const listingsPath = 'content/mock-data/property-listings.json'
  const engagementPath = 'content/mock-data/property-engagement.json'

  const [transactionsVersion, listingsVersion, engagementVersion] = await Promise.all([
    getFileVersion(transactionsPath),
    getFileVersion(listingsPath),
    getFileVersion(engagementPath)
  ])

  const bundle = await loadIngestionBundle({
    transactionsPath: path.join(ROOT, transactionsPath),
    listingsPath: path.join(ROOT, listingsPath),
    engagementPath: path.join(ROOT, engagementPath)
  })

  const propertyIds = properties.map((property) => property.id)

  const snapshot = buildSellerFeatureStoreSnapshot({
    propertyIds,
    bundle,
    sources: {
      transactionsVersion,
      listingsVersion,
      engagementVersion
    }
  })

  const paths = await persistSnapshot(snapshot)

  // eslint-disable-next-line no-console
  console.log('Seller feature store snapshot generated:')
  // eslint-disable-next-line no-console
  console.log(`  Records: ${snapshot.recordCount}`)
  // eslint-disable-next-line no-console
  console.log(`  Avg completeness: ${snapshot.stats.averageCompleteness}%`)
  // eslint-disable-next-line no-console
  console.log(`  Latest snapshot: ${paths.latestPath}`)
}

void main().catch((error) => {
  console.error('Failed to refresh seller feature store', error)
  process.exitCode = 1
})
