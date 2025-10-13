import { NextResponse } from 'next/server'
import { getFREDEconomicData, getStateEconomicData } from '@/lib/insights/fred'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')

  try {
    if (state) {
      const stateEconomicData = await getStateEconomicData(state)
      const nationalEconomicData = await getFREDEconomicData()
      
      return NextResponse.json({
        national: nationalEconomicData,
        state: stateEconomicData,
        metadata: {
          stateCode: state,
          timestamp: new Date().toISOString()
        }
      })
    }

    const economicData = await getFREDEconomicData()
    
    if (!economicData) {
      return NextResponse.json({ error: 'No economic data available' }, { status: 404 })
    }
    
    return NextResponse.json({
      economic: economicData,
      metadata: {
        timestamp: new Date().toISOString(),
        scope: 'national'
      }
    })
    
  } catch (error) {
    console.error('Failed to read economic data', error)
    return NextResponse.json({ error: 'Unable to load economic data' }, { status: 500 })
  }
}
