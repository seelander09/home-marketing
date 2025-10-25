import fs from 'node:fs/promises'
import path from 'node:path'

export type ModelRegistryEntry = {
  id: string
  algorithm: string
  trainedAt: string
  fileName: string
  metrics: {
    accuracy: number
    precision: number
    recall: number
    f1: number
    logLoss: number
    auc: number
  }
  hyperparameters?: Record<string, number | string>
}

const REGISTRY_PATH = path.resolve(
  process.cwd(),
  'predictions-data',
  'models',
  'seller-propensity',
  'registry.json'
)
const MAX_REGISTRY_ENTRIES = 50

async function readRegistryFile(): Promise<ModelRegistryEntry[]> {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as ModelRegistryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function loadModelRegistry(): Promise<ModelRegistryEntry[]> {
  return readRegistryFile()
}

export async function appendModelRegistryEntry(entry: ModelRegistryEntry) {
  const registry = await readRegistryFile()
  registry.push(entry)
  const sorted = registry.sort(
    (a, b) => new Date(b.trainedAt).getTime() - new Date(a.trainedAt).getTime()
  )
  const trimmed = sorted.slice(0, MAX_REGISTRY_ENTRIES)

  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true })
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(trimmed, null, 2), 'utf-8')
}
