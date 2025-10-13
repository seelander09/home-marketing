import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { testData } from './fixtures/test-data';

test.describe('Homepage Tests', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should load homepage successfully', async () => {
    await homePage.isLoaded();
    await expect(homePage.page).toHaveTitle(/home|marketing|real estate/i);
  });

  test('should display hero section', async () => {
    await homePage.checkHeroSection();
  });

  test('should display navigation', async () => {
    await homePage.checkNavigation();
  });

  test('should display footer', async () => {
    await homePage.checkFooter();
  });

  test('should have working navigation links', async () => {
    // Test main navigation links
    const navLinks = ['About', 'Products', 'Resources', 'Contact'];
    
    for (const link of navLinks) {
      if (await homePage.helpers.elementExists(`a:has-text("${link}")`)) {
        await homePage.clickNavigationLink(link);
        // Verify we're on the correct page
        await expect(homePage.page.url()).toContain(link.toLowerCase());
        await homePage.goto(); // Return to homepage
      }
    }
  });

  test('should have working CTA button', async () => {
    if (await homePage.ctaButton.isVisible()) {
      await homePage.clickCTAButton();
      // Verify CTA button leads somewhere meaningful
      await expect(homePage.page.url()).not.toBe('http://localhost:3000/');
    }
  });

  test('should display feature cards', async () => {
    if (await homePage.featuresSection.isVisible()) {
      const featureCards = await homePage.getFeatureCards();
      expect(featureCards.length).toBeGreaterThan(0);
    }
  });

  test('should handle contact form submission', async () => {
    if (await homePage.contactForm.isVisible()) {
      await homePage.fillContactForm(testData.contactForm.valid);
      await homePage.submitContactForm();
      
      // Check for success or error message
      const hasSuccessMessage = await homePage.helpers.elementExists('.success-message, .alert-success');
      const hasErrorMessage = await homePage.helpers.elementExists('.error-message, .alert-error');
      
      expect(hasSuccessMessage || hasErrorMessage).toBeTruthy();
    }
  });

  test('should validate contact form fields', async () => {
    if (await homePage.contactForm.isVisible()) {
      // Try to submit empty form
      await homePage.submitContactForm();
      
      // Check for validation errors
      const hasValidationErrors = await homePage.helpers.elementExists('.field-error, .error, .invalid');
      expect(hasValidationErrors).toBeTruthy();
    }
  });

  test('should be accessible', async () => {
    await homePage.helpers.checkAccessibility();
  });

  test('should meet performance requirements', async () => {
    const metrics = await homePage.getPageMetrics();
    
    // Check load time
    expect(metrics.loadTime).toBeLessThan(testData.performance.pageLoadTime);
    expect(metrics.domContentLoaded).toBeLessThan(testData.performance.pageLoadTime);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await homePage.isLoaded();
    await homePage.checkNavigation();
    
    // Check if mobile menu is accessible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(homePage.mainNav).toBeVisible();
    }
  });

  test('should have proper SEO elements', async () => {
    // Check for meta description
    const metaDescription = await homePage.page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);

    // Check for proper heading structure
    const h1 = await homePage.page.locator('h1').count();
    expect(h1).toBe(1); // Should have exactly one H1

    // Check for structured data
    const structuredData = await homePage.page.locator('script[type="application/ld+json"]').count();
    expect(structuredData).toBeGreaterThan(0);
  });
});
