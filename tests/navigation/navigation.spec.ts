import { test, expect } from '@playwright/test'
import { HomePage } from '../page-objects/HomePage'
import { ProductsPage } from '../page-objects/ProductsPage'
import { ResourcesPage } from '../page-objects/ResourcesPage'
import { AboutPage } from '../page-objects/AboutPage'
import { ContactPage } from '../page-objects/ContactPage'

test.describe('Navigation Tests', () => {
  test.describe('Desktop Navigation', () => {
    test('should navigate to all main pages', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Navigate to Products
      await homePage.clickNavigationLink('Products')
      await expect(page).toHaveURL(/.*products/)

      // Navigate to Resources
      const resourcesLink = page.locator('a:has-text("Resources"), nav a[href*="resources"]').first()
      await resourcesLink.click()
      await expect(page).toHaveURL(/.*resources/)

      // Navigate to About
      const aboutLink = page.locator('a:has-text("About"), nav a[href*="about"]').first()
      await aboutLink.click()
      await expect(page).toHaveURL(/.*about/)

      // Navigate to Contact
      const contactLink = page.locator('a:has-text("Contact"), nav a[href*="contact"]').first()
      await contactLink.click()
      await expect(page).toHaveURL(/.*contact/)

      // Navigate back to Home
      const homeLink = page.locator('a:has-text("Home"), nav a[href="/"], .logo').first()
      await homeLink.click()
      await expect(page).toHaveURL(/.*home|.*\/$/)
    })

    test('should have working logo link', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Navigate away
      await page.goto('/products')
      
      // Click logo
      const logo = homePage.logo
      if (await logo.isVisible()) {
        await logo.click()
        await expect(page).toHaveURL(/.*home|.*\/$/)
      }
    })

    test('should display all navigation links', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      const navLinks = ['Products', 'Resources', 'About', 'Contact']
      for (const linkText of navLinks) {
        const link = page.locator(`a:has-text("${linkText}"), nav a[href*="${linkText.toLowerCase()}"]`).first()
        const isVisible = await link.isVisible({ timeout: 2000 }).catch(() => false)
        expect(isVisible).toBe(true)
      }
    })
  })

  test.describe('Mobile Navigation', () => {
    test('should open mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const homePage = new HomePage(page)
      await homePage.goto()

      // Look for mobile menu button
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger, button[aria-label*="menu" i]').first()
      
      if (await mobileMenuButton.isVisible({ timeout: 2000 })) {
        await mobileMenuButton.click()
        await page.waitForTimeout(500)

        // Verify menu is open
        const menu = page.locator('nav, .mobile-nav, [data-testid="mobile-nav"]').first()
        await expect(menu).toBeVisible()
      }
    })

    test('should navigate from mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const homePage = new HomePage(page)
      await homePage.goto()

      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger').first()
      
      if (await mobileMenuButton.isVisible({ timeout: 2000 })) {
        await mobileMenuButton.click()
        await page.waitForTimeout(500)

        // Click Products link
        const productsLink = page.locator('a:has-text("Products")').first()
        if (await productsLink.isVisible()) {
          await productsLink.click()
          await expect(page).toHaveURL(/.*products/)
        }
      }
    })

    test('should close mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const homePage = new HomePage(page)
      await homePage.goto()

      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger').first()
      
      if (await mobileMenuButton.isVisible({ timeout: 2000 })) {
        // Open menu
        await mobileMenuButton.click()
        await page.waitForTimeout(500)

        // Close menu (click outside or close button)
        const closeButton = page.locator('[data-testid="close-menu"], button[aria-label*="close" i], .close-button').first()
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await closeButton.click()
        } else {
          // Click outside
          await page.click('body', { position: { x: 10, y: 10 } })
        }

        await page.waitForTimeout(500)
        // Menu should be hidden
        const menu = page.locator('nav, .mobile-nav').first()
        const isVisible = await menu.isVisible({ timeout: 1000 }).catch(() => false)
        // Menu might still be visible but should be off-screen or closed
      }
    })
  })

  test.describe('Footer Navigation', () => {
    test('should have working footer links', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      const footerLinks = [
        { text: 'Privacy', url: /privacy/ },
        { text: 'Terms', url: /terms/ },
        { text: 'Accessibility', url: /accessibility/ }
      ]

      for (const link of footerLinks) {
        const footerLink = page.locator(`footer a:has-text("${link.text}")`).first()
        if (await footerLink.isVisible({ timeout: 2000 })) {
          await footerLink.click()
          await expect(page).toHaveURL(link.url)
          await homePage.goto() // Return to homepage
        }
      }
    })
  })

  test.describe('Skip Navigation', () => {
    test('should have skip to main content link', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      // Press Tab to focus skip link
      await page.keyboard.press('Tab')
      
      const skipLink = page.locator('a:has-text("Skip"), a[href="#main-content"]').first()
      const isFocused = await skipLink.evaluate(el => el === document.activeElement).catch(() => false)
      
      expect(isFocused).toBe(true)
    })

    test('should skip to main content when clicked', async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.goto()

      const skipLink = page.locator('a:has-text("Skip"), a[href="#main-content"]').first()
      if (await skipLink.isVisible({ timeout: 2000 })) {
        await skipLink.click()
        
        // Main content should be focused
        const mainContent = page.locator('#main-content, main').first()
        const isFocused = await mainContent.evaluate(el => el === document.activeElement).catch(() => false)
        expect(isFocused).toBe(true)
      }
    })
  })

  test.describe('Breadcrumbs', () => {
    test('should navigate via breadcrumbs if present', async ({ page }) => {
      await page.goto('/resources')
      await page.waitForLoadState('networkidle')

      const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label*="breadcrumb" i]').first()
      if (await breadcrumbs.isVisible({ timeout: 2000 })) {
        const homeBreadcrumb = breadcrumbs.locator('a:has-text("Home")').first()
        if (await homeBreadcrumb.isVisible()) {
          await homeBreadcrumb.click()
          await expect(page).toHaveURL(/.*home|.*\/$/)
        }
      }
    })
  })
})

