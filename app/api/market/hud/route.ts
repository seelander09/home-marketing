import { NextResponse } from 'next/server'
import { getStateHUDData, getCountyHUDData, getMetroHUDData } from '@/lib/insights/hud'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')
  const county = searchParams.get('county')
  const metro = searchParams.get('metro')

  try {
    if (metro) {
      const hudData = await getMetroHUDData(metro)
      if (!hudData) {
        return NextResponse.json({ error: 'No HUD data found for the specified metro area' }, { status: 404 })
      }
      return NextResponse.json({ hudData })
    }

    if (county && state) {
      const hudData = await getCountyHUDData(state, county)
      if (!hudData) {
        return NextResponse.json({ error: 'No HUD data found for the specified county' }, { status: 404 })
      }
      return NextResponse.json({ hudData })
    }

    if (state) {
      const hudData = await getStateHUDData(state)
      if (!hudData) {
        return NextResponse.json({ error: 'No HUD data found for the specified state' }, { status: 404 })
      }
      return NextResponse.json({ hudData })
    }

    return NextResponse.json({ error: 'Provide a state, county, or metro area' }, { status: 400 })
    
  } catch (error) {
    console.error('Failed to read HUD data', error)
    return NextResponse.json({ error: 'Unable to load HUD data' }, { status: 500 })
  }
}
