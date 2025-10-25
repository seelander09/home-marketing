#!/usr/bin/env -S ts-node --esm
import path from 'node:path'

import properties from '@/content/mock-data/realie-properties.json'
import { loadIngestionBundle } from '@/lib/data-pipeline/loaders'
import { buildSellerFeatureStoreSnapshot } from '@/lib/data-pipeline/feature-store'
import { appendSellerPropensityRunLog } from '@/lib/predictions/run-logger'
import {
  persistModelWeights,
  prepareTrainingDataset,
  trainSellerGradientBoosting,
  trainSellerLogisticRegression
} from '@/lib/models/seller-training'
import { scoreAllCachedPropertyOpportunities } from '@/lib/predictions/seller-propensity'

const ROOT = path.resolve(__dirname, '..', '..')

async function refreshFeatureStore() {
  const transactionsPath = path.join(ROOT, 'content/mock-data/property-transactions.json')
  const listingsPath = path.join(ROOT, 'content/mock-data/property-listings.json')
  const engagementPath = path.join(ROOT, 'content/mock-data/property-engagement.json')

  const bundle = await loadIngestionBundle({
    transactionsPath,
    listingsPath,
    engagementPath
  })

  const propertyIds = (properties as Array<{ id: string }>).map((property) => property.id)

  const snapshot = buildSellerFeatureStoreSnapshot({
    propertyIds,
    bundle,
    sources: {
      transactionsVersion: transactionsPath,
      listingsVersion: listingsPath,
      engagementVersion: engagementPath
    }
  })

  const outputDir = path.join(ROOT, 'predictions-data', 'feature-store', 'seller')
  await persistJson(path.join(outputDir, `snapshot-${snapshot.generatedAt.replace(/[:.]/g, '-')}.json`), snapshot)
  await persistJson(path.join(outputDir, 'latest.json'), snapshot)
  await persistJson(path.join(outputDir, 'quality.json'), snapshot.qualityMetrics)

  return snapshot
}

async function persistJson(filePath: string, value: unknown) {
  const fs = await import('node:fs/promises')
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

async function trainAndPersistModel() {
  const dataset = prepareTrainingDataset()
  if (!dataset) {
    console.warn('Nightly run: insufficient labeled data to train model.')
    return null
  }

  const logistic = trainSellerLogisticRegression(dataset, {
    learningRate: 0.04,
    iterations: 1200,
    regularization: 0.0005
  })

  const gradient = trainSellerGradientBoosting(dataset, {
    learningRate: 0.18,
    iterations: 160,
    minSamplesLeaf: 2
  })

  const candidates = [gradient, logistic].filter(
    (model): model is NonNullable<typeof model> => Boolean(model)
  )

  if (!candidates.length) {
    console.warn('Nightly run: unable to train models.')
    return null
  }

  const bestModel = candidates.reduce((best, current) => {
    if (!best) return current
    if (current.metrics.auc > best.metrics.auc + 0.005) return current
    if (best.metrics.auc > current.metrics.auc + 0.005) return best
    return current.metrics.f1 >= best.metrics.f1 ? current : best
  })

  await persistModelWeights(bestModel, { fileName: `${bestModel.algorithm}-nightly.json` })
  return bestModel
}

async function main() {
  console.log('Nightly seller propensity refresh started.')
  const featureStore = await refreshFeatureStore()
  console.log('Feature store snapshot generated:', featureStore.recordCount)

  const model = await trainAndPersistModel()
  if (model) {
    console.log(
      `Model persisted (${model.algorithm}) AUC=${model.metrics.auc} F1=${model.metrics.f1}`
    )
  }

  const analysis = await scoreAllCachedPropertyOpportunities({ limit: 200 })
  await appendSellerPropensityRunLog(analysis)
  console.log('Seller propensity analysis logged. Sample size:', analysis.sampleSize)
  console.log('Nightly seller propensity refresh completed.')
}

void main().catch((error) => {
  console.error('Nightly seller propensity refresh failed', error)
  process.exitCode = 1
})
