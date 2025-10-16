import { expect, Page, Locator } from '@playwright/test'

import { TestHelpers } from '../fixtures/test-helpers'

export class SellerRadarPage {
  private helpers: TestHelpers

  readonly heading: Locator
  readonly summarySection: Locator
  readonly summaryCards: Locator
  readonly stateFilter: Locator
  readonly minScoreInput: Locator
  readonly tableRows: Locator
  readonly mapCanvas: Locator
  readonly exportCsvButton: Locator
  readonly exportPdfButton: Locator

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page)

    this.heading = page.getByRole('heading', {
      name: /rank seller-ready homeowners/i
    })
    this.summarySection = page.locator('[data-testid="seller-radar-summary"]')
    this.summaryCards = this.summarySection.locator('[data-testid^="seller-radar-summary-card-"]')
    this.stateFilter = page.getByLabel(/State/i)
    this.minScoreInput = page.getByLabel(/Minimum seller score/i)
    this.tableRows = page.locator('table tbody tr')
    this.mapCanvas = page.locator('.leaflet-container')
    this.exportCsvButton = page.getByRole('button', { name: /export csv/i })
    this.exportPdfButton = page.getByRole('button', { name: /export lead sheet/i })
  }

  async goto() {
    await this.page.goto('/analytics/seller-radar')
    await this.helpers.waitForPageLoad()
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.mapCanvas).toBeVisible()
    await expect(this.tableRows.first()).toBeVisible()
    await expect(this.exportCsvButton).toBeVisible()
  }

  async expectSummaryCards() {
    await expect(this.summarySection).toBeVisible()
    await expect(this.summaryCards).toHaveCount(3)

    const expectedLabels = ['Average seller score', 'Average confidence', 'Top component weight']
    for (let index = 0; index < expectedLabels.length; index += 1) {
      await expect(
        this.summaryCards
          .nth(index)
          .locator('[data-testid="seller-radar-summary-label"]')
      ).toHaveText(expectedLabels[index], { useInnerText: true })
    }
  }

  async selectState(value: string) {
    await this.stateFilter.selectOption({ value })
  }

  async expectTopRowIncludes(text: string) {
    await expect(this.tableRows.first()).toContainText(text)
  }

  async getVisibleTableRows() {
    const rows = await this.tableRows.all()
    return Promise.all(rows.map(async (row) => row.textContent()))
  }
}
