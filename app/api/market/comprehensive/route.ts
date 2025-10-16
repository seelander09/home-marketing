import { NextResponse } from 'next/server'
import { getComprehensiveMarketData, MarketDataRequest } from '@/lib/insights/unified'

type LocationPayload = Partial<Record<'zip' | 'city' | 'state' | 'county' | 'metro', string>>

function parseLocationPayload(value: unknown): LocationPayload | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const keys: Array<keyof LocationPayload> = ['zip', 'city', 'state', 'county', 'metro']
  const parsed: LocationPayload = {}
  let hasValue = false

  for (const key of keys) {
    const raw = candidate[key]
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed) {
        parsed[key] = trimmed
        hasValue = true
      }
    }
  }

  return hasValue ? parsed : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Extract query parameters
  const zip = searchParams.get('zip')
  const city = searchParams.get('city')
  const state = searchParams.get('state')
  const county = searchParams.get('county')
  const metro = searchParams.get('metro')
  const includeInsights = searchParams.get('includeInsights') !== 'false' // Default to true
  
  // Validate request parameters
  if (!zip && !city && !state && !county && !metro) {
    return NextResponse.json(
      { 
        error: 'Provide at least one location parameter: zip, city, state, county, or metro',
        example: '/api/market/comprehensive?zip=12345&includeInsights=true'
      }, 
      { status: 400 }
    )
  }
  
  // Validate state requirement for city queries
  if (city && !state) {
    return NextResponse.json(
      { error: 'State parameter is required when querying by city' }, 
      { status: 400 }
    )
  }
  
  // Validate state requirement for county queries
  if (county && !state) {
    return NextResponse.json(
      { error: 'State parameter is required when querying by county' }, 
      { status: 400 }
    )
  }

  try {
    const marketDataRequest: MarketDataRequest = {
      zip: zip || undefined,
      city: city || undefined,
      state: state || undefined,
      county: county || undefined,
      metro: metro || undefined,
      includeInsights
    }
    
    const comprehensiveData = await getComprehensiveMarketData(marketDataRequest)
    
    if (!comprehensiveData) {
      return NextResponse.json(
        { error: 'No market data found for the specified location' }, 
        { status: 404 }
      )
    }
    
    // Add metadata about the request
    const response = {
      ...comprehensiveData,
      metadata: {
        request: marketDataRequest,
        timestamp: new Date().toISOString(),
        dataSources: {
          redfin: !!comprehensiveData.redfin,
          census: !!comprehensiveData.census,
          hud: !!comprehensiveData.hud,
          economic: !!comprehensiveData.economic
        },
        cacheStatus: {
          redfin: comprehensiveData.dataFreshness.redfin ? 'cached' : 'missing',
          census: comprehensiveData.dataFreshness.census ? 'cached' : 'missing',
          hud: comprehensiveData.dataFreshness.hud ? 'cached' : 'missing',
          economic: comprehensiveData.dataFreshness.economic ? 'cached' : 'missing'
        }
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Failed to fetch comprehensive market data:', error)
    return NextResponse.json(
      { 
        error: 'Unable to load comprehensive market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const includeInsights =
      typeof body?.includeInsights === 'boolean' ? body.includeInsights : true
    const locationsInput = body?.locations

    if (!Array.isArray(locationsInput) || locationsInput.length === 0) {
      return NextResponse.json(
        { error: 'Provide an array of locations to query' },
        { status: 400 }
      )
    }
    
    // Limit batch size to prevent timeouts
    if (locationsInput.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 locations per batch request' },
        { status: 400 }
      )
    }

    const parsedLocations: LocationPayload[] = []

    for (const location of locationsInput) {
      const parsed = parseLocationPayload(location)
      if (!parsed) {
        return NextResponse.json(
          { error: 'Each location must contain at least one location field (zip, city, state, county, or metro)' },
          { status: 400 }
        )
      }
      parsedLocations.push(parsed)
    }

    const results = await Promise.all(
      parsedLocations.map(async (location) => {
        const marketDataRequest: MarketDataRequest = {
          zip: location.zip,
          city: location.city,
          state: location.state,
          county: location.county,
          metro: location.metro,
          includeInsights
        }
        
        try {
          const data = await getComprehensiveMarketData(marketDataRequest)
          return {
            location,
            data,
            success: true
          }
        } catch (error) {
          return {
            location,
            data: null,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      results,
      summary: {
        total: parsedLocations.length,
        successful,
        failed,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Failed to process batch market data request:', error)
    return NextResponse.json(
      { 
        error: 'Unable to process batch request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
