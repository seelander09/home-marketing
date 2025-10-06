import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { consentPreferencesSchema, doNotSellSchema } from '@/lib/forms/schemas'
import { verifyRecaptcha } from '@/lib/forms/recaptcha'
import { sendToCrm } from '@/lib/forms/crm'

const requestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('preferences'),
    preferences: consentPreferencesSchema
  }),
  z.object({
    type: z.literal('do-not-sell'),
    payload: doNotSellSchema
  })
])

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 422 })
  }

  const body = parsed.data

  if (body.type === 'preferences') {
    const store = cookies()
    store.set('smartlead-consent', JSON.stringify({ ...body.preferences, updatedAt: Date.now() }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365
    })
    return NextResponse.json({ success: true })
  }

  const { payload } = body
  if (payload.recaptchaToken) {
    const valid = await verifyRecaptcha(payload.recaptchaToken)
    if (!valid) {
      return NextResponse.json({ error: 'Failed verification' }, { status: 400 })
    }
  }

  try {
    await sendToCrm(payload, 'do-not-sell')
  } catch (error) {
    console.error('Failed to create compliance ticket', error)
    return NextResponse.json({ error: 'Failed to create compliance ticket' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
