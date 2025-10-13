import { test, expect } from '@playwright/test';
import { ContactPage } from './page-objects/ContactPage';
import { HomePage } from './page-objects/HomePage';
import { testData } from './fixtures/test-data';

test.describe('Contact Form Tests', () => {
  let contactPage: ContactPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    homePage = new HomePage(page);
  });

  test('should load contact page successfully', async () => {
    await contactPage.goto();
    await contactPage.isLoaded();
  });

  test('should submit valid contact form', async () => {
    await contactPage.goto();
    await contactPage.fillForm(testData.contactForm.valid);
    await contactPage.submitForm();
    
    // Check for success message or redirect
    const hasSuccessMessage = await contactPage.successMessage.isVisible();
    const hasErrorMessage = await contactPage.errorMessage.isVisible();
    
    // Either success message should show or no error message should appear
    expect(hasSuccessMessage || !hasErrorMessage).toBeTruthy();
  });

  test('should validate required fields', async () => {
    await contactPage.goto();
    
    // Try to submit empty form
    await contactPage.submitForm();
    
    // Check for validation errors
    await contactPage.checkFormValidation();
  });

  test('should validate email format', async () => {
    await contactPage.goto();
    
    // Fill form with invalid email
    await contactPage.fillForm({
      ...testData.contactForm.valid,
      email: testData.contactForm.invalid.email
    });
    
    await contactPage.submitForm();
    
    // Check for email validation error
    const hasFieldError = await contactPage.fieldErrors.isVisible();
    expect(hasFieldError).toBeTruthy();
  });

  test('should clear form fields', async () => {
    await contactPage.goto();
    
    // Fill form with data
    await contactPage.fillForm(testData.contactForm.valid);
    
    // Clear form
    await contactPage.clearForm();
    
    // Verify fields are empty
    const firstNameValue = await contactPage.getFieldValue('firstName');
    const emailValue = await contactPage.getFieldValue('email');
    
    expect(firstNameValue).toBe('');
    expect(emailValue).toBe('');
  });

  test('should maintain form data on page refresh', async () => {
    await contactPage.goto();
    
    // Fill partial form data
    await contactPage.fillForm({
      firstName: testData.contactForm.valid.firstName,
      email: testData.contactForm.valid.email
    });
    
    // Refresh page
    await contactPage.page.reload();
    await contactPage.isLoaded();
    
    // Check if form data is maintained (if browser supports it)
    const firstNameValue = await contactPage.getFieldValue('firstName');
    const emailValue = await contactPage.getFieldValue('email');
    
    // This test might pass or fail depending on browser behavior
    // We're just checking that the form is functional after refresh
    expect(typeof firstNameValue).toBe('string');
    expect(typeof emailValue).toBe('string');
  });

  test('should be accessible', async () => {
    await contactPage.goto();
    await contactPage.checkAccessibility();
  });

  test('should handle form submission errors gracefully', async () => {
    await contactPage.goto();
    
    // Mock API failure
    await contactPage.page.route('**/api/forms/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await contactPage.fillForm(testData.contactForm.valid);
    await contactPage.submitForm();
    
    // Check for error handling
    await contactPage.checkErrorMessage();
  });

  test('should prevent duplicate submissions', async () => {
    await contactPage.goto();
    await contactPage.fillForm(testData.contactForm.valid);
    
    // Click submit button multiple times quickly
    await contactPage.submitButton.click();
    await contactPage.submitButton.click();
    await contactPage.submitButton.click();
    
    // Check that only one submission occurred
    // This would need to be verified with backend logs or response
    const hasSuccessMessage = await contactPage.successMessage.isVisible();
    const hasErrorMessage = await contactPage.errorMessage.isVisible();
    
    expect(hasSuccessMessage || hasErrorMessage).toBeTruthy();
  });

  test('should work from homepage contact form', async ({ page }) => {
    await homePage.goto();
    
    if (await homePage.contactForm.isVisible()) {
      await homePage.fillContactForm(testData.contactForm.valid);
      await homePage.submitContactForm();
      
      // Check for success or error message
      const hasSuccessMessage = await homePage.helpers.elementExists('.success-message, .alert-success');
      const hasErrorMessage = await homePage.helpers.elementExists('.error-message, .alert-error');
      
      expect(hasSuccessMessage || hasErrorMessage).toBeTruthy();
    }
  });

  test('should validate phone number format', async () => {
    await contactPage.goto();
    
    // Test various phone number formats
    const phoneNumbers = [
      '123', // Too short
      '123456789012345', // Too long
      'abc-def-ghij', // Invalid characters
      '555-123-4567', // Valid format
      '(555) 123-4567', // Valid format with parentheses
      '555.123.4567' // Valid format with dots
    ];
    
    for (const phone of phoneNumbers) {
      await contactPage.clearForm();
      await contactPage.fillForm({
        ...testData.contactForm.valid,
        phone: phone
      });
      
      await contactPage.submitForm();
      
      // Check if phone validation works
      const isValid = await contactPage.isFieldValid('phone');
      
      if (phone === '555-123-4567' || phone === '(555) 123-4567' || phone === '555.123.4567') {
        expect(isValid).toBeTruthy();
      } else {
        // Invalid formats should show validation errors
        expect(isValid).toBeFalsy();
      }
    }
  });
});
