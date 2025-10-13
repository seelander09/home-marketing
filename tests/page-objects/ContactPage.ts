import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../fixtures/test-helpers';

export class ContactPage {
  private helpers: TestHelpers;
  
  // Page elements
  public readonly pageTitle: Locator;
  public readonly contactForm: Locator;
  public readonly successMessage: Locator;
  public readonly errorMessage: Locator;
  
  // Form fields
  public readonly firstNameInput: Locator;
  public readonly lastNameInput: Locator;
  public readonly emailInput: Locator;
  public readonly phoneInput: Locator;
  public readonly companyInput: Locator;
  public readonly messageTextarea: Locator;
  public readonly submitButton: Locator;
  
  // Form validation
  public readonly fieldErrors: Locator;
  public readonly requiredFields: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    this.pageTitle = page.locator('h1').first();
    this.contactForm = page.locator('form, [data-testid="contact-form"]');
    this.successMessage = page.locator('.success-message, .alert-success, [data-testid="success"]');
    this.errorMessage = page.locator('.error-message, .alert-error, [data-testid="error"]');
    
    // Form fields
    this.firstNameInput = page.locator('input[name="firstName"], input[name="first_name"], #firstName');
    this.lastNameInput = page.locator('input[name="lastName"], input[name="last_name"], #lastName');
    this.emailInput = page.locator('input[name="email"], input[type="email"], #email');
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"], #phone');
    this.companyInput = page.locator('input[name="company"], #company');
    this.messageTextarea = page.locator('textarea[name="message"], #message');
    this.submitButton = page.locator('button[type="submit"], input[type="submit"], .submit-button');
    
    // Validation elements
    this.fieldErrors = page.locator('.field-error, .error, [data-testid="field-error"]');
    this.requiredFields = page.locator('[required], .required');
  }

  async goto() {
    await this.page.goto('/contact');
    await this.helpers.waitForPageLoad();
  }

  async isLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.contactForm).toBeVisible();
  }

  async fillForm(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    message?: string;
  }) {
    if (data.firstName && await this.firstNameInput.isVisible()) {
      await this.helpers.fillFormField(this.firstNameInput, data.firstName);
    }
    
    if (data.lastName && await this.lastNameInput.isVisible()) {
      await this.helpers.fillFormField(this.lastNameInput, data.lastName);
    }
    
    if (data.email && await this.emailInput.isVisible()) {
      await this.helpers.fillFormField(this.emailInput, data.email);
    }
    
    if (data.phone && await this.phoneInput.isVisible()) {
      await this.helpers.fillFormField(this.phoneInput, data.phone);
    }
    
    if (data.company && await this.companyInput.isVisible()) {
      await this.helpers.fillFormField(this.companyInput, data.company);
    }
    
    if (data.message && await this.messageTextarea.isVisible()) {
      await this.helpers.fillFormField(this.messageTextarea, data.message);
    }
  }

  async submitForm() {
    await this.submitButton.click();
    await this.page.waitForTimeout(2000); // Wait for form submission
  }

  async checkFormValidation() {
    // Check if required fields show validation errors when empty
    await this.submitButton.click();
    
    const fieldErrors = await this.fieldErrors.count();
    expect(fieldErrors).toBeGreaterThan(0);
  }

  async checkSuccessMessage() {
    await expect(this.successMessage).toBeVisible();
  }

  async checkErrorMessage() {
    await expect(this.errorMessage).toBeVisible();
  }

  async clearForm() {
    const fields = [
      this.firstNameInput,
      this.lastNameInput,
      this.emailInput,
      this.phoneInput,
      this.companyInput,
      this.messageTextarea
    ];

    for (const field of fields) {
      if (await field.isVisible()) {
        await field.clear();
      }
    }
  }

  async getFieldValue(fieldName: string): Promise<string | null> {
    const fieldMap: { [key: string]: Locator } = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      email: this.emailInput,
      phone: this.phoneInput,
      company: this.companyInput,
      message: this.messageTextarea
    };

    const field = fieldMap[fieldName];
    if (field && await field.isVisible()) {
      return await field.inputValue();
    }
    return null;
  }

  async isFieldValid(fieldName: string): Promise<boolean> {
    const fieldMap: { [key: string]: Locator } = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      email: this.emailInput,
      phone: this.phoneInput,
      company: this.companyInput,
      message: this.messageTextarea
    };

    const field = fieldMap[fieldName];
    if (field && await field.isVisible()) {
      const classes = await field.getAttribute('class');
      return !classes?.includes('error') && !classes?.includes('invalid');
    }
    return true;
  }

  async checkAccessibility() {
    // Check for proper form labels
    const formFields = [
      this.firstNameInput,
      this.lastNameInput,
      this.emailInput,
      this.phoneInput,
      this.companyInput,
      this.messageTextarea
    ];

    for (const field of formFields) {
      if (await field.isVisible()) {
        const id = await field.getAttribute('id');
        if (id) {
          const label = this.page.locator(`label[for="${id}"]`);
          await expect(label).toHaveCount(1);
        }
      }
    }

    // Check for required field indicators
    const requiredCount = await this.requiredFields.count();
    expect(requiredCount).toBeGreaterThan(0);
  }
}
