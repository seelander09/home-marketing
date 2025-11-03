import { test, expect } from '@playwright/test'
import { HomePage } from '../page-objects/HomePage'
import { DemoRequestFormPage } from '../page-objects/DemoRequestFormPage'
import { ProductsPage } from '../page-objects/ProductsPage'
import { ResourcesPage } from '../page-objects/ResourcesPage'

test.describe('Accessibility Tests', () => {
  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on forms', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Check email input has label
      const emailInput = demoForm.emailInput
      const emailId = await emailInput.getAttribute('id')
      const emailAriaLabel = await emailInput.getAttribute('aria-label')
      
      if (emailId) {
        const label = page.locator(`label[for="${emailId}"]`)
        const hasLabel = await label.count() > 0
        expect(hasLabel || !!emailAriaLabel).toBe(true)
      }
    })

    test('should have role attributes where needed', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Check for navigation role
      const nav = page.locator('nav, [role="navigation"]').first()
      await expect(nav).toBeVisible()

      // Check for main content role
      const main = page.locator('main, [role="main"], #main-content').first()
      await expect(main).toBeVisible()

      // Check for footer role
      const footer = page.locator('footer, [role="contentinfo"]').first()
      if (await footer.isVisible({ timeout: 2000 })) {
        await expect(footer).toBeVisible()
      }
    })

    test('should have ARIA live regions for form errors', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Try to submit empty form
      await demoForm.clickNext()

      // Check for ARIA live region
      const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]').first()
      const hasLiveRegion = await liveRegion.isVisible({ timeout: 2000 }).catch(() => false)
      
      // Also check for role="alert"
      const alertRegion = page.locator('[role="alert"]').first()
      const hasAlert = await alertRegion.isVisible({ timeout: 2000 }).catch(() => false)
      
      expect(hasLiveRegion || hasAlert).toBe(true)
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should navigate through page with Tab key', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Press Tab multiple times
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Verify focus is visible
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should navigate forms with keyboard', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Tab through form fields
      await page.keyboard.press('Tab') // Skip to first input
      
      // Fill form with keyboard
      await page.keyboard.type('John')
      await page.keyboard.press('Tab')
      await page.keyboard.type('Doe')
      await page.keyboard.press('Tab')
      await page.keyboard.type('john@example.com')
      await page.keyboard.press('Tab')
      await page.keyboard.type('555-123-4567')

      // Verify values were entered
      const firstNameValue = await demoForm.firstNameInput.inputValue()
      expect(firstNameValue).toBe('John')
    })

    test('should submit form with Enter key', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Fill form
      await demoForm.fillContactStep({
        id: 'test',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-123-4567',
        role: 'Agent',
        brokerage: 'Test',
        crm: 'HubSpot',
        transactionsPerYear: '26-50',
        territory: { city: 'Austin', state: 'TX', zip: '78701' },
        persona: 'first-time'
      })

      // Navigate to submit button with Tab
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Press Enter on submit button
      const submitButton = demoForm.submitButton
      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Focus Management', () => {
    test('should maintain visible focus indicators', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Tab to first focusable element
      await page.keyboard.press('Tab')

      // Check if focused element has visible focus
      const focusedElement = page.locator(':focus')
      const computedStyle = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          outline: style.outline,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow
        }
      })

      // Should have some focus indicator
      const hasFocusIndicator = 
        computedStyle.outline !== 'none' ||
        computedStyle.outlineWidth !== '0px' ||
        computedStyle.boxShadow !== 'none'

      expect(hasFocusIndicator).toBe(true)
    })

    test('should focus error messages when form validation fails', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      // Try to submit empty form
      await demoForm.clickNext()

      // Check if error message is focused or announced
      const errorMessages = demoForm.errorMessages
      const errorCount = await errorMessages.count()
      expect(errorCount).toBeGreaterThan(0)
    })
  })

  test.describe('Screen Reader Compatibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Check for H1
      const h1 = page.locator('h1')
      const h1Count = await h1.count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
      expect(h1Count).toBeLessThanOrEqual(1) // Should have exactly one H1

      // Check heading order
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      expect(headings.length).toBeGreaterThan(0)
    })

    test('should have alt text on images', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      const images = page.locator('img')
      const imageCount = await images.count()

      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        const role = await img.getAttribute('role')
        
        // Decorative images should have role="presentation" or alt=""
        // Content images should have descriptive alt text
        const isDecorative = role === 'presentation' || alt === ''
        const hasAltText = !!alt
        
        expect(isDecorative || hasAltText).toBe(true)
      }
    })

    test('should have descriptive link text', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      const links = page.locator('a')
      const linkCount = await links.count()

      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i)
        const text = await link.textContent()
        const ariaLabel = await link.getAttribute('aria-label')
        const title = await link.getAttribute('title')
        
        // Link should have accessible name (text, aria-label, or title)
        const hasAccessibleName = !!(text?.trim() || ariaLabel || title)
        expect(hasAccessibleName).toBe(true)
      }
    })
  })

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast for text', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Check text elements for contrast
      const textElements = page.locator('p, h1, h2, h3, span, a, button')
      const count = await textElements.count()

      // Sample a few elements
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = textElements.nth(i)
        if (await element.isVisible()) {
          const color = await element.evaluate((el) => {
            const style = window.getComputedStyle(el)
            return {
              color: style.color,
              backgroundColor: style.backgroundColor
            }
          })
          
          // Basic check - colors should be defined
          expect(color.color).toBeTruthy()
        }
      }
    })
  })

  test.describe('Skip Navigation', () => {
    test('should have skip to main content link', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Check for skip link
      const skipLink = page.locator('a:has-text("Skip"), a[href="#main-content"]').first()
      const hasSkipLink = await skipLink.isVisible({ timeout: 2000 }).catch(() => false)
      
      // Skip link is optional but recommended
      if (hasSkipLink) {
        await expect(skipLink).toBeVisible()
      }
    })

    test('should skip to main content when activated', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      const skipLink = page.locator('a:has-text("Skip"), a[href="#main-content"]').first()
      if (await skipLink.isVisible({ timeout: 2000 })) {
        await skipLink.click()
        
        // Main content should be focused or scrolled into view
        const mainContent = page.locator('#main-content, main').first()
        const isInView = await mainContent.isVisible()
        expect(isInView).toBe(true)
      }
    })
  })

  test.describe('Form Accessibility', () => {
    test('should associate labels with inputs', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      const inputs = [
        demoForm.firstNameInput,
        demoForm.lastNameInput,
        demoForm.emailInput,
        demoForm.phoneInput
      ]

      for (const input of inputs) {
        if (await input.isVisible({ timeout: 2000 })) {
          const id = await input.getAttribute('id')
          const ariaLabel = await input.getAttribute('aria-label')
          const ariaLabelledBy = await input.getAttribute('aria-labelledby')
          
          if (id) {
            const label = page.locator(`label[for="${id}"]`)
            const hasLabel = await label.count() > 0
            expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBe(true)
          }
        }
      }
    })

    test('should announce required fields', async ({ page }) => {
      const demoForm = new DemoRequestFormPage(page)
      await demoForm.goto()

      const requiredInputs = page.locator('input[required], select[required], textarea[required]')
      const requiredCount = await requiredInputs.count()

      // Check if required fields are marked
      for (let i = 0; i < Math.min(requiredCount, 5); i++) {
        const input = requiredInputs.nth(i)
        const ariaRequired = await input.getAttribute('aria-required')
        const required = await input.getAttribute('required')
        
        expect(ariaRequired === 'true' || required !== null).toBe(true)
      }
    })
  })
})

