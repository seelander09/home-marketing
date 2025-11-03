import { Page, Locator, expect } from '@playwright/test'
import { TestHelpers } from '../fixtures/test-helpers'

export class ContactPage {
  public readonly helpers: TestHelpers

  // Page elements
  public readonly pageTitle: Locator
  public readonly contactForm: Locator
  public readonly nameInput: Locator
  public readonly emailInput: Locator
  public readonly phoneInput: Locator
  public readonly messageTextarea: Locator
  public readonly submitButton: Locator
  public readonly successMessage: Locator
  public readonly errorMessages: Locator

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page)

    this.pageTitle = page.locator('h1').first()
    this.contactForm = page.locator('form, [data-testid="contact-form"]').first()
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first()
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]').first()
    this.messageTextarea = page.locator('textarea[name="message"]').first()
    this.submitButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first()
    this.successMessage = page.locator('.success-message, [role="alert"]:has-text("success" i)')
    this.errorMessages = page.locator('[role="alert"], .error-message, .field-error')
  }

  async goto() {
    await this.page.goto('/contact')
    await this.helpers.waitForPageLoad()
  }

  async isLoaded() {
    await expect(this.page).toHaveURL(/.*contact/)
    await expect(this.pageTitle).toBeVisible()
  }

  async fillForm(data: { name: string; email: string; phone: string; message: string }) {
    await this.helpers.fillFormField(this.nameInput, data.name)
    await this.helpers.fillFormField(this.emailInput, data.email)
    await this.helpers.fillFormField(this.phoneInput, data.phone)
    await this.helpers.fillFormField(this.messageTextarea, data.message)
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
}
