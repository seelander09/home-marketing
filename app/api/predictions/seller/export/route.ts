import { NextResponse } from 'next/server'

import {
  SellerPropensityOptions,
  SellerPropensityFilters,
  scoreAllCachedPropertyOpportunities
} from '@/lib/predictions/seller-propensity'

function parseNumberParam(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildFilters(searchParams: URLSearchParams): SellerPropensityFilters | undefined {
  const filters: SellerPropensityFilters = {}

  const query = searchParams.get('query')
  if (query) filters.query = query.trim()

  const city = searchParams.get('city')
  if (city) filters.city = city.trim()

  const state = searchParams.get('state')
  if (state) filters.state = state.trim()

  const zip = searchParams.get('zip')
  if (zip) filters.zip = zip.trim()

  const minScore = parseNumberParam(searchParams.get('minScore'))
  if (typeof minScore === 'number') filters.minScore = minScore

  const minEquity = parseNumberParam(searchParams.get('minEquity'))
  if (typeof minEquity === 'number') filters.minEquity = minEquity

  const minYears = parseNumberParam(searchParams.get('minYears'))
  if (typeof minYears === 'number') filters.minYears = minYears

  return Object.keys(filters).length > 0 ? filters : undefined
}

function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return ''
  }
  const stringValue = typeof value === 'number' ? value.toString() : value
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = buildFilters(searchParams)
  const limitParam = parseNumberParam(searchParams.get('limit'))
  const limit = typeof limitParam === 'number' && limitParam > 0 ? Math.floor(limitParam) : undefined

  const options: SellerPropensityOptions = {
    filters,
    limit
  }

  const analysis = await scoreAllCachedPropertyOpportunities(options)

  const headers = [
    'propertyId',
    'address',
    'owner',
    'priority',
    'ownerType',
    'city',
    'state',
    'zip',
    'overallScore',
    'heuristicScore',
    'confidence',
    'modelProbability',
    'heuristicWeight',
    'modelWeight',
    'featureCompleteness',
    'drivers',
    'riskFlags'
  ]

  const rows = analysis.scores.map((score) => [
    score.propertyId,
    score.propertyDetails.address,
    score.propertyDetails.owner,
    score.propertyDetails.priority,
    score.cohorts.ownerType,
    score.geography.city,
    score.geography.state,
    score.geography.zip,
    score.overallScore,
    score.heuristicScore,
    score.confidence,
    score.modelPrediction ? score.modelPrediction.probability : '',
    Math.round(score.attribution.heuristicWeight * 100) / 100,
    Math.round(score.attribution.modelWeight * 100) / 100,
    score.featureCompleteness ?? '',
    score.drivers.join(' | '),
    score.riskFlags.join(' | ')
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n')

  const safeTimestamp = analysis.generatedAt.replace(/[:]/g, '-')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="seller-propensity-${safeTimestamp}.csv"`
    }
  })
}
