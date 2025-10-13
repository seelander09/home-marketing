import { NextResponse } from 'next/server'
import { getStateCensusData, getCountyCensusData, getZipCensusData } from '@/lib/insights/census'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip')
  const city = searchParams.get('city')
  const state = searchParams.get('state')
  const county = searchParams.get('county')

  try {
    if (zip) {
      const censusData = await getZipCensusData(zip)
      if (!censusData) {
        return NextResponse.json({ error: 'No Census data found for the specified ZIP' }, { status: 404 })
      }
      return NextResponse.json({ censusData })
    }

    if (county && state) {
      const censusData = await getCountyCensusData(state, county)
      if (!censusData) {
        return NextResponse.json({ error: 'No Census data found for the specified county' }, { status: 404 })
      }
      return NextResponse.json({ censusData })
    }

    if (state) {
      const censusData = await getStateCensusData(state)
      if (!censusData) {
        return NextResponse.json({ error: 'No Census data found for the specified state' }, { status: 404 })
      }
      return NextResponse.json({ censusData })
    }

    return NextResponse.json({ error: 'Provide a state, county, or ZIP code' }, { status: 400 })
    
  } catch (error) {
    console.error('Failed to read Census data', error)
    return NextResponse.json({ error: 'Unable to load Census data' }, { status: 500 })
  }
}
