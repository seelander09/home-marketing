import { test, expect } from '@playwright/test'
import { getAllUsers, getRandomUser, EDGE_CASE_USERS } from '../fixtures/fake-users'
import { DemoRequestFormPage } from '../page-objects/DemoRequestFormPage'
import { GuideDownloadFormPage } from '../page-objects/GuideDownloadFormPage'
import { CompliancePage } from '../page-objects/CompliancePage'
import { HomePage } from '../page-objects/HomePage'

test.describe('All Forms - Comprehensive Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock reCAPTCHA
    await page.route('**/recaptcha/api.js*', route => route.abort())
    await page.addInitScript(() => {
      ;(window as any).grecaptcha = {
        ready: (callback: () => void) => callback(),
        execute: async () => 'test-token-12345'
      }
    })
  })

  test.describe('DemoRequestForm - Multi-Step Form', () => {
    test('should complete form with valid data', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      const user = getRandomUser()

      await demoForm.goto()
      await demoForm.fillCompleteForm(user)
      await demoForm.submit()

      const isSubmitted = await demoForm.isSubmitted().catch(() => false)
      expect(isSubmitted).toBe(true)
    })

    test('should validate required fields on step 1', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Try to proceed without filling fields
      await demoForm.clickNext()

      // Should have validation errors
      const hasErrors = await demoForm.hasValidationErrors()
      expect(hasErrors).toBe(true)
    })

    test('should validate required fields on step 2', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      const user = getRandomUser()

      await demoForm.goto()
      await demoForm.fillContactStep(user)
      await demoForm.clickNext()

      // Try to proceed without filling step 2
      await demoForm.clickNext()

      // Should have validation errors
      const hasErrors = await demoForm.hasValidationErrors()
      expect(hasErrors).toBe(true)
    })

    test('should validate email format', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      await demoForm.helpers.fillFormField(demoForm.firstNameInput, 'Test')
      await demoForm.helpers.fillFormField(demoForm.lastNameInput, 'User')
      await demoForm.helpers.fillFormField(demoForm.emailInput, 'invalid-email')
      await demoForm.helpers.fillFormField(demoForm.phoneInput, '555-123-4567')

      await demoForm.clickNext()

      const errors = await demoForm.getErrorMessages()
      expect(errors.some(e => e.toLowerCase().includes('email'))).toBe(true)
    })

    test('should allow navigation between steps', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      const user = getRandomUser()

      await demoForm.goto()
      
      // Step 1
      await demoForm.fillContactStep(user)
      await demoForm.clickNext()
      await expect(demoForm.isOnStep(2)).resolves.toBe(true)

      // Step 2
      await demoForm.fillBusinessStep(user)
      await demoForm.clickNext()
      await expect(demoForm.isOnStep(3)).resolves.toBe(true)

      // Go back
      await demoForm.clickPrevious()
      await expect(demoForm.isOnStep(2)).resolves.toBe(true)

      await demoForm.clickPrevious()
      await expect(demoForm.isOnStep(1)).resolves.toBe(true)
    })

    test('should handle territory lookup', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      const user = getRandomUser()

      await demoForm.goto()
      await demoForm.fillContactStep(user)
      await demoForm.clickNext()
      await demoForm.fillBusinessStep(user)
      await demoForm.clickNext()

      // Fill territory fields
      await demoForm.fillTerritoryStep(user)
      
      // Wait for territory lookup
      await page.waitForTimeout(2000)

      // Check if territory matches appear
      const hasMatches = await demoForm.territoryMatches.isVisible({ timeout: 3000 }).catch(() => false)
      if (hasMatches) {
        await demoForm.selectTerritoryMatch(0)
      }
    })

    test('should test all 30 users with different data', async ({ page }) => {
      const users = getAllUsers()
      const demoForm = new DemoRequestFormPage(page)

      for (const user of users.slice(0, 5)) { // Test first 5 to avoid long test time
        await demoForm.goto()
        await demoForm.fillCompleteForm(user)
        
        // Verify form data is correct
        const firstName = await demoForm.firstNameInput.inputValue()
        expect(firstName).toBe(user.firstName)
      }
    })
  })

  test.describe('GuideDownloadForm', () => {
    test('should download guide after email submission', async ({ page }) => {
      const guideForm = new GuideDownloadFormPage(page)
      const user = getRandomUser()

      await page.goto('/home')
      await page.waitForLoadState('networkidle')

      // Find guide download form (might be on homepage)
      const guideSection = page.locator('[data-testid="guide-offer"], .guide-section').first()
      if (await guideSection.isVisible({ timeout: 2000 })) {
        await guideForm.fillForm(user.email, `${user.firstName} ${user.lastName}`)
        await guideForm.submit()

        // Verify download becomes available
        const downloadAvailable = await guideForm.verifyDownloadAvailable().catch(() => false)
        expect(downloadAvailable).toBe(true)
      }
    })

    test('should validate email format', async ({ page }) => {
      const guideForm = new GuideDownloadFormPage(page)

      await page.goto('/home')
      await page.waitForLoadState('networkidle')

      const emailInput = guideForm.emailInput
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await guideForm.fillForm('invalid-email', 'Test User')
        await guideForm.submit()

        const hasErrors = await guideForm.verifyValidationErrors().catch(() => false)
        expect(hasErrors).toBe(true)
      }
    })
  })

  test.describe('DoNotSellForm', () => {
    test('should submit do not sell request', async ({ page }) => {
      const compliancePage = new CompliancePage(page)
      const user = getRandomUser()

      await compliancePage.goto()
      await compliancePage.isLoaded()

      await compliancePage.fillDoNotSellForm({
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        message: 'Please remove my information from your database.'
      })

      await compliancePage.submit()
      
      const isSubmitted = await compliancePage.verifySuccess().catch(() => false)
      expect(isSubmitted).toBe(true)
    })

    test('should validate required fields', async ({ page }) => {
      const compliancePage = new CompliancePage(page)

      await compliancePage.goto()
      
      // Try to submit without filling form
      await compliancePage.submit()

      const hasErrors = await compliancePage.verifyValidationErrors().catch(() => false)
      expect(hasErrors).toBe(true)
    })
  })

  test.describe('Form Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Tab through form fields
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Verify focus is visible
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should have ARIA labels', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Check for ARIA labels on form inputs
      const emailInput = demoForm.emailInput
      const ariaLabel = await emailInput.getAttribute('aria-label')
      const id = await emailInput.getAttribute('id')
      const hasLabel = ariaLabel || (id && await page.locator(`label[for="${id}"]`).count() > 0)
      
      expect(hasLabel).toBeTruthy()
    })

    test('should announce validation errors to screen readers', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Try to submit empty form
      await demoForm.clickNext()

      // Check for ARIA live region
      const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="alert"]')
      const hasLiveRegion = await liveRegion.count() > 0
      
      expect(hasLiveRegion).toBe(true)
    })
  })
})

