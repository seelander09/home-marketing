import type { DemoRequestPayload, DownloadRequestPayload, DoNotSellPayload } from '@/lib/forms/schemas'

const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL

export async function sendToCrm<T extends DemoRequestPayload | DownloadRequestPayload | DoNotSellPayload>(
  payload: T,
  event: 'demo-request' | 'download-request' | 'do-not-sell'
): Promise<void> {
  if (!CRM_WEBHOOK_URL) {
    console.info('CRM_WEBHOOK_URL not configured, skipping CRM handoff for', event)
    return
  }

  try {
    const response = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() })
    })

    if (!response.ok) {
      throw new Error(`CRM webhook returned status ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send payload to CRM webhook', error)
    throw error
  }
}
