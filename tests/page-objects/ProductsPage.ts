import { Page, Locator, expect } from '@playwright/test'
import { TestHelpers } from '../fixtures/test-helpers'

export class ProductsPage {
  public readonly helpers: TestHelpers

  // Page elements
  public readonly pageTitle: Locator
  public readonly pageHeading: Locator
  public readonly packageCards: Locator
  public readonly ctaButtons: Locator

  // Package-specific elements
  public readonly smartTargetingCard: Locator
  public readonly reachOmnichannelCard: Locator
  public readonly insightsPlusCard: Locator

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page)

    this.pageTitle = page.locator('h1').first()
    this.pageHeading = page.locator('h1, h2').first()
    this.packageCards = page.locator('[data-testid="package-card"], .package-card, .product-card')
    this.ctaButtons = page.locator('a[href*="contact"], button:has-text("Get Started"), button:has-text("Learn More")')

    // Package cards
    this.smartTargetingCard = page.locator('[data-testid="smart-targeting"], :has-text("SmartTargeting")').first()
    this.reachOmnichannelCard = page.locator('[data-testid="reach-omnichannel"], :has-text("Reach")').first()
    this.insightsPlusCard = page.locator('[data-testid="insights-plus"], :has-text("Insights+")').first()
  }

  async goto() {
    await this.page.goto('/products')
    await this.helpers.waitForPageLoad()
  }

  async isLoaded() {
    await expect(this.page).toHaveURL(/.*products/)
    await expect(this.pageTitle).toBeVisible()
  }

  async getPackageCards() {
    return await this.packageCards.all()
  }

  async clickPackageCard(index: number) {
    const cards = await this.getPackageCards()
    if (cards[index]) {
      await cards[index]!.click()
    }
  }

  async clickCTA(buttonText?: string) {
    if (buttonText) {
      await this.page.locator(`button:has-text("${buttonText}"), a:has-text("${buttonText}")`).first().click()
    } else {
      await this.ctaButtons.first().click()
    }
  }

  async verifyPackageFeatures(packageName: string) {
    const packageCard = this.page.locator(`:has-text("${packageName}")`).first()
    await expect(packageCard).toBeVisible()
    
    // Check for features list
    const features = packageCard.locator('ul, .features, [data-testid="features"]')
    const hasFeatures = await features.count() > 0
    expect(hasFeatures).toBe(true)
  }
}

