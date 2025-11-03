/**
 * Shared cache utilities
 * Common functionality for cache loading, saving, and validation
 */

import fs from 'fs/promises'
import path from 'path'
import type { CacheConfig } from './cache-manager'
import { loadCacheWithMetadata, saveCacheWithMetadata } from './cache-manager'

/**
 * Generic cache loader with TTL support
 */
export async function loadCacheFile<T>(
  filePath: string,
  config: CacheConfig
): Promise<T | null> {
  try {
    const result = await loadCacheWithMetadata<T>(filePath, config)
    return result?.data ?? null
  } catch (error) {
    // Fallback to legacy cache loading (no metadata)
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw) as T
      console.warn(`Loaded cache without metadata (legacy format): ${filePath}`)
      return parsed
    } catch (legacyError) {
      if (error instanceof Error && error.message.includes('Invalid JSON')) {
        throw error // Re-throw JSON errors
      }
      return null
    }
  }
}

/**
 * Generic cache saver with metadata
 */
export async function saveCacheFile<T>(
  filePath: string,
  data: T,
  config: CacheConfig
): Promise<void> {
  // Ensure directory exists
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })

  await saveCacheWithMetadata(filePath, data, config)
}

/**
 * Check if cache file exists
 */
export async function cacheExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Load cache with fallback to empty object
 */
export async function loadCacheWithFallback<T extends Record<string, unknown>>(
  filePath: string,
  config: CacheConfig
): Promise<T> {
  const data = await loadCacheFile<T>(filePath, config)
  return data ?? ({} as T)
}

/**
 * Batch load multiple cache files
 */
export async function loadMultipleCaches<T extends Record<string, unknown>>(
  filePaths: string[],
  config: CacheConfig
): Promise<Map<string, T>> {
  const results = await Promise.all(
    filePaths.map(async (filePath) => {
      const data = await loadCacheFile<T>(filePath, config)
      return [filePath, data] as [string, T | null]
    })
  )

  const cacheMap = new Map<string, T>()
  for (const [filePath, data] of results) {
    if (data) {
      cacheMap.set(filePath, data)
    }
  }

  return cacheMap
}

