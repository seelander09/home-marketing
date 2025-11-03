import { NextResponse } from 'next/server'
import { demoRequestSchema } from '@/lib/forms/schemas'
import { verifyRecaptcha } from '@/lib/forms/recaptcha'
import { findTerritory } from '@/lib/forms/territory'
import { sendToCrm } from '@/lib/forms/crm'
import { captureException, addBreadcrumb } from '@/lib/monitoring/error-tracker'
import { measureApiCall } from '@/lib/monitoring/performance'

export async function POST(request: Request) {
  try {
    addBreadcrumb({
      message: 'Demo request form submission',
      category: 'api.forms.demo',
      level: 'info'
    })

    const json = await request.json().catch(() => null)
    const result = demoRequestSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 422 })
    }

    const payload = result.data
    const ip = request.headers.get('x-forwarded-for') || undefined
    const recaptchaValid = await verifyRecaptcha(payload.recaptchaToken, ip)

    if (!recaptchaValid) {
      addBreadcrumb({
        message: 'reCAPTCHA verification failed',
        category: 'api.forms.demo',
        level: 'warning'
      })
      return NextResponse.json({ error: 'Failed human verification' }, { status: 400 })
    }

    const territoryMatches = await measureApiCall('findTerritory', () =>
      findTerritory({
        city: payload.territory.city,
        state: payload.territory.state,
        zip: payload.territory.zip
      })
    )

    try {
      await measureApiCall('sendToCrm', () => sendToCrm(payload, 'demo-request'))
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: 'api.forms.demo',
        action: 'sendToCrm',
        email: payload.email,
        url: request.url
      })
      return NextResponse.json({ error: 'Failed to send demo request to CRM' }, { status: 502 })
    }

    return NextResponse.json({ success: true, territoryMatches })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: 'api.forms.demo',
      action: 'POST',
      url: request.url
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

