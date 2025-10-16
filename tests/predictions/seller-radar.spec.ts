import { test, expect } from '@playwright/test'

import { SellerRadarPage } from '../page-objects/SellerRadarPage'
import {
  DEFAULT_SELLER_ANALYSIS_MOCK,
  createSellerAnalysisResponse
} from '@/lib/predictions/mock-data'

const californiaResponse = createSellerAnalysisResponse(
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

test.describe('Seller Radar Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/predictions/seller**', (route) => {
      const url = new URL(route.request().url())
      const state = url.searchParams.get('state')
      const responseBody =
        state === 'CA' || state === 'ca'
          ? californiaResponse
          : DEFAULT_SELLER_ANALYSIS_MOCK

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseBody)
      })
    })
  })

  test('renders analysis and updates when filters change', async ({ page }) => {
    const sellerRadar = new SellerRadarPage(page)

    await sellerRadar.goto()
    await sellerRadar.expectLoaded()
    await sellerRadar.expectSummaryCards()

    await sellerRadar.expectTopRowIncludes('Austin')

    await sellerRadar.selectState('CA')
    await expect(page.getByText(/San Francisco, CA 94102/)).toBeVisible()
    await sellerRadar.expectTopRowIncludes('San Francisco')
  })

  test('map and export controls remain accessible', async ({ page }) => {
    const sellerRadar = new SellerRadarPage(page)
    await sellerRadar.goto()

    await expect(sellerRadar.mapCanvas).toBeVisible()
    await expect(sellerRadar.exportCsvButton).toBeEnabled()
    await expect(sellerRadar.exportPdfButton).toBeEnabled()
  })
})
