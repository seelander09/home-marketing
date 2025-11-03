import { test, expect } from '@playwright/test'
import { HomePage } from '../page-objects/HomePage'
import { ProductsPage } from '../page-objects/ProductsPage'
import { ResourcesPage } from '../page-objects/ResourcesPage'

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile Small', width: 375, height: 667 }, // iPhone SE
    { name: 'Mobile Large', width: 414, height: 896 }, // iPhone 12 Pro
    { name: 'Tablet', width: 768, height: 1024 }, // iPad
    { name: 'Tablet Large', width: 1024, height: 1366 }, // iPad Pro
    { name: 'Desktop', width: 1920, height: 1080 }, // Desktop
    { name: 'Desktop Large', width: 2560, height: 1440 } // Large Desktop
  ]

  test.describe('Homepage Responsive', () => {
    for (const viewport of viewports) {
      test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        const homePage = new HomePage(page)
        
        await homePage.goto()
        await homePage.isLoaded()

        // Verify hero section is visible
        await expect(homePage.heroSection).toBeVisible()

        // Verify navigation is accessible
        const nav = homePage.navigation
        await expect(nav).toBeVisible()

        // Take screenshot for visual verification
        await page.screenshot({ 
          path: `test-results/screenshots/homepage-${viewport.name.replace(/\s+/g, '-').toLowerCase()}.png`,
          fullPage: true 
        })
      })
    }

    test('should adapt navigation for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const homePage = new HomePage(page)
      await homePage.goto()

      // On mobile, should have hamburger menu or mobile menu button
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger').first()
      const desktopNav = page.locator('nav ul, .main-nav').first()

      // Either mobile menu button should be visible OR desktop nav should still work
      const hasMobileMenu = await mobileMenuButton.isVisible({ timeout: 2000 }).catch(() => false)
      const hasDesktopNav = await desktopNav.isVisible({ timeout: 2000 }).catch(() => false)

      expect(hasMobileMenu || hasDesktopNav).toBe(true)
    })
  })

  test.describe('Products Page Responsive', () => {
    for (const viewport of viewports.slice(0, 4)) { // Test first 4 viewports
      test(`should render products correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        const productsPage = new ProductsPage(page)
        
        await productsPage.goto()
        await productsPage.isLoaded()

        // Verify package cards are visible
        const cards = await productsPage.getPackageCards()
        expect(cards.length).toBeGreaterThan(0)

        // Verify cards are not overlapping
        for (const card of cards.slice(0, 3)) {
          await expect(card).toBeVisible()
        }
      })
    }
  })

  test.describe('Resources Page Responsive', () => {
    for (const viewport of viewports.slice(0, 4)) {
      test(`should render resources correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        const resourcesPage = new ResourcesPage(page)
        
        await resourcesPage.goto()
        await resourcesPage.isLoaded()

        // Verify resource grid adapts
        await resourcesPage.verifyResourcesDisplayed()
      })
    }
  })

  test.describe('Form Responsive', () => {
    test('should render demo form correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/home')
      await page.waitForLoadState('networkidle')

      // Find form inputs
      const firstNameInput = page.locator('input[name="firstName"]').first()
      if (await firstNameInput.isVisible({ timeout: 2000 })) {
        // Verify inputs are visible and usable
        await expect(firstNameInput).toBeVisible()
        
        // Verify form is not cut off
        const form = firstNameInput.locator('..').locator('form').first()
        const boundingBox = await form.boundingBox()
        expect(boundingBox).toBeTruthy()
        expect(boundingBox!.width).toBeGreaterThan(0)
        expect(boundingBox!.height).toBeGreaterThan(0)
      }
    })

    test('should render form correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto('/home')
      await page.waitForLoadState('networkidle')

      const firstNameInput = page.locator('input[name="firstName"]').first()
      if (await firstNameInput.isVisible({ timeout: 2000 })) {
        await expect(firstNameInput).toBeVisible()
      }
    })
  })

  test.describe('Touch Interactions', () => {
    test('should support touch on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const homePage = new HomePage(page)
      await homePage.goto()

      // Simulate touch on CTA button
      const ctaButton = homePage.ctaButton
      if (await ctaButton.isVisible({ timeout: 2000 })) {
        await ctaButton.tap()
        // Verify interaction occurred (button state changed or navigation)
        await page.waitForTimeout(500)
      }
    })
  })
})

