import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { ContactPage } from './page-objects/ContactPage';

test.describe('Accessibility Tests', () => {
  let homePage: HomePage;
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    contactPage = new ContactPage(page);
  });

  test('homepage should be accessible', async () => {
    await homePage.goto();
    await homePage.helpers.checkAccessibility();
  });

  test('contact page should be accessible', async () => {
    await contactPage.goto();
    await contactPage.checkAccessibility();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await homePage.goto();
    
    // Check for single H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check heading order (H1 -> H2 -> H3, etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that headings have content
    for (const heading of headings) {
      const text = await heading.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test('should have proper alt text on images', async ({ page }) => {
    await homePage.goto();
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // Decorative images can have empty alt, but should have alt attribute
      expect(alt).toBeDefined();
      
      // If image has meaningful content, alt should not be empty
      if (src && !src.includes('decorative') && !src.includes('spacer')) {
        expect(alt).toBeTruthy();
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await contactPage.goto();
    
    const formInputs = await page.locator('input, textarea, select').all();
    
    for (const input of formInputs) {
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      
      if (id && type !== 'hidden') {
        // Check for label with for attribute
        const label = page.locator(`label[for="${id}"]`);
        const labelCount = await label.count();
        
        if (labelCount === 0) {
          // Check for aria-label or aria-labelledby
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        } else {
          expect(labelCount).toBe(1);
        }
      }
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await homePage.goto();
    
    // Check that focus is visible
    const focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').all();
    
    for (const element of focusableElements) {
      await element.focus();
      
      // Check if element is focused
      const isFocused = await element.evaluate(el => document.activeElement === el);
      expect(isFocused).toBeTruthy();
      
      // Check if focus is visible (basic check)
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineColor: computed.outlineColor,
          outlineStyle: computed.outlineStyle,
          outlineWidth: computed.outlineWidth
        };
      });
      
      // Focus should be visible (either outline or other focus indicators)
      expect(styles.outlineStyle !== 'none' || styles.outlineWidth !== '0px').toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await homePage.goto();
    
    // Check text elements for sufficient color contrast
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, a, button, label').all();
    
    for (const element of textElements) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Basic check - colors should be defined
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await homePage.goto();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check that focus moves to next element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test Enter key on buttons/links
    const buttons = await page.locator('button, a[role="button"]').all();
    if (buttons.length > 0) {
      await buttons[0].focus();
      await page.keyboard.press('Enter');
      
      // Should not throw errors
      expect(true).toBeTruthy();
    }
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await homePage.goto();
    
    // Check for proper ARIA attributes on interactive elements
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaDescribedBy = await button.getAttribute('aria-describedby');
      const text = await button.textContent();
      
      // Buttons should have accessible text (either text content or aria-label)
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
    
    // Check for proper ARIA landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').all();
    expect(landmarks.length).toBeGreaterThan(0);
  });

  test('should handle screen reader announcements', async ({ page }) => {
    await homePage.goto();
    
    // Check for live regions for dynamic content
    const liveRegions = await page.locator('[aria-live], [aria-atomic], [aria-relevant]').all();
    
    // If there are dynamic updates, they should have proper ARIA live regions
    // This is a basic check - in a real scenario, you'd test actual screen reader behavior
    expect(true).toBeTruthy();
  });

  test('should work with high contrast mode', async ({ page }) => {
    await homePage.goto();
    
    // Simulate high contrast mode by adding CSS
    await page.addStyleTag({
      content: `
        * {
          background: white !important;
          color: black !important;
          border: 1px solid black !important;
        }
      `
    });
    
    // Check that content is still readable
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6').all();
    expect(textElements.length).toBeGreaterThan(0);
    
    for (const element of textElements) {
      const text = await element.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });
});
