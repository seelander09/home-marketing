import { Page, Locator, expect } from '@playwright/test'
import { TestHelpers } from '../fixtures/test-helpers'

export class GuideDownloadFormPage {
  public readonly helpers: TestHelpers

  // Form elements
  public readonly emailInput: Locator
  public readonly nameInput: Locator
  public readonly submitButton: Locator
  public readonly downloadButton: Locator
  public readonly successMessage: Locator
  public readonly errorMessages: Locator

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page)

    this.emailInput = page.locator('input[name="email"], input[type="email"]').first()
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
    this.submitButton = page.locator('button[type="submit"], button:has-text("Download"), button:has-text("Get Guide")').first()
    this.downloadButton = page.locator('a[href*="download"], a:has-text("Download")').first()
    this.successMessage = page.locator('.success-message, [role="alert"]:has-text("success" i)')
    this.errorMessages = page.locator('[role="alert"], .error-message, .field-error')
  }

  async fillForm(email: string, name?: string) {
    await this.helpers.fillFormField(this.emailInput, email)
    if (name && await this.nameInput.isVisible()) {
      await this.helpers.fillFormField(this.nameInput, name)
    }
  }

  async submit() {
    await this.submitButton.click()
  }

  async verifyDownloadAvailable() {
    await expect(this.downloadButton).toBeVisible({ timeout: 10000 })
  }

  async verifySuccess() {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 })
  }

  async verifyValidationErrors() {
    const count = await this.errorMessages.count()
    expect(count).toBeGreaterThan(0)
  }
}

