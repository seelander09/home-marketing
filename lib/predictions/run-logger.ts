import fs from 'fs/promises'
import path from 'path'

import {
  SellerPropensityAnalysis,
  SellerPropensityFilters
} from '@/lib/predictions/seller-propensity'

const RUN_LOG_DIR = path.resolve(process.cwd(), 'predictions-data')
const RUN_LOG_FILE = path.join(RUN_LOG_DIR, 'seller-propensity-run-log.json')
const MAX_RUN_HISTORY = 50

export type SellerPropensityRunLogEntry = {
  generatedAt: string
  sampleSize: number
  propertyIds: string[]
  filters?: SellerPropensityFilters
  limit?: number
  averageScore: number
  medianScore: number
  scoreRange: {
    min: number
    max: number
  }
  averageConfidence: number
  componentWeights: Record<string, number>
  modelMetadata?: SellerPropensityAnalysis['modelMetadata']
}

async function ensureLogDirectory() {
  await fs.mkdir(RUN_LOG_DIR, { recursive: true })
}

async function readExistingLog(): Promise<SellerPropensityRunLogEntry[]> {
  try {
    const raw = await fs.readFile(RUN_LOG_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as SellerPropensityRunLogEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function appendSellerPropensityRunLog(
  analysis: SellerPropensityAnalysis
): Promise<SellerPropensityRunLogEntry> {
  const entry: SellerPropensityRunLogEntry = {
    generatedAt: analysis.generatedAt,
    sampleSize: analysis.sampleSize,
    propertyIds: analysis.inputs.propertyIds,
    filters: analysis.inputs.filters,
    limit: analysis.inputs.limit,
    averageScore: analysis.summary.averageScore,
    medianScore: analysis.summary.medianScore,
    scoreRange: analysis.summary.scoreRange,
    averageConfidence: analysis.summary.averageConfidence,
    componentWeights: analysis.componentWeights,
    modelMetadata: analysis.modelMetadata
  }

  await ensureLogDirectory()
  const history = await readExistingLog()
  history.push(entry)

  const trimmedHistory =
    history.length > MAX_RUN_HISTORY ? history.slice(history.length - MAX_RUN_HISTORY) : history

  await fs.writeFile(RUN_LOG_FILE, JSON.stringify(trimmedHistory, null, 2))

  return entry
}
