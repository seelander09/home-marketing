#!/usr/bin/env -S ts-node --esm
import fs from 'node:fs/promises'
import path from 'node:path'

import type { SellerPropensityRunLogEntry } from '@/lib/predictions/run-logger'

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function main() {
  const root = path.resolve(__dirname, '..', '..')
  const qualityPath = path.join(root, 'predictions-data', 'feature-store', 'seller', 'quality.json')
  const runLogPath = path.join(root, 'predictions-data', 'seller-propensity-run-log.json')

  const qualityMetrics = (await readJsonFile<Array<{ id: string; value: number }>>(qualityPath)) ?? []
  const runs = (await readJsonFile<SellerPropensityRunLogEntry[]>(runLogPath)) ?? []
  const latestRun = runs.length ? runs[runs.length - 1] : null

  // eslint-disable-next-line no-console
  console.log('===== Seller Propensity Health Check =====')

  if (qualityMetrics.length) {
    // eslint-disable-next-line no-console
    console.log('Feature store quality metrics:')
    qualityMetrics.forEach((metric) => {
      // eslint-disable-next-line no-console
      console.log(`  ${metric.id}: ${metric.value.toFixed(1)}%`)
    })
  } else {
    console.warn('Feature store quality metrics unavailable.')
  }

  if (latestRun) {
    // eslint-disable-next-line no-console
    console.log('\nMost recent scoring run:')
    // eslint-disable-next-line no-console
    console.log(
      `  Generated ${latestRun.generatedAt} · sampleSize=${latestRun.sampleSize} · avgScore=${latestRun.averageScore}`
    )
    // eslint-disable-next-line no-console
    console.log(
      `  Avg confidence ${latestRun.averageConfidence} · Model weight ${latestRun.attributionSummary.modelAverageWeight}`
    )
  } else {
    console.warn('No seller propensity run logs found.')
  }
}

void main().catch((error) => {
  console.error('Seller health check failed', error)
  process.exitCode = 1
})
