import fs from 'node:fs'
import path from 'node:path'

import type {
  SellerFeatureStoreRecord,
  SellerFeatureStoreSnapshot
} from '@/lib/data-pipeline/types'

const FEATURE_STORE_ROOT = path.resolve(
  process.cwd(),
  'predictions-data',
  'feature-store',
  'seller'
)
const FEATURE_STORE_LATEST = path.join(FEATURE_STORE_ROOT, 'latest.json')

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
