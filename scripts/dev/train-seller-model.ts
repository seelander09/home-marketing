#!/usr/bin/env -S ts-node --esm
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  loadLatestModelWeights,
  persistModelWeights,
  prepareTrainingDataset,
  trainSellerGradientBoosting,
  trainSellerLogisticRegression,
  type SellerModelWeights
} from '../../lib/models/seller-training'

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

  const gradientModel = trainSellerGradientBoosting(dataset, {
    learningRate: 0.18,
    iterations: 160,
    minSamplesLeaf: 2
  })

  const candidates = [logisticModel, gradientModel].filter(
    (model): model is NonNullable<typeof model> => Boolean(model)
  )

  if (!candidates.length) {
    console.warn('Unable to produce model candidates.')
    return
  }

  const printModelSummary = (label: string, model: SellerModelWeights) => {
    const metrics = model.metrics
    console.log(`\n${label}`)
    console.log(
      `  Metrics (val): accuracy=${metrics.accuracy.toFixed(3)} precision=${metrics.precision.toFixed(3)} recall=${metrics.recall.toFixed(3)} f1=${metrics.f1.toFixed(3)} auc=${metrics.auc.toFixed(3)}`
    )
    if (model.evaluation?.crossValidation) {
      const folds = model.evaluation.crossValidation.folds
      const averages = model.evaluation.crossValidation.scores.reduce(
        (acc, score) => ({
          accuracy: acc.accuracy + score.accuracy,
          precision: acc.precision + score.precision,
          recall: acc.recall + score.recall,
          f1: acc.f1 + score.f1,
          auc: acc.auc + score.auc
        }),
        { accuracy: 0, precision: 0, recall: 0, f1: 0, auc: 0 }
      )
      console.log(
        `  Cross-val (${folds} folds): f1=${(averages.f1 / folds).toFixed(3)} auc=${(averages.auc / folds).toFixed(3)}`
      )
    }
    if (model.evaluation?.biasAudit?.entries?.length) {
      const topEntry = model.evaluation.biasAudit.entries.reduce((prev, current) =>
        Math.abs(current.lift) > Math.abs(prev.lift) ? current : prev
      )
      console.log(
        `  Bias audit: largest lift ${topEntry.field}/${topEntry.group} => ${(topEntry.lift * 100).toFixed(1)}%`
      )
    }
  }

  candidates.forEach((model) =>
    printModelSummary(model.algorithm === 'logistic-regression' ? 'Logistic baseline' : 'Gradient boosting', model)
  )

  const bestModel = candidates.reduce((best, current) => {
    if (!best) return current
    if (current.metrics.auc > best.metrics.auc + 0.005) {
      return current
    }
    if (best.metrics.auc > current.metrics.auc + 0.005) {
      return best
    }
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
      `Metrics: accuracy=${latest.metrics.accuracy.toFixed(3)} precision=${latest.metrics.precision.toFixed(3)} recall=${latest.metrics.recall.toFixed(3)} f1=${latest.metrics.f1.toFixed(3)} auc=${latest.metrics.auc.toFixed(3)}`
    )
    if (latest.evaluation?.biasAudit?.entries?.length) {
      console.log('Bias audit entries persisted:', latest.evaluation.biasAudit.entries.length)
    }
  }
}

void main()
