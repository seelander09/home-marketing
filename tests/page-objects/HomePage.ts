import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../fixtures/test-helpers';

export class HomePage {
  public readonly helpers: TestHelpers;
  
  // Navigation elements
  public readonly navigation: Locator;
  public readonly logo: Locator;
  public readonly mainNav: Locator;
  
  // Hero section
  public readonly heroSection: Locator;
  public readonly heroTitle: Locator;
  public readonly heroSubtitle: Locator;
  public readonly ctaButton: Locator;
  
  // Features section
  public readonly featuresSection: Locator;
  public readonly featureCards: Locator;
  
  // Contact form
  public readonly contactForm: Locator;
  public readonly firstNameInput: Locator;
  public readonly lastNameInput: Locator;
  public readonly emailInput: Locator;
  public readonly phoneInput: Locator;
  public readonly companyInput: Locator;
  public readonly messageTextarea: Locator;
  public readonly submitButton: Locator;
  
  // Footer
  public readonly footer: Locator;
  public readonly footerLinks: Locator;

  constructor(public readonly page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Navigation
    this.navigation = page.locator('nav');
    this.logo = page.locator('[data-testid="logo"], .logo, header img').first();
    this.mainNav = page.locator('nav ul, .main-nav');
    
    // Hero section
    this.heroSection = page.locator('[data-testid="hero"], .hero, section:has(h1)').first();
    this.heroTitle = page.locator('h1').first();
    this.heroSubtitle = page.locator('.hero p, .hero .subtitle, h1 + p').first();
    this.ctaButton = page.locator('.hero button, .hero a[role="button"], .cta-button').first();
    
    // Features section
    this.featuresSection = page.locator('[data-testid="features"], .features, section:has(h2)').first();
    this.featureCards = page.locator('.feature-card, .feature, [data-testid="feature-card"]');
    
    // Contact form
    this.contactForm = page.locator('form, [data-testid="contact-form"], .contact-form');
    this.firstNameInput = page.locator('input[name="firstName"], input[name="first_name"], #firstName');
    this.lastNameInput = page.locator('input[name="lastName"], input[name="last_name"], #lastName');
    this.emailInput = page.locator('input[name="email"], input[type="email"], #email');
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"], #phone');
    this.companyInput = page.locator('input[name="company"], #company');
    this.messageTextarea = page.locator('textarea[name="message"], #message');
    this.submitButton = page.locator('button[type="submit"], input[type="submit"], .submit-button');
    
    // Footer
    this.footer = page.locator('footer');
    this.footerLinks = page.locator('footer a');
  }

  async goto() {
    await this.page.goto('/');
    await this.helpers.waitForPageLoad();
  }

  async isLoaded() {
    await expect(this.page).toHaveTitle(/home|marketing|real estate/i);
    await expect(this.heroTitle).toBeVisible();
  }

  async fillContactForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    message: string;
  }) {
    if (await this.contactForm.isVisible()) {
      await this.helpers.fillFormField(this.firstNameInput, data.firstName);
      await this.helpers.fillFormField(this.lastNameInput, data.lastName);
      await this.helpers.fillFormField(this.emailInput, data.email);
      await this.helpers.fillFormField(this.phoneInput, data.phone);
      await this.helpers.fillFormField(this.companyInput, data.company);
      await this.helpers.fillFormField(this.messageTextarea, data.message);
    }
  }

  async submitContactForm() {
    if (await this.submitButton.isVisible()) {
      await this.submitButton.click();
      // Wait for form submission response
      await this.page.waitForTimeout(2000);
    }
  }

  async getFeatureCards() {
    await this.featuresSection.waitFor({ state: 'visible' });
    const cards = await this.featureCards.all();
    return cards.map(async card => ({
      title: await card.locator('h3, h4, .title').textContent(),
      description: await card.locator('p, .description').textContent(),
      isVisible: await card.isVisible()
    }));
  }

  async clickNavigationLink(linkText: string) {
    const link = this.mainNav.locator(`a:has-text("${linkText}")`);
    await link.click();
    await this.helpers.waitForPageLoad();
  }

  async clickCTAButton() {
    await this.ctaButton.click();
    await this.helpers.waitForPageLoad();
  }

  async checkHeroSection() {
    await expect(this.heroSection).toBeVisible();
    await expect(this.heroTitle).toBeVisible();
    await expect(this.heroSubtitle).toBeVisible();
    await expect(this.ctaButton).toBeVisible();
  }

  async checkNavigation() {
    await expect(this.navigation).toBeVisible();
    await expect(this.logo).toBeVisible();
    await expect(this.mainNav).toBeVisible();
  }

  async checkFooter() {
    await expect(this.footer).toBeVisible();
    const linkCount = await this.footerLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  }

  async scrollToSection(sectionSelector: string) {
    await this.page.locator(sectionSelector).scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
  }

  async getPageMetrics() {
    return await this.helpers.checkPerformanceMetrics();
  }
}
