import { Page, Locator, expect } from '@playwright/test'
import { TestHelpers } from '../fixtures/test-helpers'
import type { FakeUser } from '../fixtures/fake-users'

export class DemoRequestFormPage {
  public readonly helpers: TestHelpers

  // Form elements - Step 1: Contact
  public readonly firstNameInput: Locator
  public readonly lastNameInput: Locator
  public readonly emailInput: Locator
  public readonly phoneInput: Locator

  // Form elements - Step 2: Business
  public readonly roleInput: Locator
  public readonly brokerageInput: Locator
  public readonly crmInput: Locator
  public readonly transactionsPerYearInput: Locator

  // Form elements - Step 3: Territory
  public readonly territoryCityInput: Locator
  public readonly territoryStateInput: Locator
  public readonly territoryZipInput: Locator
  public readonly messageTextarea: Locator

  // Navigation
  public readonly nextButton: Locator
  public readonly previousButton: Locator
  public readonly submitButton: Locator

  // Steps
  public readonly stepIndicator: Locator
  public readonly currentStep: Locator

  // Validation
  public readonly errorMessages: Locator
  public readonly successMessage: Locator

  // Territory lookup
  public readonly territoryMatches: Locator
  public readonly territoryMatchButtons: Locator

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page)

    // Step 1: Contact fields
    this.firstNameInput = page.locator('input[name="firstName"], input[placeholder*="first name" i]').first()
    this.lastNameInput = page.locator('input[name="lastName"], input[placeholder*="last name" i]').first()
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first()
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]').first()

    // Step 2: Business fields
    this.roleInput = page.locator('input[name="role"], select[name="role"]').first()
    this.brokerageInput = page.locator('input[name="brokerage"]').first()
    this.crmInput = page.locator('input[name="crm"], select[name="crm"]').first()
    this.transactionsPerYearInput = page.locator('input[name="transactionsPerYear"], select[name="transactionsPerYear"]').first()

    // Step 3: Territory fields
    this.territoryCityInput = page.locator('input[name="territory.city"], input[name*="city" i]').first()
    this.territoryStateInput = page.locator('input[name="territory.state"], input[name*="state" i]').first()
    this.territoryZipInput = page.locator('input[name="territory.zip"], input[name*="zip" i]').first()
    this.messageTextarea = page.locator('textarea[name="message"]').first()

    // Navigation buttons
    this.nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first()
    this.previousButton = page.locator('button:has-text("Previous"), button:has-text("Back")').first()
    this.submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Request Demo")').first()

    // Step indicator
    this.stepIndicator = page.locator('[data-testid="step-indicator"], .step-indicator, .steps').first()
    this.currentStep = page.locator('[data-testid="current-step"], .current-step').first()

    // Messages
    this.errorMessages = page.locator('[role="alert"], .error-message, .field-error, [aria-live="polite"]')
    this.successMessage = page.locator('.success-message, [role="alert"]:has-text("success" i)')

    // Territory matches
    this.territoryMatches = page.locator('[data-testid="territory-matches"], .territory-matches')
    this.territoryMatchButtons = page.locator('[data-testid="territory-match"], .territory-match button')
  }

  /**
   * Navigate to page with demo form
   */
  async goto() {
    await this.page.goto('/home')
    await this.helpers.waitForPageLoad()
  }

  /**
   * Fill step 1: Contact information
   */
  async fillContactStep(user: FakeUser) {
    await this.helpers.fillFormField(this.firstNameInput, user.firstName)
    await this.helpers.fillFormField(this.lastNameInput, user.lastName)
    await this.helpers.fillFormField(this.emailInput, user.email)
    await this.helpers.fillFormField(this.phoneInput, user.phone)
  }

  /**
   * Fill step 2: Business information
   */
  async fillBusinessStep(user: FakeUser) {
    // Handle role - could be select or input
    const roleTagName = await this.roleInput.evaluate(el => el.tagName.toLowerCase())
    if (roleTagName === 'select') {
      await this.roleInput.selectOption(user.role)
    } else {
      await this.helpers.fillFormField(this.roleInput, user.role)
    }

    await this.helpers.fillFormField(this.brokerageInput, user.brokerage)

    // Handle CRM - could be select or input
    const crmTagName = await this.crmInput.evaluate(el => el.tagName.toLowerCase()).catch(() => 'input')
    if (crmTagName === 'select') {
      await this.crmInput.selectOption(user.crm)
    } else {
      await this.helpers.fillFormField(this.crmInput, user.crm)
    }

    // Handle transactions - could be select or input
    const transactionsTagName = await this.transactionsPerYearInput.evaluate(el => el.tagName.toLowerCase()).catch(() => 'input')
    if (transactionsTagName === 'select') {
      await this.transactionsPerYearInput.selectOption(user.transactionsPerYear)
    } else {
      await this.helpers.fillFormField(this.transactionsPerYearInput, user.transactionsPerYear)
    }
  }

  /**
   * Fill step 3: Territory information
   */
  async fillTerritoryStep(user: FakeUser, message?: string) {
    await this.helpers.fillFormField(this.territoryCityInput, user.territory.city)
    await this.helpers.fillFormField(this.territoryStateInput, user.territory.state)
    await this.helpers.fillFormField(this.territoryZipInput, user.territory.zip)

    // Wait for territory lookup to complete
    await this.page.waitForTimeout(1000)

    if (message && await this.messageTextarea.isVisible()) {
      await this.helpers.fillFormField(this.messageTextarea, message)
    }
  }

  /**
   * Complete entire form
   */
  async fillCompleteForm(user: FakeUser) {
    // Step 1
    await this.fillContactStep(user)
    await this.clickNext()

    // Wait for step 2 to be visible
    await this.roleInput.waitFor({ state: 'visible', timeout: 5000 })

    // Step 2
    await this.fillBusinessStep(user)
    await this.clickNext()

    // Wait for step 3 to be visible
    await this.territoryCityInput.waitFor({ state: 'visible', timeout: 5000 })

    // Step 3
    await this.fillTerritoryStep(user, user.message)
  }

  /**
   * Click next button
   */
  async clickNext() {
    await this.nextButton.waitFor({ state: 'visible', timeout: 5000 })
    await this.nextButton.click()
    await this.page.waitForTimeout(500) // Wait for step transition
  }

  /**
   * Click previous button
   */
  async clickPrevious() {
    await this.previousButton.waitFor({ state: 'visible', timeout: 5000 })
    await this.previousButton.click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Submit form
   */
  async submit() {
    await this.submitButton.waitFor({ state: 'visible', timeout: 5000 })
    await this.submitButton.click()
  }

  /**
   * Check if on specific step
   */
  async isOnStep(stepNumber: number): Promise<boolean> {
    const stepText = await this.currentStep.textContent()
    return stepText?.includes(String(stepNumber)) ?? false
  }

  /**
   * Verify form validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    const errorCount = await this.errorMessages.count()
    return errorCount > 0
  }

  /**
   * Get error messages
   */
  async getErrorMessages(): Promise<string[]> {
    const errors: string[] = []
    const count = await this.errorMessages.count()
    for (let i = 0; i < count; i++) {
      const text = await this.errorMessages.nth(i).textContent()
      if (text) errors.push(text)
    }
    return errors
  }

  /**
   * Check if form submitted successfully
   */
  async isSubmitted(): Promise<boolean> {
    const successVisible = await this.successMessage.isVisible({ timeout: 5000 }).catch(() => false)
    const submittedIndicator = await this.page.locator('[data-testid="form-submitted"], .submitted').isVisible({ timeout: 1000 }).catch(() => false)
    return successVisible || submittedIndicator
  }

  /**
   * Select a territory match if available
   */
  async selectTerritoryMatch(index = 0) {
    if (await this.territoryMatches.isVisible({ timeout: 2000 })) {
      const buttons = this.territoryMatchButtons
      const count = await buttons.count()
      if (count > index) {
        await buttons.nth(index).click()
        await this.page.waitForTimeout(500)
      }
    }
  }
}

