import { NextResponse } from 'next/server'
import { downloadRequestSchema } from '@/lib/forms/schemas'
import { verifyRecaptcha } from '@/lib/forms/recaptcha'
import { sendToCrm } from '@/lib/forms/crm'
import { resolveAsset } from '@/lib/forms/assets'

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const result = downloadRequestSchema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 422 })
  }

  const payload = result.data
  const recaptchaValid = await verifyRecaptcha(payload.recaptchaToken)
  if (!recaptchaValid) {
    return NextResponse.json({ error: 'Failed human verification' }, { status: 400 })
  }

  const assetPath = resolveAsset(payload.assetId)
  if (!assetPath) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  try {
    await sendToCrm(payload, 'download-request')
  } catch (error) {
    console.error('Failed to send download request to CRM', error)
    return NextResponse.json({ error: 'Failed to send to CRM' }, { status: 502 })
  }

  return NextResponse.json({ success: true, downloadUrl: assetPath })
}

