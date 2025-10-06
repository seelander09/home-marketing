import { NextResponse } from 'next/server'
import { getEquityInsights } from '@/lib/insights/realie'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const marketId = searchParams.get('marketId') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined

  try {
    const insights = await getEquityInsights({ marketId, limit })
    if (!insights.length) {
      return NextResponse.json({ insights: [], message: 'No equity insights available for the requested filters.' }, { status: 404 })
    }
    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Failed to load equity insights', error)
    return NextResponse.json({ error: 'Unable to load equity insights at this time.' }, { status: 500 })
  }
}
