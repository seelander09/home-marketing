import type {
  SellerFeatureStoreRecord,
  SellerFeatureStoreSnapshot
} from '@/lib/data-pipeline/types'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

let snapshotCache: SellerFeatureStoreSnapshot | null = null
let recordIndex: Map<string, SellerFeatureStoreRecord> | null = null
let cachedMtimeMs: number | null = null

function buildIndex(snapshot: SellerFeatureStoreSnapshot) {
  const index = new Map<string, SellerFeatureStoreRecord>()
  for (const record of snapshot.records) {
    index.set(record.propertyId, record)
  }
  return index
}

function loadSnapshotFromDisk(): SellerFeatureStoreSnapshot | null {
  // Return null in browser environment (client-side)
  if (isBrowser) {
    return null
  }

  // Server-side only: use dynamic require to avoid bundling fs in client
  // This will only execute on the server at runtime
  try {
    // Dynamic require to load Node.js modules only on server
    // Webpack config excludes these from client bundles
    const fs = require('node:fs')
    const path = require('node:path')

    const FEATURE_STORE_ROOT = path.resolve(
      process.cwd(),
      'predictions-data',
      'feature-store',
      'seller'
    )
    const FEATURE_STORE_LATEST = path.join(FEATURE_STORE_ROOT, 'latest.json')

    if (!fs.existsSync(FEATURE_STORE_LATEST)) {
      return null
    }
    const stats = fs.statSync(FEATURE_STORE_LATEST)
    if (cachedMtimeMs && stats.mtimeMs === cachedMtimeMs && snapshotCache && recordIndex) {
      return snapshotCache
    }

    const raw = fs.readFileSync(FEATURE_STORE_LATEST, 'utf-8')
    const parsed = JSON.parse(raw) as SellerFeatureStoreSnapshot
    snapshotCache = parsed
    recordIndex = buildIndex(parsed)
    cachedMtimeMs = stats.mtimeMs
    return parsed
  } catch (error) {
    // If fs is not available or file doesn't exist, return null
    // This is safe for client-side bundling
    return null
  }
}

export function getSellerFeatureStoreSnapshot(): SellerFeatureStoreSnapshot | null {
  return loadSnapshotFromDisk()
}

export function getSellerFeatureRecord(propertyId: string): SellerFeatureStoreRecord | null {
  const snapshot = loadSnapshotFromDisk()
  if (!snapshot || !recordIndex) {
    return null
  }
  return recordIndex.get(propertyId) ?? null
}

export function clearFeatureStoreCache() {
  snapshotCache = null
  recordIndex = null
  cachedMtimeMs = null
}
