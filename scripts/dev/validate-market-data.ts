#!/usr/bin/env -S ts-node --esm
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { evaluateMarketCaches } from '../../lib/insights/data-quality/market-cache-validator.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const projectRoot = path.resolve(__dirname, '..', '..')
  const report = await evaluateMarketCaches()
  const outputDir = path.resolve(projectRoot, 'predictions-data')
  await fs.mkdir(outputDir, { recursive: true })
  const target = path.join(outputDir, 'market-cache-quality.json')

  await fs.writeFile(target, JSON.stringify(report, null, 2))

  console.log('Market cache quality report generated at:')
  console.log(`  ${target}`)
  console.log(`Datasets evaluated: ${report.summary.availableDatasets}/${report.summary.expectedDatasets}`)

  if (report.summary.missingDatasets.length) {
    console.warn('Missing datasets:')
    for (const dataset of report.summary.missingDatasets) {
      console.warn(`  - ${dataset}`)
    }
  }
}

void main()
