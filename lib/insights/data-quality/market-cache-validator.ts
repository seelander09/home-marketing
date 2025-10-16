import fs from 'node:fs/promises'
import path from 'node:path'

type CacheEvaluator = (payload: unknown) => CacheDatasetReport

export type CacheDatasetReport = {
  name: string
  path: string
  exists: boolean
  recordCount: number
  sampleKeys: string[]
  lastUpdatedSamples: string[]
}

export type MarketCacheQualityReport = {
  generatedAt: string
  datasets: CacheDatasetReport[]
  summary: {
    expectedDatasets: number
    availableDatasets: number
    missingDatasets: string[]
  }
}

async function readJsonIfExists(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as unknown
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function evaluateObjectDataset(name: string, filePath: string, payload: unknown): CacheDatasetReport {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      name,
      path: filePath,
      exists: true,
      recordCount: 0,
      sampleKeys: [],
      lastUpdatedSamples: []
    }
  }

  const entries = Object.entries(payload as Record<string, unknown>)
  const recordCount = entries.length
  const sampleKeys = entries.slice(0, 5).map(([key]) => key)
  const lastUpdatedSamples = entries
    .slice(0, 5)
    .map(([, value]) => {
      if (value && typeof value === 'object' && 'lastUpdated' in value) {
        const updated = (value as Record<string, unknown>).lastUpdated
        return typeof updated === 'string' ? updated : ''
      }
      return ''
    })
    .filter(Boolean)

  return {
    name,
    path: filePath,
    exists: true,
    recordCount,
    sampleKeys,
    lastUpdatedSamples
  }
}

function evaluateArrayDataset(name: string, filePath: string, payload: unknown): CacheDatasetReport {
  if (!Array.isArray(payload)) {
    return {
      name,
      path: filePath,
      exists: true,
      recordCount: 0,
      sampleKeys: [],
      lastUpdatedSamples: []
    }
  }

  const sampleKeys = payload.slice(0, 5).map((entry) => {
    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>
      return String(record.regionCode ?? record.regionName ?? record.id ?? '')
    }
    return ''
  })

  const lastUpdatedSamples = payload
    .slice(0, 5)
    .map((entry) => {
      if (entry && typeof entry === 'object' && 'lastUpdated' in entry) {
        const updated = (entry as Record<string, unknown>).lastUpdated
        return typeof updated === 'string' ? updated : ''
      }
      return ''
    })
    .filter(Boolean)

  return {
    name,
    path: filePath,
    exists: true,
    recordCount: payload.length,
    sampleKeys: sampleKeys.filter(Boolean),
    lastUpdatedSamples
  }
}

const DEFAULT_EVALUATORS = {
  object: evaluateObjectDataset,
  array: evaluateArrayDataset
} as const

type ExpectedDataset = {
  name: string
  path: string
  evaluator?: CacheEvaluator
  shape?: 'object' | 'array'
}

export async function evaluateMarketCaches(): Promise<MarketCacheQualityReport> {
  const root = process.cwd()
  const redfinCacheDir =
    process.env.REDFIN_CACHE_DIR ?? path.resolve(root, '..', 'redfin-data', 'cache')
  const censusCacheDir = path.resolve(root, '..', 'census-data', 'cache')
  const hudCacheDir = path.resolve(root, '..', 'hud-data', 'cache')
  const fredCacheDir = path.resolve(root, '..', 'fred-data', 'cache')

  const expectedDatasets: ExpectedDataset[] = [
    { name: 'redfin-state', path: path.join(redfinCacheDir, 'state.json'), shape: 'object' },
    { name: 'redfin-city', path: path.join(redfinCacheDir, 'city.json'), shape: 'object' },
    { name: 'redfin-zip', path: path.join(redfinCacheDir, 'zip.json'), shape: 'object' },
    { name: 'census-state', path: path.join(censusCacheDir, 'state.json'), shape: 'object' },
    { name: 'census-county', path: path.join(censusCacheDir, 'county.json'), shape: 'object' },
    { name: 'census-zip', path: path.join(censusCacheDir, 'zip.json'), shape: 'object' },
    { name: 'hud-state', path: path.join(hudCacheDir, 'state.json'), shape: 'object' },
    { name: 'hud-county', path: path.join(hudCacheDir, 'county.json'), shape: 'object' },
    { name: 'hud-metro', path: path.join(hudCacheDir, 'metro.json'), shape: 'object' },
    { name: 'fred-national', path: path.join(fredCacheDir, 'national.json'), shape: 'object' }
  ]

  const datasetReports: CacheDatasetReport[] = []
  const missingDatasets: string[] = []

  for (const dataset of expectedDatasets) {
    const payload = await readJsonIfExists(dataset.path)

    if (payload === null) {
      datasetReports.push({
        name: dataset.name,
        path: dataset.path,
        exists: false,
        recordCount: 0,
        sampleKeys: [],
        lastUpdatedSamples: []
      })
      missingDatasets.push(dataset.name)
      continue
    }

    const evaluator =
      dataset.evaluator ??
      DEFAULT_EVALUATORS[dataset.shape ?? (Array.isArray(payload) ? 'array' : 'object')]
    datasetReports.push(evaluator(dataset.name, dataset.path, payload))
  }

  const availableDatasets = datasetReports.filter((dataset) => dataset.exists).length

  return {
    generatedAt: new Date().toISOString(),
    datasets: datasetReports,
    summary: {
      expectedDatasets: expectedDatasets.length,
      availableDatasets,
      missingDatasets
    }
  }
}
