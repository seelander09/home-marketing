import { NextResponse } from 'next/server'
import { demoRequestSchema } from '@/lib/forms/schemas'
import { verifyRecaptcha } from '@/lib/forms/recaptcha'
import { findTerritory } from '@/lib/forms/territory'
import { sendToCrm } from '@/lib/forms/crm'

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const result = demoRequestSchema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 422 })
  }

  const payload = result.data
  const ip = request.headers.get('x-forwarded-for') || undefined
  const recaptchaValid = await verifyRecaptcha(payload.recaptchaToken, ip)

  if (!recaptchaValid) {
    return NextResponse.json({ error: 'Failed human verification' }, { status: 400 })
  }

  const territoryMatches = await findTerritory({
    city: payload.territory.city,
    state: payload.territory.state,
    zip: payload.territory.zip
  })

  try {
    await sendToCrm(payload, 'demo-request')
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send demo request to CRM' }, { status: 502 })
  }

  return NextResponse.json({ success: true, territoryMatches })
}

