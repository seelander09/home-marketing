import { test, expect } from '@playwright/test'
import { getAllUsers, getRandomUser, EDGE_CASE_USERS } from '../fixtures/fake-users'
import { DemoRequestFormPage } from '../page-objects/DemoRequestFormPage'
import { HomePage } from '../page-objects/HomePage'

test.describe('User Journey Tests - 30 Fake Users', () => {
  test.beforeEach(async ({ page }) => {
    // Mock reCAPTCHA to avoid actual API calls
    await page.route('**/recaptcha/api.js*', route => route.abort())
    await page.addInitScript(() => {
      // Mock reCAPTCHA v3
      ;(window as any).grecaptcha = {
        ready: (callback: () => void) => callback(),
        execute: async () => 'test-token-12345'
      }
    })
  })

  // Test each of the 30 users
  const users = getAllUsers()
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i]!
    
    test(`User ${i + 1}: ${user.firstName} ${user.lastName} - Complete Demo Request Flow`, async ({ page }) => {
      const homePage = new HomePage(page)
      const demoForm = new DemoRequestFormPage(page)

      await homePage.goto()
      await homePage.isLoaded()

      // Navigate to demo form (might be on homepage or separate page)
      const demoCTA = page.locator('a:has-text("Request Demo"), a:has-text("Get Started"), button:has-text("Request Demo")').first()
      if (await demoCTA.isVisible({ timeout: 2000 })) {
        await demoCTA.click()
        await page.waitForTimeout(1000)
      }

      // Fill and submit the form
      await demoForm.fillCompleteForm(user)
      await demoForm.submit()

      // Verify submission (success message or redirect)
      const isSubmitted = await demoForm.isSubmitted().catch(() => false)
      expect(isSubmitted).toBe(true)
    })
  }

  // Test edge cases
  test('Edge Case: Long Name Handling', async ({ page }) => {
    const demoForm = new DemoRequestFormPage(page)
    await demoForm.goto()

    const user = EDGE_CASE_USERS.longName
    await demoForm.fillContactStep(user)
    
    // Verify long name is accepted
    const firstNameValue = await demoForm.firstNameInput.inputValue()
    expect(firstNameValue).toBe(user.firstName)
  })

  test('Edge Case: Special Characters in Name', async ({ page }) => {
    const demoForm = new DemoRequestFormPage(page)
    await demoForm.goto()

    const user = EDGE_CASE_USERS.specialCharacters
    await demoForm.fillContactStep(user)
    
    // Verify special characters are preserved
    const lastNameValue = await demoForm.lastNameInput.inputValue()
    expect(lastNameValue).toBe(user.lastName)
  })
})

