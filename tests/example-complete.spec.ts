import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { ContactPage } from './page-objects/ContactPage';
import { testDataHelpers } from './setup/test-setup';

/**
 * Example comprehensive test that demonstrates the complete Playwright setup
 * This test shows how to use page objects, test helpers, and API testing together
 */
test.describe('Complete Example Test Suite', () => {
  let homePage: HomePage;
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    contactPage = new ContactPage(page);
  });

  test('complete user journey: homepage to contact form submission', async ({ page, request }) => {
    // Step 1: Load homepage and verify it's working
    await homePage.goto();
    await homePage.isLoaded();
    
    // Verify homepage elements
    await homePage.checkHeroSection();
    await homePage.checkNavigation();
    
    // Step 2: Navigate to contact page
    await homePage.clickNavigationLink('Contact');
    await contactPage.isLoaded();
    
    // Step 3: Fill and submit contact form
    const formData = testDataHelpers.getValidContactFormData();
    await contactPage.fillForm(formData);
    await contactPage.submitForm();
    
    // Step 4: Verify form submission
    const hasSuccessMessage = await contactPage.successMessage.isVisible();
    const hasErrorMessage = await contactPage.errorMessage.isVisible();
    
    // Either success message should show or no error should occur
    expect(hasSuccessMessage || !hasErrorMessage).toBeTruthy();
    
    // Step 5: Test API endpoints are working
    const apiEndpoints = [
      '/api/market/redfin?state=CA',
      '/api/market/census?state=CA',
      '/api/market/economic'
    ];
    
    for (const endpoint of apiEndpoints) {
      const response = await request.get(`http://localhost:3000${endpoint}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('data');
    }
  });

  test('accessibility and performance validation', async ({ page }) => {
    // Load homepage
    await homePage.goto();
    
    // Check accessibility
    await homePage.helpers.checkAccessibility();
    
    // Check performance
    const metrics = await homePage.getPageMetrics();
    expect(metrics.loadTime).toBeLessThan(3000);
    
    // Check responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.checkNavigation();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('error handling and edge cases', async ({ page }) => {
    // Test form validation
    await contactPage.goto();
    
    // Submit empty form
    await contactPage.submitForm();
    await contactPage.checkFormValidation();
    
    // Test invalid email
    await contactPage.fillForm({
      ...testDataHelpers.getValidContactFormData(),
      email: 'invalid-email'
    });
    await contactPage.submitForm();
    
    const hasFieldError = await contactPage.fieldErrors.isVisible();
    expect(hasFieldError).toBeTruthy();
    
    // Test API error handling
    await page.route('**/api/forms/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await contactPage.fillForm(testDataHelpers.getValidContactFormData());
    await contactPage.submitForm();
    await contactPage.checkErrorMessage();
  });

  test('cross-browser compatibility', async ({ page, browserName }) => {
    await homePage.goto();
    await homePage.isLoaded();
    
    // Basic functionality should work across all browsers
    await homePage.checkHeroSection();
    await homePage.checkNavigation();
    
    // Test form functionality
    if (await homePage.contactForm.isVisible()) {
      await homePage.fillContactForm(testDataHelpers.getValidContactFormData());
      await homePage.submitContactForm();
    }
    
    // Verify page loads correctly in different browsers
    expect(page.url()).toContain('localhost:3000');
  });

  test('mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.isLoaded();
    
    // Check mobile navigation
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, .hamburger');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(homePage.mainNav).toBeVisible();
    }
    
    // Check form usability on mobile
    if (await homePage.contactForm.isVisible()) {
      await homePage.fillContactForm(testDataHelpers.getValidContactFormData());
      await homePage.submitContactForm();
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await homePage.goto();
    await homePage.checkNavigation();
  });

  test('data validation and API integration', async ({ page, request }) => {
    // Test comprehensive market data API
    const response = await request.get('http://localhost:3000/api/market/comprehensive?state=CA');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('state');
    expect(data).toHaveProperty('redfin');
    expect(data).toHaveProperty('census');
    expect(data).toHaveProperty('economic');
    expect(data).toHaveProperty('hud');
    expect(data).toHaveProperty('insights');
    
    // Verify data structure
    if (data.insights) {
      expect(data.insights).toHaveProperty('marketHealthScore');
      expect(data.insights).toHaveProperty('affordabilityScore');
      expect(data.insights).toHaveProperty('investmentPotential');
    }
    
    // Test individual API endpoints
    const endpoints = [
      { url: '/api/market/redfin?state=CA', expectedFields: ['state', 'data'] },
      { url: '/api/market/census?state=CA', expectedFields: ['state', 'data'] },
      { url: '/api/market/economic', expectedFields: ['data'] },
      { url: '/api/market/hud?state=CA', expectedFields: ['state', 'data'] }
    ];
    
    for (const endpoint of endpoints) {
      const apiResponse = await request.get(`http://localhost:3000${endpoint.url}`);
      expect(apiResponse.status()).toBe(200);
      
      const apiData = await apiResponse.json();
      endpoint.expectedFields.forEach(field => {
        expect(apiData).toHaveProperty(field);
      });
    }
  });
});
