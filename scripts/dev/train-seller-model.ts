#!/usr/bin/env -S ts-node --esm
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  loadLatestModelWeights,
  persistModelWeights,
  prepareTrainingDataset,
  trainSellerGradientBoostingPlaceholder,
  trainSellerLogisticRegression
} from '../../lib/models/seller-training.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const dataset = prepareTrainingDataset()
  if (!dataset) {
    console.warn('Not enough labeled examples to train a seller model.')
    return
  }

  console.log(`Training dataset loaded. Train: ${dataset.train.length}, Validation: ${dataset.validation.length}`)

  const logisticModel = trainSellerLogisticRegression(dataset, {
    learningRate: 0.04,
    iterations: 1200,
    regularization: 0.0005
  })

  const gradientModel = trainSellerGradientBoostingPlaceholder(dataset)

  const candidates = [logisticModel, gradientModel].filter(
    (model): model is NonNullable<typeof model> => Boolean(model)
  )

  if (!candidates.length) {
    console.warn('Unable to produce model candidates.')
    return
  }

  const bestModel = candidates.reduce((best, current) => {
    if (!best) return current
    return current.metrics.f1 >= best.metrics.f1 ? current : best
  })

  await persistModelWeights(bestModel, { fileName: `${bestModel.algorithm}-latest.json` })

  const latest = await loadLatestModelWeights()

  console.log('Persisted seller model weights at:')
  console.log(
    `  ${path.resolve(
      __dirname,
      '..',
      '..',
      'predictions-data',
      'models',
      'seller-propensity',
      'latest.json'
    )}`
  )

  if (latest) {
    console.log(`Algorithm: ${latest.algorithm}`)
    console.log(
      `Metrics: accuracy=${latest.metrics.accuracy.toFixed(3)} precision=${latest.metrics.precision.toFixed(3)} recall=${latest.metrics.recall.toFixed(3)} f1=${latest.metrics.f1.toFixed(3)}`
    )
  }
}

void main()
