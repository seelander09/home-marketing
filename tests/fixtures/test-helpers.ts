import { Locator, Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private readonly page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for element to be visible and interactable
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { 
      state: 'visible',
      timeout 
    });
  }

  /**
   * Fill form field with validation
   */
  async fillFormField(target: Locator | string, value: string, options?: { clear?: boolean }) {
    const field = typeof target === 'string' ? this.page.locator(target) : target;
    await field.waitFor({ state: 'visible' });
    
    if (options?.clear) {
      await field.clear();
    }
    
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }

  /**
   * Click element with retry logic
   */
  async clickWithRetry(selector: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.click(selector);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content safely
   */
  async getTextContent(selector: string): Promise<string | null> {
    try {
      const element = this.page.locator(selector);
      await element.waitFor({ state: 'visible', timeout: 5000 });
      return await element.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string, timeout = 10000) {
    const response = await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
    return response;
  }

  /**
   * Check page performance metrics
   */
  async checkPerformanceMetrics() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    return metrics;
  }

  /**
   * Mock API response for testing
   */
  async mockApiResponse(urlPattern: string, mockData: any) {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });
  }

  /**
   * Check accessibility basics
   */
  async checkAccessibility() {
    // Check for proper heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check for form labels
    const inputs = await this.page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        await expect(label).toHaveCount(1);
      }
    }
  }

  /**
   * Generate random test data
   */
  generateRandomData() {
    const randomId = Math.random().toString(36).substring(7);
    return {
      email: `test-${randomId}@example.com`,
      phone: `555-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: `Test User ${randomId}`
    };
  }
}
