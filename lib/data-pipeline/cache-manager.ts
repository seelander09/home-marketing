/**
 * Cache management utilities with TTL support and freshness tracking
 */

import fs from 'fs/promises'
import path from 'path'
import type { CacheError, DataStalenessError } from './errors'

export type CacheMetadata = {
  version: string
  createdAt: string
  expiresAt: string
  sourceVersion?: string
  recordCount?: number
}

export type CacheConfig = {
  ttlMs: number // Time to live in milliseconds
  version?: string // Cache schema version
  maxStalenessMs?: number // Maximum acceptable staleness (warns if exceeded)
}

const DEFAULT_CONFIG: Required<Omit<CacheConfig, 'version'>> = {
  ttlMs: 30 * 24 * 60 * 60 * 1000, // 30 days default
  maxStalenessMs: 90 * 24 * 60 * 60 * 1000 // 90 days max staleness
}

/**
 * Check if cache is expired
 */
export function isCacheExpired(metadata: CacheMetadata, config: CacheConfig): boolean {
  const expiresAt = new Date(metadata.expiresAt)
  return expiresAt.getTime() < Date.now()
}

/**
 * Check if cache is stale (beyond max staleness threshold)
 */
export function isCacheStale(metadata: CacheMetadata, config: CacheConfig): boolean {
  const maxStaleness = config.maxStalenessMs ?? DEFAULT_CONFIG.maxStalenessMs
  const createdAt = new Date(metadata.createdAt)
  const age = Date.now() - createdAt.getTime()
  return age > maxStaleness
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(metadata: CacheMetadata): number {
  const createdAt = new Date(metadata.createdAt)
  return Date.now() - createdAt.getTime()
}

/**
 * Validate cache metadata
 */
export function validateCacheMetadata(metadata: unknown): metadata is CacheMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return false
  }

  const m = metadata as Record<string, unknown>
  
  return (
    typeof m.version === 'string' &&
    typeof m.createdAt === 'string' &&
    typeof m.expiresAt === 'string' &&
    (!m.sourceVersion || typeof m.sourceVersion === 'string') &&
    (!m.recordCount || typeof m.recordCount === 'number')
  )
}

/**
 * Create cache metadata
 */
export function createCacheMetadata(config: CacheConfig, recordCount?: number): CacheMetadata {
  const now = new Date()
  const ttl = config.ttlMs ?? DEFAULT_CONFIG.ttlMs
  const expiresAt = new Date(now.getTime() + ttl)

  return {
    version: config.version || '1.0.0',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    recordCount
  }
}

/**
 * Load cache with metadata
 */
export type CacheWithMetadata<T> = {
  data: T
  metadata: CacheMetadata
}

export async function loadCacheWithMetadata<T>(
  cachePath: string,
  config: CacheConfig
): Promise<CacheWithMetadata<T> | null> {
  try {
    const metadataPath = getMetadataPath(cachePath)
    
    // Check if cache file exists
    try {
      await fs.access(cachePath)
    } catch {
      return null // Cache doesn't exist
    }

    // Load metadata
    let metadata: CacheMetadata | null = null
    try {
      const metadataRaw = await fs.readFile(metadataPath, 'utf-8')
      metadata = JSON.parse(metadataRaw) as CacheMetadata
      
      if (!validateCacheMetadata(metadata)) {
        throw new Error('Invalid cache metadata format')
      }
    } catch (error) {
      // If metadata doesn't exist or is invalid, treat as expired
      console.warn(`Cache metadata missing or invalid for ${cachePath}, treating as expired`)
      return null
    }

    // Check expiration
    if (isCacheExpired(metadata, config)) {
      return null // Cache expired
    }

    // Check staleness and warn
    if (isCacheStale(metadata, config)) {
      const age = getCacheAge(metadata)
      const maxStaleness = config.maxStalenessMs ?? DEFAULT_CONFIG.maxStalenessMs
      console.warn(
        `Cache is stale: ${cachePath} is ${Math.floor(age / (24 * 60 * 60 * 1000))} days old ` +
        `(max: ${Math.floor(maxStaleness / (24 * 60 * 60 * 1000))} days)`
      )
    }

    // Load cache data
    const dataRaw = await fs.readFile(cachePath, 'utf-8')
    const data = JSON.parse(dataRaw) as T

    return {
      data,
      metadata
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in cache file: ${cachePath}`)
    }
    throw error
  }
}

/**
 * Save cache with metadata
 */
export async function saveCacheWithMetadata<T>(
  cachePath: string,
  data: T,
  config: CacheConfig
): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(cachePath)
    await fs.mkdir(dir, { recursive: true })

    // Create metadata
    const recordCount = typeof data === 'object' && data !== null && !Array.isArray(data)
      ? Object.keys(data).length
      : undefined
    const metadata = createCacheMetadata(config, recordCount)

    // Save data and metadata
    await Promise.all([
      fs.writeFile(cachePath, JSON.stringify(data, null, 2)),
      fs.writeFile(getMetadataPath(cachePath), JSON.stringify(metadata, null, 2))
    ])
  } catch (error) {
    throw new Error(`Failed to save cache: ${cachePath}`, { cause: error })
  }
}

/**
 * Get metadata file path for a cache file
 */
function getMetadataPath(cachePath: string): string {
  return `${cachePath}.meta.json`
}

/**
 * Delete cache and its metadata
 */
export async function deleteCache(cachePath: string): Promise<void> {
  try {
    await Promise.all([
      fs.unlink(cachePath).catch(() => {}), // Ignore if doesn't exist
      fs.unlink(getMetadataPath(cachePath)).catch(() => {}) // Ignore if doesn't exist
    ])
  } catch (error) {
    throw new Error(`Failed to delete cache: ${cachePath}`, { cause: error })
  }
}

/**
 * Get cache freshness status
 */
export type CacheStatus = {
  exists: boolean
  expired: boolean
  stale: boolean
  ageMs: number | null
  expiresAt: string | null
}

export async function getCacheStatus(
  cachePath: string,
  config: CacheConfig
): Promise<CacheStatus> {
  try {
    const metadataPath = getMetadataPath(cachePath)
    
    // Check if cache exists
    try {
      await fs.access(cachePath)
    } catch {
      return {
        exists: false,
        expired: false,
        stale: false,
        ageMs: null,
        expiresAt: null
      }
    }

    // Load metadata
    try {
      const metadataRaw = await fs.readFile(metadataPath, 'utf-8')
      const metadata = JSON.parse(metadataRaw) as CacheMetadata
      
      if (!validateCacheMetadata(metadata)) {
        return {
          exists: true,
          expired: true,
          stale: true,
          ageMs: null,
          expiresAt: null
        }
      }

      const age = getCacheAge(metadata)
      const expired = isCacheExpired(metadata, config)
      const stale = isCacheStale(metadata, config)

      return {
        exists: true,
        expired,
        stale,
        ageMs: age,
        expiresAt: metadata.expiresAt
      }
    } catch {
      // Metadata missing or invalid
      return {
        exists: true,
        expired: true,
        stale: true,
        ageMs: null,
        expiresAt: null
      }
    }
  } catch (error) {
    return {
      exists: false,
      expired: false,
      stale: false,
      ageMs: null,
      expiresAt: null
    }
  }
}

