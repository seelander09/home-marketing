import { NextResponse } from 'next/server'
import { getComprehensiveMarketData, MarketDataRequest } from '@/lib/insights/unified'

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
    const { locations, includeInsights = true } = body
    
    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Provide an array of locations to query' },
        { status: 400 }
      )
    }
    
    // Limit batch size to prevent timeouts
    if (locations.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 locations per batch request' },
        { status: 400 }
      )
    }
    
    const results = await Promise.all(
      locations.map(async (location: any) => {
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
        total: locations.length,
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
