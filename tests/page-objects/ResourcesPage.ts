import { Page, Locator, expect } from '@playwright/test'
import { TestHelpers } from '../fixtures/test-helpers'

export class ResourcesPage {
  public readonly helpers: TestHelpers

  // Page elements
  public readonly pageTitle: Locator
  public readonly resourceGrid: Locator
  public readonly resourceCards: Locator
  public readonly filterButtons: Locator
  public readonly featuredResource: Locator

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page)

    this.pageTitle = page.locator('h1').first()
    this.resourceGrid = page.locator('[data-testid="resource-grid"], .resource-grid, .grid').first()
    this.resourceCards = page.locator('[data-testid="resource-card"], .resource-card, article')
    this.filterButtons = page.locator('[data-testid="filter"], .filter-button, button:has-text("Filter")')
    this.featuredResource = page.locator('[data-testid="featured-resource"], .featured-resource').first()
  }

  async goto() {
    await this.page.goto('/resources')
    await this.helpers.waitForPageLoad()
  }

  async isLoaded() {
    await expect(this.page).toHaveURL(/.*resources/)
    await expect(this.pageTitle).toBeVisible()
  }

  async getResourceCards() {
    return await this.resourceCards.all()
  }

  async clickResourceCard(index: number) {
    const cards = await this.getResourceCards()
    if (cards[index]) {
      await cards[index]!.click()
    }
  }

  async clickResourceByTitle(title: string) {
    await this.page.locator(`a:has-text("${title}"), h3:has-text("${title}")`).first().click()
  }

  async applyFilter(filterText: string) {
    await this.filterButtons.filter({ hasText: filterText }).click()
    await this.page.waitForTimeout(500) // Wait for filter to apply
  }

  async verifyResourcesDisplayed() {
    const count = await this.resourceCards.count()
    expect(count).toBeGreaterThan(0)
  }
}

