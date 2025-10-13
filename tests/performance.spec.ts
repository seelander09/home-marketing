import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { ContactPage } from './page-objects/ContactPage';
import { testData } from './fixtures/test-data';

test.describe('Performance Tests', () => {
  let homePage: HomePage;
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    contactPage = new ContactPage(page);
  });

  test('homepage should load within performance budget', async () => {
    const startTime = Date.now();
    await homePage.goto();
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(testData.performance.pageLoadTime);
  });

  test('homepage should have good Core Web Vitals', async ({ page }) => {
    await homePage.goto();
    
    // Measure First Contentful Paint (FCP)
    const fcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    expect(fcp).toBeLessThan(testData.performance.firstContentfulPaint);
  });

  test('homepage should have good Largest Contentful Paint (LCP)', async ({ page }) => {
    await homePage.goto();
    
    // Wait for LCP
    await page.waitForLoadState('networkidle');
    
    const lcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lcpEntry = entries[entries.length - 1];
          if (lcpEntry) {
            resolve(lcpEntry.startTime);
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(testData.performance.largestContentfulPaint);
  });

  test('homepage should have good Cumulative Layout Shift (CLS)', async ({ page }) => {
    await homePage.goto();
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });
    
    // CLS should be less than 0.1 for good user experience
    expect(cls).toBeLessThan(0.1);
  });

  test('API endpoints should respond within acceptable time', async ({ request }) => {
    const endpoints = [
      '/api/market/redfin?state=CA',
      '/api/market/census?state=CA',
      '/api/market/economic',
      '/api/market/hud?state=CA'
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`http://localhost:3000${endpoint}`);
      const endTime = Date.now();
      
      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(testData.performance.apiResponseTime);
    }
  });

  test('should handle multiple concurrent requests efficiently', async ({ request }) => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 10 }, () => 
      request.get('http://localhost:3000/api/market/redfin?state=CA')
    );
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // Should handle 10 concurrent requests in reasonable time
    expect(endTime - startTime).toBeLessThan(testData.performance.apiResponseTime * 2);
  });

  test('should cache API responses effectively', async ({ request }) => {
    // First request
    const startTime1 = Date.now();
    const response1 = await request.get('http://localhost:3000/api/market/redfin?state=CA');
    const endTime1 = Date.now();
    
    // Second request (should be faster due to caching)
    const startTime2 = Date.now();
    const response2 = await request.get('http://localhost:3000/api/market/redfin?state=CA');
    const endTime2 = Date.now();
    
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);
    
    const firstRequestTime = endTime1 - startTime1;
    const secondRequestTime = endTime2 - startTime2;
    
    // Second request should be faster (cached)
    expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime);
  });

  test('should handle large datasets efficiently', async ({ request }) => {
    const startTime = Date.now();
    
    // Request comprehensive data for a large state
    const response = await request.get('http://localhost:3000/api/market/comprehensive?state=CA');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('state');
    expect(data).toHaveProperty('redfin');
    expect(data).toHaveProperty('census');
    expect(data).toHaveProperty('economic');
    
    // Should handle large datasets in reasonable time
    expect(responseTime).toBeLessThan(testData.performance.apiResponseTime * 3);
  });

  test('should minimize bundle size', async ({ page }) => {
    await homePage.goto();
    
    // Check for unnecessary JavaScript bundles
    const jsResources = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => ({
        src: script.getAttribute('src'),
        size: script.textContent?.length || 0
      }));
    });
    
    // Should not have excessive inline JavaScript
    const totalInlineSize = jsResources.reduce((sum, script) => sum + script.size, 0);
    expect(totalInlineSize).toBeLessThan(100000); // 100KB limit for inline JS
  });

  test('should load images efficiently', async ({ page }) => {
    await homePage.goto();
    
    // Check image loading performance
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      
      if (src && !src.includes('data:') && !src.includes('placeholder')) {
        // Check if image has loading attribute
        const loading = await img.getAttribute('loading');
        expect(loading).toBeTruthy(); // Should have lazy loading
      }
    }
  });

  test('should handle slow network conditions', async ({ page, context }) => {
    // Simulate slow 3G connection
    await context.route('**/*', route => {
      // Add delay to simulate slow network
      setTimeout(() => {
        route.continue();
      }, 100);
    });
    
    const startTime = Date.now();
    await homePage.goto();
    const endTime = Date.now();
    
    // Should still load within reasonable time even on slow network
    expect(endTime - startTime).toBeLessThan(testData.performance.pageLoadTime * 2);
  });

  test('should handle memory efficiently', async ({ page }) => {
    await homePage.goto();
    
    // Check memory usage
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (memoryInfo) {
      // Check that memory usage is reasonable
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    }
  });

  test('should handle concurrent page loads', async ({ browser }) => {
    const context = await browser.newContext();
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);
    
    const startTime = Date.now();
    
    await Promise.all([
      pages[0].goto('http://localhost:3000/'),
      pages[1].goto('http://localhost:3000/contact'),
      pages[2].goto('http://localhost:3000/about')
    ]);
    
    const endTime = Date.now();
    
    // All pages should load successfully
    pages.forEach(page => {
      expect(page.url()).toContain('localhost:3000');
    });
    
    // Should handle concurrent loads efficiently
    expect(endTime - startTime).toBeLessThan(testData.performance.pageLoadTime * 2);
    
    await context.close();
  });
});
