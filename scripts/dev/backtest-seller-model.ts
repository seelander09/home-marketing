#!/usr/bin/env -S ts-node --esm
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { listAllPropertyOpportunities } from '../../lib/insights/properties'
import { scoreAndRankProperties } from '../../lib/predictions/seller-propensity'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type ConfusionMatrix = {
  threshold: number
  tp: number
  fp: number
  tn: number
  fn: number
  precision: number
  recall: number
  accuracy: number
  f1: number
}

function computeMetrics(label: number, prediction: number, threshold: number) {
  const predictedPositive = prediction >= threshold
  if (label === 1 && predictedPositive) return 'tp'
  if (label === 0 && predictedPositive) return 'fp'
  if (label === 0 && !predictedPositive) return 'tn'
  return 'fn'
}

function buildConfusionMatrix(scores: Array<{ label: number; score: number }>, threshold: number): ConfusionMatrix {
  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0

  for (const entry of scores) {
    const bucket = computeMetrics(entry.label, entry.score, threshold)
    if (bucket === 'tp') tp += 1
    if (bucket === 'fp') fp += 1
    if (bucket === 'tn') tn += 1
    if (bucket === 'fn') fn += 1
  }

  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
  const accuracy = (tp + tn) / Math.max(scores.length, 1)
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)

  return {
    threshold,
    tp,
    fp,
    tn,
    fn,
    precision,
    recall,
    accuracy,
    f1
  }
}

async function main() {
  const properties = listAllPropertyOpportunities().filter((property) =>
    property.sellerOutcome === 0 || property.sellerOutcome === 1
  )

  if (!properties.length) {
    console.warn('No labeled properties available for backtesting.')
    return
  }

  const analysis = await scoreAndRankProperties(properties)

  const labelLookup = new Map(properties.map((property) => [property.id, property.sellerOutcome!]))
  const scores = analysis.scores
    .map((score) => {
      const label = labelLookup.get(score.propertyId)
      if (label === undefined) {
        return null
      }
      const prediction = score.modelPrediction?.score ?? score.overallScore
      return { label, score: prediction }
    })
    .filter((entry): entry is { label: number; score: number } => Boolean(entry))

  const thresholds = [45, 55, 65, 75, 85]
  const matrices = thresholds.map((threshold) => buildConfusionMatrix(scores, threshold))

  const report = {
    generatedAt: new Date().toISOString(),
    totalExamples: scores.length,
    thresholds: matrices,
    modelMetadata: analysis.modelMetadata ?? null
  }

  const outputDir = path.resolve(__dirname, '..', '..', 'predictions-data')
  await fs.mkdir(outputDir, { recursive: true })
  const target = path.join(outputDir, 'seller-backtest.json')
  await fs.writeFile(target, JSON.stringify(report, null, 2))

  console.log(`Backtest report written to ${target}`)
}

void main()
