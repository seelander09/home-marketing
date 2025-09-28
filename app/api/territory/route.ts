import { NextResponse } from 'next/server'
import { territoryLookupSchema } from '@/lib/forms/schemas'
import { findTerritory } from '@/lib/forms/territory'

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const result = territoryLookupSchema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 422 })
  }

  const matches = await findTerritory(result.data)
  return NextResponse.json({ matches })
}
