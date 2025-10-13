import fs from 'fs/promises'
import path from 'path'

export type RedfinMarketSnapshot = {
  regionType: 'state' | 'city' | 'zip'
  regionName: string
  state: string
  stateCode: string
  periodBegin: string
  periodEnd: string
  medianSalePrice: number | null
  medianDom: number | null
  inventory: number | null
  monthsOfSupply: number | null
  soldAboveList: number | null
  priceDrops: number | null
  newListings: number | null
  pendingSales: number | null
  avgSaleToList: number | null
  lastUpdated: string | null
  city?: string
  zip?: string
}

const CACHE_DIR =
  process.env.REDFIN_CACHE_DIR ??
  path.resolve(process.cwd(), '..', 'redfin-data', 'cache')

const CACHE_FILES = {
  state: 'state.json',
  city: 'city.json',
  zip: 'zip.json'
} as const

type CacheKind = keyof typeof CACHE_FILES
type SnapshotCache = Record<string, RedfinMarketSnapshot>

let stateCachePromise: Promise<SnapshotCache> | null = null
let cityCachePromise: Promise<SnapshotCache> | null = null
let zipCachePromise: Promise<SnapshotCache> | null = null

async function loadCache(kind: CacheKind): Promise<SnapshotCache> {
  const filePath = path.join(CACHE_DIR, CACHE_FILES[kind])
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as SnapshotCache
    return parsed
  } catch (error) {
    console.error(`Failed to read Redfin ${kind} cache from ${filePath}`, error)
    return {}
  }
}

async function getCache(kind: CacheKind) {
  if (kind === 'state') {
    stateCachePromise = stateCachePromise ?? loadCache('state')
    return stateCachePromise
  }
  if (kind === 'city') {
    cityCachePromise = cityCachePromise ?? loadCache('city')
    return cityCachePromise
  }
  zipCachePromise = zipCachePromise ?? loadCache('zip')
  return zipCachePromise
}

function normalizeStateCode(value: string) {
  return value.trim().toUpperCase()
}

function normalizeCityKey(stateCode: string, city: string) {
  return `${normalizeStateCode(stateCode)}|${city.trim().toLowerCase()}`
}

function normalizeZip(zip: string) {
  return zip.trim()
}

export async function getStateMarketSnapshot(stateCode: string) {
  if (!stateCode) return null
  const cache = await getCache('state')
  return cache[normalizeStateCode(stateCode)] ?? null
}

export async function getCityMarketSnapshot(stateCode: string, city: string) {
  if (!stateCode || !city) return null
  const cache = await getCache('city')
  return cache[normalizeCityKey(stateCode, city)] ?? null
}

export async function getZipMarketSnapshot(zip: string) {
  if (!zip) return null
  const cache = await getCache('zip')
  return cache[normalizeZip(zip)] ?? null
}

export async function listCachedStates() {
  const cache = await getCache('state')
  return Object.keys(cache).sort()
}

export async function listCachedCities(stateCode: string) {
  if (!stateCode) return []
  const normalized = normalizeStateCode(stateCode)
  const cache = await getCache('city')
  return Object.values(cache)
    .filter((snapshot) => snapshot.stateCode === normalized)
    .map((snapshot) => snapshot.city ?? snapshot.regionName)
    .sort()
}

export async function hasRedfinCache(kind: CacheKind) {
  const filePath = path.join(CACHE_DIR, CACHE_FILES[kind])
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
