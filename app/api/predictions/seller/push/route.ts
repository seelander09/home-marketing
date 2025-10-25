import { NextResponse } from 'next/server'

import { listAllPropertyOpportunities } from '@/lib/insights/properties'

type PushPayload = {
  propertyIds?: string[]
  campaign?: string
}

export async function POST(request: Request) {
  const payload = (await request.json()) as PushPayload
  const propertyIds = payload.propertyIds ?? []

  if (!propertyIds.length) {
    return NextResponse.json(
      { error: 'propertyIds array required' },
      { status: 400 }
    )
  }

  const catalogue = new Map(listAllPropertyOpportunities().map((property) => [property.id, property]))
  const matched = propertyIds
    .map((id) => catalogue.get(id))
    .filter((property): property is NonNullable<typeof property> => Boolean(property))

  if (!matched.length) {
    return NextResponse.json(
      { error: 'No matching properties found for provided propertyIds.' },
      { status: 404 }
    )
  }

  const webhookUrl = process.env.CRM_SELLER_WEBHOOK_URL
  const webhookToken = process.env.CRM_SELLER_WEBHOOK_TOKEN
  let webhookStatus: 'skipped' | 'delivered' = 'skipped'

  if (webhookUrl) {
    const body = {
      campaign: payload.campaign ?? 'default',
      forwarded: matched.length,
      properties: matched.map((property) => ({
        id: property.id,
        address: property.address,
        owner: property.owner,
        priority: property.priority,
        score: property.listingScore,
        city: property.city,
        state: property.state,
        zip: property.zip
      }))
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {})
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`CRM webhook responded with status ${response.status}`)
      }
      webhookStatus = 'delivered'
    } catch (error) {
      console.error('CRM webhook push failed', error)
      return NextResponse.json(
        {
          error: 'Failed to push seller opportunities to CRM webhook',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 502 }
      )
    }
  }

  // eslint-disable-next-line no-console
  console.log('CRM push requested', {
    campaign: payload.campaign ?? 'default',
    requested: propertyIds.length,
    matched: matched.length,
    propertyIds,
    webhookStatus
  })

  return NextResponse.json({
    forwarded: matched.length,
    requested: propertyIds.length,
    campaign: payload.campaign ?? 'default',
    webhookStatus
  })
}
