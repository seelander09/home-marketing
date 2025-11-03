import { Page, Locator, expect } from '@playwright/test'
import { TestHelpers } from '../fixtures/test-helpers'

export class CompliancePage {
  public readonly helpers: TestHelpers

  // Do Not Sell form
  public readonly doNotSellForm: Locator
  public readonly fullNameInput: Locator
  public readonly emailInput: Locator
  public readonly phoneInput: Locator
  public readonly messageTextarea: Locator
  public readonly submitButton: Locator
  public readonly successMessage: Locator
  public readonly errorMessages: Locator

  // Consent preferences
  public readonly consentPreferences: Locator
  public readonly consentCheckboxes: Locator

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page)

    this.doNotSellForm = page.locator('[data-testid="do-not-sell-form"], form').first()
    this.fullNameInput = page.locator('input[name="fullName"], input[placeholder*="name" i]').first()
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first()
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]').first()
    this.messageTextarea = page.locator('textarea[name="message"]').first()
    this.submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first()
    this.successMessage = page.locator('.success-message, [role="alert"]:has-text("success" i)')
    this.errorMessages = page.locator('[role="alert"], .error-message, .field-error')

    this.consentPreferences = page.locator('[data-testid="consent-preferences"], .consent-preferences').first()
    this.consentCheckboxes = page.locator('input[type="checkbox"]')
  }

  async goto() {
    await this.page.goto('/compliance')
    await this.helpers.waitForPageLoad()
  }

  async isLoaded() {
    await expect(this.page).toHaveURL(/.*compliance/)
  }

  async fillDoNotSellForm(data: { fullName: string; email: string; phone?: string; message?: string }) {
    await this.helpers.fillFormField(this.fullNameInput, data.fullName)
    await this.helpers.fillFormField(this.emailInput, data.email)
    if (data.phone && await this.phoneInput.isVisible()) {
      await this.helpers.fillFormField(this.phoneInput, data.phone)
    }
    if (data.message && await this.messageTextarea.isVisible()) {
      await this.helpers.fillFormField(this.messageTextarea, data.message)
    }
  }

  async submit() {
    await this.submitButton.click()
  }

  async verifySuccess() {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

  async verifyValidationErrors() {
    const count = await this.errorMessages.count()
    expect(count).toBeGreaterThan(0)
  }

  async updateConsentPreferences(consents: Record<string, boolean>) {
    for (const [label, checked] of Object.entries(consents)) {
      const checkbox = this.page.locator(`input[type="checkbox"]:near(label:has-text("${label}"))`).first()
      const currentState = await checkbox.isChecked()
      if (currentState !== checked) {
        await checkbox.click()
      }
    }
  }
}

