import { NextResponse } from 'next/server'
import {
  getCityMarketSnapshot,
  getStateMarketSnapshot,
  getZipMarketSnapshot
} from '@/lib/insights/redfin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip')
  const city = searchParams.get('city')
  const state = searchParams.get('state')

  try {
    if (zip) {
      const snapshot = await getZipMarketSnapshot(zip)
      if (!snapshot) {
        return NextResponse.json({ error: 'No market data found for the specified ZIP' }, { status: 404 })
      }
      return NextResponse.json({ snapshot })
    }

    if (city) {
      if (!state) {
        return NextResponse.json({ error: 'Provide a state code when querying by city' }, { status: 400 })
      }
      const snapshot = await getCityMarketSnapshot(state, city)
      if (!snapshot) {
        return NextResponse.json({ error: 'No market data found for the specified city' }, { status: 404 })
      }
      return NextResponse.json({ snapshot })
    }

    if (!state) {
      return NextResponse.json({ error: 'Provide a state code, city, or ZIP' }, { status: 400 })
    }

    const snapshot = await getStateMarketSnapshot(state)

    if (!snapshot) {
      return NextResponse.json({ error: 'No market data found for the specified state' }, { status: 404 })
    }

    return NextResponse.json({ snapshot })
  } catch (error) {
    console.error('Failed to read Redfin market snapshot', error)
    return NextResponse.json({ error: 'Unable to load Redfin market data' }, { status: 500 })
  }
}
