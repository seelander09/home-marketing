import fs from 'node:fs/promises'
import path from 'node:path'

import { listAllPropertyOpportunities } from '@/lib/insights/properties'
import type { PropertyOpportunity } from '@/lib/insights/properties'

export type SellerModelAlgorithm = 'logistic-regression' | 'gradient-boosting-placeholder'

export type SellerModelWeights = {
  id: string
  algorithm: SellerModelAlgorithm
  coefficients: number[]
  intercept: number
  featureNames: string[]
  featureMeans: number[]
  featureStdDevs: number[]
  trainedAt: string
  trainingSize: number
  validationSize: number
  metrics: {
    accuracy: number
    precision: number
    recall: number
    f1: number
    logLoss: number
  }
  notes?: string
}

type TrainingExample = {
  features: number[]
  label: 0 | 1
}

type TrainingDataset = {
  train: TrainingExample[]
  validation: TrainingExample[]
  featureNames: string[]
}

type StandardizationStats = {
  means: number[]
  stdDevs: number[]
}

export type TrainingOptions = {
  learningRate?: number
  iterations?: number
  regularization?: number
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z))
}

function standardizeExamples(
  examples: TrainingExample[]
): { examples: TrainingExample[]; stats: StandardizationStats } {
  if (examples.length === 0) {
    return {
      examples,
      stats: { means: [], stdDevs: [] }
    }
  }

  const featureCount = examples[0]!.features.length
  const sums = Array(featureCount).fill(0)
  const squared = Array(featureCount).fill(0)

  for (const example of examples) {
    example.features.forEach((value, index) => {
      sums[index]! += value
      squared[index]! += value * value
    })
  }

  const means = sums.map((sum) => sum / examples.length)
  const stdDevs = squared.map((sumSq, index) => {
    const mean = means[index]!
    const variance = Math.max((sumSq / examples.length) - mean * mean, 1e-6)
    return Math.sqrt(variance)
  })

  const standardized = examples.map((example) => ({
    label: example.label,
    features: example.features.map((value, index) => (value - means[index]!) / stdDevs[index]!)
  }))

  return {
    examples: standardized,
    stats: { means, stdDevs }
  }
}

function computeLogLoss(examples: TrainingExample[], weights: number[], intercept: number) {
  let loss = 0
  for (const example of examples) {
    const z = weights.reduce((acc, weight, index) => acc + weight * example.features[index]!, intercept)
    const prediction = sigmoid(z)
    const epsilon = 1e-15
    loss -= example.label * Math.log(prediction + epsilon) + (1 - example.label) * Math.log(1 - prediction + epsilon)
  }
  return loss / examples.length
}

function trainLogisticRegressionInternal(
  dataset: TrainingDataset,
  options: TrainingOptions
): SellerModelWeights | null {
  if (!dataset.train.length) {
    return null
  }

  const learningRate = options.learningRate ?? 0.05
  const iterations = options.iterations ?? 1500
  const regularization = options.regularization ?? 0.001

  const { examples: standardizedTrain, stats } = standardizeExamples(dataset.train)
  const { examples: standardizedValidation } = standardizeExamples(dataset.validation)

  const featureCount = standardizedTrain[0]!.features.length
  const weights = Array(featureCount).fill(0)
  let intercept = 0

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const gradient = Array(featureCount).fill(0)
    let interceptGradient = 0

    for (const example of standardizedTrain) {
      const z =
        weights.reduce((acc, weight, index) => acc + weight * example.features[index]!, intercept)
      const prediction = sigmoid(z)
      const error = prediction - example.label

      interceptGradient += error
      for (let index = 0; index < featureCount; index += 1) {
        gradient[index]! += error * example.features[index]!
      }
    }

    intercept -= (learningRate / standardizedTrain.length) * interceptGradient

    for (let index = 0; index < featureCount; index += 1) {
      const grad = gradient[index]! / standardizedTrain.length + regularization * weights[index]!
      weights[index]! -= learningRate * grad
    }
  }

  const metrics = evaluateModel(standardizedValidation, weights, intercept)

  return {
    id: `seller-model-${Date.now()}`,
    algorithm: 'logistic-regression',
    coefficients: weights,
    intercept,
    featureNames: dataset.featureNames,
    featureMeans: stats.means,
    featureStdDevs: stats.stdDevs,
    trainedAt: new Date().toISOString(),
    trainingSize: dataset.train.length,
    validationSize: dataset.validation.length,
    metrics,
    notes: 'Gradient descent logistic regression baseline'
  }
}

function evaluateModel(examples: TrainingExample[], weights: number[], intercept: number) {
  if (!examples.length) {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      logLoss: 0
    }
  }

  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0
  const predictions: number[] = []

  for (const example of examples) {
    const z =
      weights.reduce((acc, weight, index) => acc + weight * example.features[index]!, intercept)
    const probability = sigmoid(z)
    const predictedLabel = probability >= 0.5 ? 1 : 0
    predictions.push(probability)

    if (predictedLabel === 1 && example.label === 1) tp += 1
    else if (predictedLabel === 1 && example.label === 0) fp += 1
    else if (predictedLabel === 0 && example.label === 0) tn += 1
    else fn += 1
  }

  const accuracy = (tp + tn) / examples.length
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)

  const logLoss = computeLogLoss(examples, weights, intercept)

  return {
    accuracy,
    precision,
    recall,
    f1,
    logLoss
  }
}

function shuffle<T>(array: T[]): T[] {
  const clone = array.slice()
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[clone[i], clone[j]] = [clone[j], clone[i]]
  }
  return clone
}

export function prepareTrainingDataset(): TrainingDataset | null {
  const properties = listAllPropertyOpportunities()

  const examples: TrainingExample[] = []
  let featureNames: string[] = []

  for (const property of properties) {
    const label = property.sellerOutcome
    if (label !== 0 && label !== 1) {
      continue
    }
    const features = property.sellerFeatures
    if (!features) {
      continue
    }

    if (!featureNames.length) {
      featureNames = features.featureNames
    }

    examples.push({
      features: features.values,
      label
    })
  }

  if (examples.length < 4) {
    return null
  }

  const shuffled = shuffle(examples)
  const splitIndex = Math.max(1, Math.floor(shuffled.length * 0.75))

  return {
    train: shuffled.slice(0, splitIndex),
    validation: shuffled.slice(splitIndex),
    featureNames
  }
}

export function trainSellerLogisticRegression(
  dataset: TrainingDataset,
  options: TrainingOptions = {}
): SellerModelWeights | null {
  return trainLogisticRegressionInternal(dataset, options)
}

export function trainSellerGradientBoostingPlaceholder(
  dataset: TrainingDataset
): SellerModelWeights | null {
  const baseline = trainLogisticRegressionInternal(dataset, { learningRate: 0.03, iterations: 800 })
  if (!baseline) {
    return null
  }
  return {
    ...baseline,
    id: baseline.id.replace('seller-model', 'seller-gb-placeholder'),
    algorithm: 'gradient-boosting-placeholder',
    notes:
      'Placeholder gradients using logistic baseline. Replace with real gradient boosting implementation.'
  }
}

export async function persistModelWeights(model: SellerModelWeights, options?: { fileName?: string }) {
  const targetDir = path.resolve(process.cwd(), 'predictions-data', 'models', 'seller-propensity')
  await fs.mkdir(targetDir, { recursive: true })

  const fileName = options?.fileName ?? `${model.algorithm}-${Date.now()}.json`
  const targetPath = path.join(targetDir, fileName)

  await fs.writeFile(targetPath, JSON.stringify(model, null, 2))

  const latestPath = path.join(targetDir, 'latest.json')
  await fs.writeFile(latestPath, JSON.stringify(model, null, 2))
}

export function projectFeaturesWithModel(
  property: PropertyOpportunity,
  model: SellerModelWeights
) {
  if (!property.sellerFeatures) {
    return null
  }

  const vector = property.sellerFeatures
  if (vector.featureNames.length !== model.featureNames.length) {
    return null
  }

  const standardized = vector.values.map(
    (value, index) => (value - model.featureMeans[index]!) / model.featureStdDevs[index]!
  )

  const z =
    model.coefficients.reduce(
      (acc, weight, index) => acc + weight * standardized[index]!,
      model.intercept
    )
  const probability = sigmoid(z)

  return {
    probability,
    modelId: model.id,
    algorithm: model.algorithm
  }
}

export async function loadLatestModelWeights(): Promise<SellerModelWeights | null> {
  const latestPath = path.resolve(
    process.cwd(),
    'predictions-data',
    'models',
    'seller-propensity',
    'latest.json'
  )

  try {
    const raw = await fs.readFile(latestPath, 'utf-8')
    const model = JSON.parse(raw) as SellerModelWeights
    return model
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}
