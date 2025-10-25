import fs from 'node:fs/promises'
import path from 'node:path'

import { listAllPropertyOpportunities } from '@/lib/insights/properties'
import type { PropertyOpportunity } from '@/lib/insights/properties'
import { appendModelRegistryEntry } from '@/lib/models/registry'

export type SellerModelAlgorithm = 'logistic-regression' | 'gradient-boosting'

type ClassificationMetrics = {
  accuracy: number
  precision: number
  recall: number
  f1: number
  logLoss: number
  auc: number
}

type LogisticModelParameters = {
  type: 'logistic-regression'
  coefficients: number[]
  intercept: number
}

type GradientBoostingTree = {
  featureIndex: number
  threshold: number
  leftValue: number
  rightValue: number
}

type GradientBoostingParameters = {
  type: 'gradient-boosting'
  baseScore: number
  learningRate: number
  trees: GradientBoostingTree[]
}

type CrossValidationResult = {
  folds: number
  scores: ClassificationMetrics[]
}

type BiasAuditEntry = {
  field: string
  group: string
  sampleSize: number
  positiveRate: number
  lift: number
}

type BiasAuditReport = {
  monitoredFields: string[]
  entries: BiasAuditEntry[]
}

export type SellerModelWeights = {
  id: string
  algorithm: SellerModelAlgorithm
  model: LogisticModelParameters | GradientBoostingParameters
  featureNames: string[]
  featureMeans: number[]
  featureStdDevs: number[]
  trainedAt: string
  trainingSize: number
  validationSize: number
  metrics: ClassificationMetrics
  hyperparameters?: Record<string, number | string>
  evaluation?: {
    crossValidation?: CrossValidationResult
    biasAudit?: BiasAuditReport
  }
  notes?: string
}

type TrainingExample = {
  propertyId: string
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
  minSamplesLeaf?: number
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z))
}

function standardizeExamples(
  examples: TrainingExample[]
): { examples: TrainingExample[]; stats: StandardizationStats } {
  if (!examples.length) {
    return {
      examples: [],
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
    const variance = Math.max(sumSq / examples.length - mean * mean, 1e-6)
    return Math.sqrt(variance)
  })

  const standardized = examples.map((example) => ({
    propertyId: example.propertyId,
    label: example.label,
    features: example.features.map((value, index) => (value - means[index]!) / stdDevs[index]!)
  }))

  return {
    examples: standardized,
    stats: { means, stdDevs }
  }
}

function standardizeVector(values: number[], stats: StandardizationStats): number[] {
  return values.map((value, index) => (value - stats.means[index]!) / stats.stdDevs[index]!)
}

function applyStandardization(
  examples: TrainingExample[],
  stats: StandardizationStats
): TrainingExample[] {
  return examples.map((example) => ({
    propertyId: example.propertyId,
    label: example.label,
    features: standardizeVector(example.features, stats)
  }))
}

function computeLogLossFromProbabilities(
  examples: TrainingExample[],
  probabilities: number[]
) {
  const epsilon = 1e-15
  let loss = 0
  for (let index = 0; index < examples.length; index += 1) {
    const label = examples[index]!.label
    const probability = Math.min(Math.max(probabilities[index]!, epsilon), 1 - epsilon)
    loss -= label * Math.log(probability) + (1 - label) * Math.log(1 - probability)
  }
  return loss / Math.max(1, examples.length)
}

function computeAuc(examples: TrainingExample[], probabilities: number[]) {
  const positives: number[] = []
  const negatives: number[] = []

  for (let index = 0; index < examples.length; index += 1) {
    if (examples[index]!.label === 1) {
      positives.push(probabilities[index]!)
    } else {
      negatives.push(probabilities[index]!)
    }
  }

  if (!positives.length || !negatives.length) {
    return 0.5
  }

  let better = 0
  let ties = 0

  for (const pos of positives) {
    for (const neg of negatives) {
      if (pos > neg) {
        better += 1
      } else if (pos === neg) {
        ties += 1
      }
    }
  }

  return (better + ties * 0.5) / (positives.length * negatives.length)
}

function computeClassificationMetrics(
  examples: TrainingExample[],
  probabilities: number[],
  threshold = 0.5
): ClassificationMetrics {
  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0

  for (let index = 0; index < examples.length; index += 1) {
    const label = examples[index]!.label
    const prediction = probabilities[index]! >= threshold ? 1 : 0

    if (prediction === 1 && label === 1) {
      tp += 1
    } else if (prediction === 1 && label === 0) {
      fp += 1
    } else if (prediction === 0 && label === 0) {
      tn += 1
    } else {
      fn += 1
    }
  }

  const total = Math.max(1, examples.length)
  const accuracy = (tp + tn) / total
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
  const logLoss = computeLogLossFromProbabilities(examples, probabilities)
  const auc = computeAuc(examples, probabilities)

  const round = (value: number) => Math.round(value * 1000) / 1000

  return {
    accuracy: round(accuracy),
    precision: round(precision),
    recall: round(recall),
    f1: round(f1),
    logLoss: round(logLoss),
    auc: round(auc)
  }
}

function predictTree(tree: GradientBoostingTree, features: number[]) {
  return features[tree.featureIndex]! <= tree.threshold ? tree.leftValue : tree.rightValue
}

function predictProbabilityFromStandardized(
  model: SellerModelWeights,
  standardizedFeatures: number[]
) {
  if (model.model.type === 'logistic-regression') {
    const { coefficients, intercept } = model.model
    const logit = coefficients.reduce(
      (acc, coefficient, index) => acc + coefficient * standardizedFeatures[index]!,
      intercept
    )
    return sigmoid(logit)
  }

  const { baseScore, learningRate, trees } = model.model
  let logit = baseScore
  for (const tree of trees) {
    logit += learningRate * predictTree(tree, standardizedFeatures)
  }
  return sigmoid(logit)
}

function predictProbabilityFromFeatures(model: SellerModelWeights, features: number[]) {
  const standardized = standardizeVector(features, {
    means: model.featureMeans,
    stdDevs: model.featureStdDevs
  })
  return predictProbabilityFromStandardized(model, standardized)
}

function fitDecisionStump(
  examples: TrainingExample[],
  residuals: number[],
  minSamplesLeaf: number
): GradientBoostingTree | null {
  if (!examples.length) {
    return null
  }

  const featureCount = examples[0]!.features.length
  let bestFeature = -1
  let bestThreshold = 0
  let bestLeft = 0
  let bestRight = 0
  let bestError = Number.POSITIVE_INFINITY

  for (let featureIndex = 0; featureIndex < featureCount; featureIndex += 1) {
    const pairs = examples.map((example, index) => ({
      feature: example.features[featureIndex]!,
      residual: residuals[index]!
    }))

    pairs.sort((a, b) => a.feature - b.feature)

    const prefixSum: number[] = []
    const prefixSumSq: number[] = []

    for (let i = 0; i < pairs.length; i += 1) {
      const previousSum = i === 0 ? 0 : prefixSum[i - 1]!
      const previousSumSq = i === 0 ? 0 : prefixSumSq[i - 1]!
      prefixSum[i] = previousSum + pairs[i]!.residual
      prefixSumSq[i] = previousSumSq + pairs[i]!.residual * pairs[i]!.residual
    }

    for (
      let splitIndex = minSamplesLeaf - 1;
      splitIndex < pairs.length - minSamplesLeaf;
      splitIndex += 1
    ) {
      const currentValue = pairs[splitIndex]!.feature
      const nextValue = pairs[splitIndex + 1]!.feature
      if (currentValue === nextValue) {
        continue
      }

      const leftCount = splitIndex + 1
      const rightCount = pairs.length - leftCount
      if (leftCount < minSamplesLeaf || rightCount < minSamplesLeaf) {
        continue
      }

      const leftSum = prefixSum[splitIndex]!
      const leftSumSq = prefixSumSq[splitIndex]!
      const rightSum = prefixSum[pairs.length - 1]! - leftSum
      const rightSumSq = prefixSumSq[pairs.length - 1]! - leftSumSq

      const leftMean = leftSum / leftCount
      const rightMean = rightSum / rightCount

      const leftError = leftSumSq - (leftSum * leftSum) / leftCount
      const rightError = rightSumSq - (rightSum * rightSum) / rightCount
      const totalError = leftError + rightError

      if (totalError < bestError) {
        bestError = totalError
        bestFeature = featureIndex
        bestThreshold = (currentValue + nextValue) / 2
        bestLeft = leftMean
        bestRight = rightMean
      }
    }
  }

  if (bestFeature === -1) {
    return null
  }

  return {
    featureIndex: bestFeature,
    threshold: bestThreshold,
    leftValue: bestLeft,
    rightValue: bestRight
  }
}

function performCrossValidation(
  examples: TrainingExample[],
  featureNames: string[],
  folds: number,
  trainer: (dataset: TrainingDataset) => SellerModelWeights | null
): CrossValidationResult | undefined {
  if (examples.length < 6) {
    return undefined
  }

  const shuffled = shuffle(examples.slice())
  const effectiveFolds = Math.max(2, Math.min(folds, Math.floor(shuffled.length / 2)))
  const foldSize = Math.floor(shuffled.length / effectiveFolds)
  if (foldSize === 0) {
    return undefined
  }

  const scores: ClassificationMetrics[] = []

  for (let foldIndex = 0; foldIndex < effectiveFolds; foldIndex += 1) {
    const start = foldIndex * foldSize
    const end =
      foldIndex === effectiveFolds - 1 ? shuffled.length : Math.min(shuffled.length, start + foldSize)
    const validation = shuffled.slice(start, end)
    const train = [...shuffled.slice(0, start), ...shuffled.slice(end)]

    if (!validation.length || !train.length) {
      continue
    }

    const model = trainer({ train, validation, featureNames })
    if (model) {
      scores.push(model.metrics)
    }
  }

  if (!scores.length) {
    return undefined
  }

  return {
    folds: scores.length,
    scores
  }
}

function runBiasAudit(model: SellerModelWeights, examples: TrainingExample[]): BiasAuditReport | undefined {
  if (!examples.length) {
    return undefined
  }

  const properties = listAllPropertyOpportunities()
  const propertyIndex = new Map(properties.map((property) => [property.id, property]))
  const monitoredFields: Array<keyof PropertyOpportunity> = [
    'ownerType',
    'priority',
    'householdIncomeBand'
  ]

  const probabilities = examples.map((example) =>
    predictProbabilityFromFeatures(model, example.features)
  )
  const globalRate =
    probabilities.reduce((acc, value) => acc + value, 0) / Math.max(1, probabilities.length)

  if (globalRate === 0) {
    return undefined
  }

  const entries: BiasAuditEntry[] = []

  for (const field of monitoredFields) {
    const buckets = new Map<string, { total: number; count: number }>()

    examples.forEach((example, index) => {
      const property = propertyIndex.get(example.propertyId)
      const rawValue = property?.[field]
      const group =
        rawValue === undefined || rawValue === null
          ? 'unknown'
          : typeof rawValue === 'string'
            ? rawValue
            : String(rawValue)

      const bucket = buckets.get(group) ?? { total: 0, count: 0 }
      bucket.total += probabilities[index]!
      bucket.count += 1
      buckets.set(group, bucket)
    })

    for (const [group, bucket] of buckets.entries()) {
      if (!bucket.count) {
        continue
      }
      const positiveRate = bucket.total / bucket.count
      const lift = positiveRate / globalRate - 1
      entries.push({
        field: String(field),
        group,
        sampleSize: bucket.count,
        positiveRate: Math.round(positiveRate * 1000) / 1000,
        lift: Math.round(lift * 1000) / 1000
      })
    }
  }

  if (!entries.length) {
    return undefined
  }

  return {
    monitoredFields: monitoredFields.map((field) => String(field)),
    entries
  }
}

function trainLogisticRegressionInternal(
  dataset: TrainingDataset,
  options: TrainingOptions,
  context?: { skipCrossValidation?: boolean }
): SellerModelWeights | null {
  if (!dataset.train.length || !dataset.validation.length) {
    return null
  }

  const learningRate = options.learningRate ?? 0.05
  const iterations = options.iterations ?? 1500
  const regularization = options.regularization ?? 0.0005

  const { examples: standardizedTrain, stats } = standardizeExamples(dataset.train)
  const standardizedValidation = applyStandardization(dataset.validation, stats)

  const featureCount = standardizedTrain[0]!.features.length
  const weights = Array(featureCount).fill(0)
  let intercept = 0

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const gradient = Array(featureCount).fill(0)
    let interceptGradient = 0

    for (const example of standardizedTrain) {
      const logit = weights.reduce(
        (acc, weight, index) => acc + weight * example.features[index]!,
        intercept
      )
      const prediction = sigmoid(logit)
      const error = prediction - example.label

      interceptGradient += error
      for (let index = 0; index < featureCount; index += 1) {
        gradient[index]! += error * example.features[index]!
      }
    }

    intercept -= (learningRate / standardizedTrain.length) * interceptGradient

    for (let index = 0; index < featureCount; index += 1) {
      const grad =
        gradient[index]! / standardizedTrain.length + regularization * weights[index]!
      weights[index]! -= learningRate * grad
    }
  }

  const validationProbabilities = standardizedValidation.map((example) => {
    const logit = weights.reduce(
      (acc, weight, index) => acc + weight * example.features[index]!,
      intercept
    )
    return sigmoid(logit)
  })

  const metrics = computeClassificationMetrics(standardizedValidation, validationProbabilities)

  const model: SellerModelWeights = {
    id: `seller-model-logit-${Date.now()}`,
    algorithm: 'logistic-regression',
    model: {
      type: 'logistic-regression',
      coefficients: weights,
      intercept
    },
    featureNames: dataset.featureNames,
    featureMeans: stats.means,
    featureStdDevs: stats.stdDevs,
    trainedAt: new Date().toISOString(),
    trainingSize: dataset.train.length,
    validationSize: dataset.validation.length,
    metrics,
    hyperparameters: {
      learningRate,
      iterations,
      regularization
    },
    notes: 'Gradient descent logistic regression'
  }

  if (!context?.skipCrossValidation) {
    const combined = [...dataset.train, ...dataset.validation]
    const crossValidation = performCrossValidation(
      combined,
      dataset.featureNames,
      3,
      (foldDataset) =>
        trainLogisticRegressionInternal(foldDataset, options, { skipCrossValidation: true })
    )
    const biasAudit = runBiasAudit(model, combined)
    if (crossValidation || biasAudit) {
      model.evaluation = {
        ...(crossValidation ? { crossValidation } : {}),
        ...(biasAudit ? { biasAudit } : {})
      }
    }
  }

  return model
}

function trainGradientBoostingInternal(
  dataset: TrainingDataset,
  options: TrainingOptions,
  context?: { skipCrossValidation?: boolean }
): SellerModelWeights | null {
  if (!dataset.train.length || !dataset.validation.length) {
    return null
  }

  const learningRate = options.learningRate ?? 0.15
  const maxIterations = options.iterations ?? 120
  const minSamplesLeaf = options.minSamplesLeaf ?? 2

  const { examples: standardizedTrain, stats } = standardizeExamples(dataset.train)
  const standardizedValidation = applyStandardization(dataset.validation, stats)

  const featureCount = standardizedTrain[0]?.features.length ?? 0
  if (!featureCount) {
    return null
  }

  const positiveCount = standardizedTrain.filter((example) => example.label === 1).length
  const baseProbability = Math.min(
    Math.max(positiveCount / standardizedTrain.length, 1e-5),
    1 - 1e-5
  )
  const baseScore = Math.log(baseProbability / (1 - baseProbability))

  const trees: GradientBoostingTree[] = []
  const logits = Array(standardizedTrain.length).fill(baseScore)

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const residuals = standardizedTrain.map((example, index) => {
      const probability = sigmoid(logits[index]!)
      return example.label - probability
    })

    const tree = fitDecisionStump(standardizedTrain, residuals, minSamplesLeaf)
    if (!tree) {
      break
    }

    trees.push(tree)

    standardizedTrain.forEach((example, index) => {
      logits[index]! += learningRate * predictTree(tree, example.features)
    })
  }

  const validationProbabilities = standardizedValidation.map((example) => {
    let logit = baseScore
    for (const tree of trees) {
      logit += learningRate * predictTree(tree, example.features)
    }
    return sigmoid(logit)
  })

  const metrics = computeClassificationMetrics(standardizedValidation, validationProbabilities)

  const model: SellerModelWeights = {
    id: `seller-model-gbm-${Date.now()}`,
    algorithm: 'gradient-boosting',
    model: {
      type: 'gradient-boosting',
      baseScore,
      learningRate,
      trees
    },
    featureNames: dataset.featureNames,
    featureMeans: stats.means,
    featureStdDevs: stats.stdDevs,
    trainedAt: new Date().toISOString(),
    trainingSize: dataset.train.length,
    validationSize: dataset.validation.length,
    metrics,
    hyperparameters: {
      learningRate,
      iterations: trees.length,
      minSamplesLeaf
    },
    notes: 'Gradient boosted decision stumps'
  }

  if (!context?.skipCrossValidation) {
    const combined = [...dataset.train, ...dataset.validation]
    const crossValidation = performCrossValidation(
      combined,
      dataset.featureNames,
      3,
      (foldDataset) =>
        trainGradientBoostingInternal(foldDataset, options, { skipCrossValidation: true })
    )
    const biasAudit = runBiasAudit(model, combined)
    if (crossValidation || biasAudit) {
      model.evaluation = {
        ...(crossValidation ? { crossValidation } : {}),
        ...(biasAudit ? { biasAudit } : {})
      }
    }
  }

  return model
}

export function trainSellerLogisticRegression(
  dataset: TrainingDataset,
  options: TrainingOptions = {}
): SellerModelWeights | null {
  return trainLogisticRegressionInternal(dataset, options)
}

export function trainSellerGradientBoosting(
  dataset: TrainingDataset,
  options: TrainingOptions = {}
): SellerModelWeights | null {
  return trainGradientBoostingInternal(dataset, options)
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
      propertyId: property.id,
      features: features.values,
      label
    })
  }

  if (examples.length < 6) {
    return null
  }

  const shuffled = shuffle(examples)
  const splitIndex = Math.min(shuffled.length - 1, Math.max(1, Math.floor(shuffled.length * 0.8)))

  return {
    train: shuffled.slice(0, splitIndex),
    validation: shuffled.slice(splitIndex),
    featureNames
  }
}

function serializeModelForPersistence(model: SellerModelWeights) {
  if (model.model.type === 'logistic-regression') {
    return {
      ...model,
      coefficients: model.model.coefficients,
      intercept: model.model.intercept
    }
  }
  return model
}

export async function persistModelWeights(
  model: SellerModelWeights,
  options?: { fileName?: string }
) {
  const targetDir = path.resolve(process.cwd(), 'predictions-data', 'models', 'seller-propensity')
  await fs.mkdir(targetDir, { recursive: true })

  const fileName = options?.fileName ?? `${model.algorithm}-${Date.now()}.json`
  const targetPath = path.join(targetDir, fileName)

  const serialized = serializeModelForPersistence(model)
  await fs.writeFile(targetPath, JSON.stringify(serialized, null, 2), 'utf-8')

  const latestPath = path.join(targetDir, 'latest.json')
  await fs.writeFile(latestPath, JSON.stringify(serialized, null, 2), 'utf-8')

  await appendModelRegistryEntry({
    id: model.id,
    algorithm: model.algorithm,
    trainedAt: model.trainedAt,
    fileName,
    metrics: model.metrics,
    hyperparameters: model.hyperparameters
  })
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

  const probability = predictProbabilityFromFeatures(model, vector.values)

  return {
    probability,
    modelId: model.id,
    algorithm: model.algorithm
  }
}

function normalizeModelWeights(raw: any): SellerModelWeights {
  const algorithm: SellerModelAlgorithm =
    raw.algorithm === 'gradient-boosting' ? 'gradient-boosting' : 'logistic-regression'

  let modelParameters: LogisticModelParameters | GradientBoostingParameters
  if (raw.model?.type === 'gradient-boosting' || algorithm === 'gradient-boosting') {
    const trees = (raw.model?.trees ?? raw.trees ?? []).map((tree: any) => ({
      featureIndex: tree.featureIndex ?? 0,
      threshold: tree.threshold ?? 0,
      leftValue: tree.leftValue ?? 0,
      rightValue: tree.rightValue ?? 0
    }))
    modelParameters = {
      type: 'gradient-boosting',
      baseScore: raw.model?.baseScore ?? raw.baseScore ?? 0,
      learningRate: raw.model?.learningRate ?? raw.learningRate ?? 0.1,
      trees
    }
  } else {
    const coefficients =
      raw.model?.coefficients ?? raw.coefficients ?? []
    const intercept = raw.model?.intercept ?? raw.intercept ?? 0
    modelParameters = {
      type: 'logistic-regression',
      coefficients,
      intercept
    }
  }

  const metrics = raw.metrics ?? {}
  const ensureMetric = (key: keyof ClassificationMetrics) =>
    typeof metrics[key] === 'number' ? metrics[key] : 0

  const evaluation = raw.evaluation as SellerModelWeights['evaluation'] | undefined

  return {
    id: raw.id ?? `seller-model-${Date.now()}`,
    algorithm: raw.algorithm === 'gradient-boosting-placeholder' ? 'logistic-regression' : algorithm,
    model: modelParameters,
    featureNames: raw.featureNames ?? [],
    featureMeans: raw.featureMeans ?? [],
    featureStdDevs: raw.featureStdDevs ?? [],
    trainedAt: raw.trainedAt ?? new Date().toISOString(),
    trainingSize: raw.trainingSize ?? 0,
    validationSize: raw.validationSize ?? 0,
    metrics: {
      accuracy: ensureMetric('accuracy'),
      precision: ensureMetric('precision'),
      recall: ensureMetric('recall'),
      f1: ensureMetric('f1'),
      logLoss: ensureMetric('logLoss'),
      auc: ensureMetric('auc')
    },
    hyperparameters: raw.hyperparameters,
    evaluation,
    notes: raw.notes
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
    const parsed = JSON.parse(raw)
    return normalizeModelWeights(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function shuffle<T>(array: T[]): T[] {
  const copy = array.slice()
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
  }
  return copy
}
