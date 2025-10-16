import { NextResponse } from 'next/server'

import {
  SellerPropensityOptions,
  SellerPropensityFilters,
  scoreAllCachedPropertyOpportunities
} from '@/lib/predictions/seller-propensity'
import { appendSellerPropensityRunLog } from '@/lib/predictions/run-logger'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = buildFilters(searchParams)
    const limit = parseNumberParam(searchParams.get('limit'))
    const persistRuns = searchParams.get('persist') !== 'false'

    const options: SellerPropensityOptions = {
      filters,
      limit: typeof limit === 'number' && limit > 0 ? Math.floor(limit) : undefined
    }

    const analysis = await scoreAllCachedPropertyOpportunities(options)

    if (persistRuns) {
      try {
        await appendSellerPropensityRunLog(analysis)
      } catch (logError) {
        console.warn('Failed to append seller propensity run log', logError)
      }
    }

    return NextResponse.json({
      analysis,
      metadata: {
        filters: analysis.inputs.filters ?? null,
        limit: analysis.inputs.limit ?? null,
        persisted: persistRuns,
        generatedAt: analysis.generatedAt,
        componentWeights: analysis.componentWeights,
        modelMetadata: analysis.modelMetadata ?? null
      }
    })
  } catch (error) {
    console.error('Failed to generate seller propensity scores', error)
    return NextResponse.json(
      {
        error: 'Unable to generate seller propensity scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
