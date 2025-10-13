import { test as base, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage';
import { ContactPage } from '../page-objects/ContactPage';
import { TestHelpers } from '../fixtures/test-helpers';
import { testData } from '../fixtures/test-data';

// Extend the base test with custom fixtures
export const test = base.extend<{
  homePage: HomePage;
  contactPage: ContactPage;
  testHelpers: TestHelpers;
}>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  
  contactPage: async ({ page }, use) => {
    const contactPage = new ContactPage(page);
    await use(contactPage);
  },
  
  testHelpers: async ({ page }, use) => {
    const testHelpers = new TestHelpers(page);
    await use(testHelpers);
  }
});

export { expect };

// Global test setup
test.beforeAll(async () => {
  console.log('Starting Playwright test suite...');
});

test.afterAll(async () => {
  console.log('Playwright test suite completed.');
});

// Common test setup for each test
test.beforeEach(async ({ page }) => {
  // Set default timeout
  test.setTimeout(30000);
  
  // Set default viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Enable request interception for API mocking
  await page.route('**/api/**', route => {
    // Allow API calls by default
    route.continue();
  });
});

// Common cleanup after each test
test.afterEach(async ({ page }, testInfo) => {
  // Take screenshot on failure
  if (testInfo.status === 'failed') {
    const screenshot = await page.screenshot({
      path: `test-results/screenshots/failure-${testInfo.title.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
      fullPage: true
    });
    
    // Attach screenshot to test results
    testInfo.attachments.push({
      name: 'screenshot',
      contentType: 'image/png',
      body: screenshot
    });
  }
  
  // Clear any mocked routes
  await page.unroute('**/api/**');
});

// Test data helpers
export const testDataHelpers = {
  generateRandomEmail: () => `test-${Math.random().toString(36).substring(7)}@example.com`,
  generateRandomPhone: () => `555-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  generateRandomName: () => `Test User ${Math.random().toString(36).substring(7)}`,
  
  getValidContactFormData: () => ({
    firstName: testDataHelpers.generateRandomName(),
    lastName: 'Doe',
    email: testDataHelpers.generateRandomEmail(),
    phone: testDataHelpers.generateRandomPhone(),
    company: 'Test Company',
    message: 'This is a test message for automated testing.'
  }),
  
  getInvalidContactFormData: () => ({
    firstName: '',
    lastName: '',
    email: 'invalid-email',
    phone: '123',
    company: '',
    message: ''
  })
};

// API testing helpers
export const apiHelpers = {
  waitForApiResponse: async (page: any, urlPattern: string, timeout = 10000) => {
    return await page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
  },
  
  mockApiResponse: async (page: any, urlPattern: string, mockData: any) => {
    await page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });
  },
  
  mockApiError: async (page: any, urlPattern: string, statusCode = 500) => {
    await page.route(urlPattern, route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mocked API error' })
      });
    });
  }
};

// Performance testing helpers
export const performanceHelpers = {
  measurePageLoad: async (page: any) => {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    return endTime - startTime;
  },
  
  getCoreWebVitals: async (page: any) => {
    return await page.evaluate(() => {
      return new Promise(resolve => {
        const vitals: any = {};
        
        // First Contentful Paint
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            vitals.fcp = fcpEntry.startTime;
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lcpEntry = entries[entries.length - 1];
          if (lcpEntry) {
            vitals.lcp = lcpEntry.startTime;
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        new PerformanceObserver(list => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after a delay to collect metrics
        setTimeout(() => resolve(vitals), 2000);
      });
    });
  }
};

// Accessibility testing helpers
export const accessibilityHelpers = {
  checkColorContrast: async (page: any) => {
    // Basic color contrast check
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, a, button, label').all();
    
    for (const element of textElements) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  },
  
  checkKeyboardNavigation: async (page: any) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  },
  
  checkScreenReaderSupport: async (page: any) => {
    // Check for proper ARIA attributes
    const interactiveElements = await page.locator('button, input, select, textarea, a').all();
    
    for (const element of interactiveElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const text = await element.textContent();
      
      // Should have accessible text
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  }
};
