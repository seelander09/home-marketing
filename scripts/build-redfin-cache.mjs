import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const RAW_DIR =
  process.env.REDFIN_DATA_DIR ??
  path.resolve(__dirname, '..', '..', 'redfin-data')
const CACHE_DIR =
  process.env.REDFIN_CACHE_DIR ??
  path.join(RAW_DIR, 'cache')

const DATASETS = {
  state: 'state_market_tracker.tsv000',
  city: 'city_market_tracker.tsv000',
  zip: 'zip_code_market_tracker.tsv000'
}

const REQUIRED_PROPERTY_TYPE = 'All Residential'
const REQUIRED_ADJUSTMENT_FLAG = 'false'

const numberFields = [
  'MEDIAN_SALE_PRICE',
  'MEDIAN_DOM',
  'INVENTORY',
  'MONTHS_OF_SUPPLY',
  'SOLD_ABOVE_LIST',
  'PRICE_DROPS',
  'NEW_LISTINGS',
  'PENDING_SALES',
  'AVG_SALE_TO_LIST'
]

function stripQuotes(value) {
  return value?.replace(/^"+|"+$/g, '') ?? ''
}

function parseNumber(value) {
  const trimmed = stripQuotes(value)
  if (!trimmed || trimmed === 'NA') return null
  const parsed = Number.parseFloat(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

async function ensureReadable(filePath) {
  try {
    await fsp.access(filePath, fs.constants.R_OK)
    return true
  } catch (error) {
    console.error(`⛔️ Unable to access ${filePath}:`, error.message)
    return false
  }
}

function buildSnapshot(kind, row) {
  const base = {
    regionType: kind,
    regionName: row.REGION ?? row.STATE ?? '',
    state: row.STATE ?? '',
    stateCode: (row.STATE_CODE ?? '').toUpperCase(),
    periodBegin: row.PERIOD_BEGIN,
    periodEnd: row.PERIOD_END,
    medianSalePrice: parseNumber(row.MEDIAN_SALE_PRICE),
    medianDom: parseNumber(row.MEDIAN_DOM),
    inventory: parseNumber(row.INVENTORY),
    monthsOfSupply: parseNumber(row.MONTHS_OF_SUPPLY),
    soldAboveList: parseNumber(row.SOLD_ABOVE_LIST),
    priceDrops: parseNumber(row.PRICE_DROPS),
    newListings: parseNumber(row.NEW_LISTINGS),
    pendingSales: parseNumber(row.PENDING_SALES),
    avgSaleToList: parseNumber(row.AVG_SALE_TO_LIST),
    lastUpdated: row.LAST_UPDATED ?? null
  }

  if (kind === 'city') {
    return {
      ...base,
      regionName: row.CITY ?? row.REGION ?? '',
      city: row.CITY ?? row.REGION ?? ''
    }
  }

  if (kind === 'zip') {
    return {
      ...base,
      regionName: row.REGION ?? '',
      zip: row.REGION ?? ''
    }
  }

  return base
}

function snapshotKey(kind, row) {
  const stateCode = (row.STATE_CODE ?? '').toUpperCase()
  if (kind === 'state') {
    return stateCode
  }
  if (kind === 'city') {
    const city = (row.CITY ?? row.REGION ?? '').toLowerCase()
    return `${stateCode}|${city}`
  }
  if (kind === 'zip') {
    return stripQuotes(row.REGION ?? '')
  }
  return ''
}

async function processDataset(kind, fileName) {
  const filePath = path.join(RAW_DIR, fileName)
  if (!(await ensureReadable(filePath))) {
    return {}
  }

  console.log(`\n▶ Processing ${kind} dataset from ${filePath}`)

  const stream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  })

  let headers = null
  const latest = new Map()
  let processed = 0

  const startTime = Date.now()

  for await (const line of rl) {
    if (!headers) {
      headers = line.split('\t').map(stripQuotes)
      continue
    }
    if (!line.trim()) continue

    const values = line.split('\t')
    const row = headers.reduce((acc, header, index) => {
      acc[header] = stripQuotes(values[index] ?? '')
      return acc
    }, {})

    if (row.PROPERTY_TYPE !== REQUIRED_PROPERTY_TYPE) continue
    if (row.IS_SEASONALLY_ADJUSTED !== REQUIRED_ADJUSTMENT_FLAG) continue
    if (!row.STATE_CODE) continue

    if (kind === 'city' && !row.CITY && !row.REGION) continue
    if (kind === 'zip' && !row.REGION) continue

    const key = snapshotKey(kind, row)
    if (!key) continue

    const snapshot = buildSnapshot(kind, row)
    if (!snapshot.periodBegin) continue

    const existing = latest.get(key)
    const currentDate = Date.parse(snapshot.periodBegin)
    const existingDate = existing ? Date.parse(existing.periodBegin) : -Infinity

    if (!existing || currentDate > existingDate) {
      latest.set(key, snapshot)
      processed += 1
    }
  }

  rl.close()
  stream.close()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`✔ ${kind} cache captured ${processed.toLocaleString()} regions in ${elapsed}s`)

  const result = {}
  for (const [key, snapshot] of latest.entries()) {
    result[key] = snapshot
  }

  return result
}

async function main() {
  console.log('🏗  Building Redfin market caches...')
  await fsp.mkdir(CACHE_DIR, { recursive: true })

  const [stateData, cityData, zipData] = await Promise.all([
    processDataset('state', DATASETS.state),
    processDataset('city', DATASETS.city),
    processDataset('zip', DATASETS.zip)
  ])

  const outputs = [
    ['state.json', stateData],
    ['city.json', cityData],
    ['zip.json', zipData]
  ]

  await Promise.all(
    outputs.map(async ([filename, payload]) => {
      const target = path.join(CACHE_DIR, filename)
      await fsp.writeFile(target, JSON.stringify(payload))
      console.log(`💾 Wrote ${Object.keys(payload).length.toLocaleString()} records to ${target}`)
    })
  )

  console.log('✅ Redfin cache build complete')
}

main().catch((error) => {
  console.error('❌ Redfin cache build failed', error)
  process.exitCode = 1
})
