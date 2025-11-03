/**
 * Data source configuration
 * Centralized configuration for all external data sources
 */

import path from 'path'

export type DataSourceConfig = {
  name: string
  apiKey?: string
  apiBase: string
  cacheDir: string
  ttlMs: number
  maxStalenessMs: number
  version: string
  enabled: boolean
}

export const CENSUS_CONFIG: DataSourceConfig = {
  name: 'Census ACS',
  apiBase: 'https://api.census.gov/data',
  cacheDir: process.env.CENSUS_CACHE_DIR || path.resolve(process.cwd(), '..', 'census-data', 'cache'),
  ttlMs: 365 * 24 * 60 * 60 * 1000, // 1 year (annual 5-year estimates)
  maxStalenessMs: 400 * 24 * 60 * 60 * 1000, // ~13 months
  version: '1.0.0',
  enabled: true,
  // API key loaded from environment
  get apiKey() {
    return process.env.CENSUS_API_KEY
  }
}

export const FRED_CONFIG: DataSourceConfig = {
  name: 'FRED',
  apiBase: 'https://api.stlouisfed.org/fred',
  cacheDir: process.env.FRED_CACHE_DIR || path.resolve(process.cwd(), '..', 'fred-data', 'cache'),
  ttlMs: 24 * 60 * 60 * 1000, // 1 day
  maxStalenessMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  version: '1.0.0',
  enabled: true,
  get apiKey() {
    return process.env.FRED_API_KEY
  }
}

export const HUD_CONFIG: DataSourceConfig = {
  name: 'HUD',
  apiBase: 'https://www.huduser.gov/portal/api',
  cacheDir: process.env.HUD_CACHE_DIR || path.resolve(process.cwd(), '..', 'hud-data', 'cache'),
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxStalenessMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  version: '1.0.0',
  enabled: true,
  get apiKey() {
    return process.env.HUD_API_KEY
  }
}

export const REDFIN_CONFIG: DataSourceConfig = {
  name: 'Redfin',
  apiBase: '', // Redfin uses cached data from TSV files
  cacheDir: process.env.REDFIN_CACHE_DIR || path.resolve(process.cwd(), '..', 'redfin-data', 'cache'),
  ttlMs: 30 * 24 * 60 * 60 * 1000, // 30 days (monthly updates)
  maxStalenessMs: 60 * 24 * 60 * 60 * 1000, // 60 days
  version: '1.0.0',
  enabled: true
}

// Census ACS year - should be latest available 5-year estimate
export const CENSUS_ACS_YEAR = process.env.CENSUS_ACS_YEAR || '2022'

