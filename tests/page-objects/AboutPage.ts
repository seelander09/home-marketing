import { Page, Locator, expect } from '@playwright/test'
import { TestHelpers } from '../fixtures/test-helpers'

export class AboutPage {
  public readonly helpers: TestHelpers

  // Page elements
  public readonly pageTitle: Locator
  public readonly storySection: Locator
  public readonly leadershipGrid: Locator
  public readonly valuesGrid: Locator
  public readonly leadershipCards: Locator
  public readonly valuesCards: Locator

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page)

    this.pageTitle = page.locator('h1').first()
    this.storySection = page.locator('[data-testid="story"], .story-section, section:has-text("story" i)').first()
    this.leadershipGrid = page.locator('[data-testid="leadership"], .leadership-grid, .team-grid').first()
    this.valuesGrid = page.locator('[data-testid="values"], .values-grid').first()
    this.leadershipCards = page.locator('[data-testid="leader"], .leader-card, .team-member')
    this.valuesCards = page.locator('[data-testid="value"], .value-card')
  }

  async goto() {
    await this.page.goto('/about')
    await this.helpers.waitForPageLoad()
  }

  async isLoaded() {
    await expect(this.page).toHaveURL(/.*about/)
    await expect(this.pageTitle).toBeVisible()
  }

  async verifyStorySection() {
    await expect(this.storySection).toBeVisible()
  }

  async getLeadershipCards() {
    return await this.leadershipCards.all()
  }

  async getValuesCards() {
    return await this.valuesCards.all()
  }

  async verifyLeadershipDisplayed() {
    const count = await this.leadershipCards.count()
    expect(count).toBeGreaterThan(0)
  }

  async verifyValuesDisplayed() {
    const count = await this.valuesCards.count()
    expect(count).toBeGreaterThan(0)
  }
}

