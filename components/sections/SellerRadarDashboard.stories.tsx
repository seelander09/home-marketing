import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { SellerRadarDashboard } from '@/components/sections/SellerRadarDashboard'
import {
  DEFAULT_SELLER_ANALYSIS_MOCK,
  createSellerAnalysisResponse
} from '@/lib/predictions/mock-data'

const californiaAnalysis = createSellerAnalysisResponse(
  [
    {
      propertyId: 'sf-oak-002',
      address: '123 Oak Street',
      owner: 'John Smith',
      priority: 'High Priority',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      county: 'San Francisco County',
      neighborhood: 'Hayes Valley',
      msa: 'San Francisco Metro',
      overallScore: 92,
      latitude: 37.7793,
      longitude: -122.4192,
      yearsInHome: 4,
      estimatedEquity: 407595,
      equityUpside: 155408
    },
    {
      propertyId: 'la-hill-007',
      address: '482 Hillcrest Avenue',
      owner: 'Alicia Gomez',
      priority: 'Medium Priority',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90012',
      county: 'Los Angeles County',
      neighborhood: 'Echo Park',
      msa: 'Los Angeles Metro',
      overallScore: 83,
      latitude: 34.0619,
      longitude: -118.244,
      yearsInHome: 7,
      estimatedEquity: 365000,
      equityUpside: 142000
    }
  ],
  { filters: { state: 'CA' } }
)

function SellerRadarStoryWrapper() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.includes('/api/predictions/seller')) {
        const parsed = new URL(url, window.location.origin)
        const state = parsed.searchParams.get('state')
        const responseBody =
          state === 'CA' ? californiaAnalysis : DEFAULT_SELLER_ANALYSIS_MOCK

        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      return originalFetch(input, init)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return <SellerRadarDashboard />
}

const meta: Meta<typeof SellerRadarDashboard> = {
  title: 'Sections/Seller Radar Dashboard',
  component: SellerRadarDashboard,
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta

type Story = StoryObj<typeof SellerRadarDashboard>

export const Default: Story = {
  render: () => <SellerRadarStoryWrapper />
}
