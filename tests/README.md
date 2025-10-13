# Playwright Test Suite

This directory contains comprehensive end-to-end tests for the home-marketing project using Playwright.

## Test Structure

```
tests/
├── api/                    # API endpoint tests
│   └── market-data.spec.ts # Market data API tests
├── fixtures/               # Test data and helpers
│   ├── test-data.ts        # Test data constants
│   └── test-helpers.ts     # Utility functions
├── page-objects/           # Page Object Model classes
│   ├── HomePage.ts         # Homepage page object
│   └── ContactPage.ts      # Contact page page object
├── setup/                  # Test setup and configuration
│   └── test-setup.ts       # Global test setup
├── accessibility.spec.ts   # Accessibility tests
├── contact-form.spec.ts    # Contact form tests
├── homepage.spec.ts        # Homepage tests
├── performance.spec.ts     # Performance tests
└── README.md              # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report

# Install Playwright browsers
npm run test:e2e:install
```

### Running Specific Test Suites

```bash
# Run only homepage tests
npx playwright test homepage.spec.ts

# Run only API tests
npx playwright test api/

# Run only accessibility tests
npx playwright test accessibility.spec.ts

# Run only performance tests
npx playwright test performance.spec.ts
```

### Running Tests on Specific Browsers

```bash
# Run on Chrome only
npx playwright test --project=chromium

# Run on Firefox only
npx playwright test --project=firefox

# Run on Safari only
npx playwright test --project=webkit

# Run on mobile devices
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Categories

### 1. Homepage Tests (`homepage.spec.ts`)
- Page loading and basic functionality
- Navigation and links
- Hero section display
- Feature cards
- Contact form integration
- SEO elements
- Responsive design

### 2. Contact Form Tests (`contact-form.spec.ts`)
- Form submission with valid data
- Form validation with invalid data
- Email format validation
- Phone number validation
- Form accessibility
- Error handling
- Duplicate submission prevention

### 3. API Tests (`api/market-data.spec.ts`)
- Redfin data API endpoints
- Census data API endpoints
- FRED economic data API
- HUD government data API
- Comprehensive market data API
- Error handling and edge cases
- Performance and response times

### 4. Accessibility Tests (`accessibility.spec.ts`)
- Heading hierarchy
- Alt text on images
- Form labels and accessibility
- Focus management
- Color contrast
- Keyboard navigation
- ARIA attributes
- Screen reader support

### 5. Performance Tests (`performance.spec.ts`)
- Page load times
- Core Web Vitals (FCP, LCP, CLS)
- API response times
- Concurrent request handling
- Caching effectiveness
- Bundle size optimization
- Image loading efficiency
- Memory usage

## Page Object Model

The tests use the Page Object Model pattern for better maintainability:

### HomePage
- Navigation elements
- Hero section
- Features section
- Contact form
- Footer

### ContactPage
- Form fields
- Validation elements
- Success/error messages
- Accessibility features

## Test Data

Test data is centralized in `fixtures/test-data.ts`:
- Contact form data (valid/invalid)
- Market data samples
- API response expectations
- Performance thresholds
- Test URLs

## Test Helpers

Utility functions in `fixtures/test-helpers.ts`:
- Page loading helpers
- Screenshot utilities
- Form filling helpers
- Element interaction helpers
- Performance measurement
- Accessibility checks

## Configuration

### Playwright Config (`playwright.config.ts`)
- Browser configurations
- Test directories
- Retry settings
- Reporter settings
- Web server setup
- Screenshot and video capture

### Test Setup (`tests/setup/test-setup.ts`)
- Global test fixtures
- Common setup/teardown
- Custom test helpers
- API mocking utilities
- Performance measurement helpers

## Best Practices

### Writing Tests
1. Use descriptive test names
2. Follow the Arrange-Act-Assert pattern
3. Use page objects for UI interactions
4. Mock external dependencies when appropriate
5. Test both happy path and error scenarios

### Test Data
1. Use centralized test data
2. Generate random data for unique tests
3. Clean up test data after tests
4. Use realistic test scenarios

### Maintenance
1. Keep tests independent and isolated
2. Use meaningful selectors (data-testid preferred)
3. Add proper waits and timeouts
4. Handle flaky tests appropriately
5. Update tests when UI changes

## Debugging Tests

### Debug Mode
```bash
npm run test:e2e:debug
```

### Screenshots and Videos
- Screenshots are automatically taken on test failures
- Videos are recorded for failed tests
- All artifacts are saved in `test-results/`

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

The test suite is designed to run in CI/CD environments:
- Headless mode by default
- Proper exit codes for failure detection
- HTML and JSON reports for integration
- Parallel execution for speed
- Retry logic for flaky tests

## Performance Monitoring

Tests include performance monitoring:
- Page load time measurements
- Core Web Vitals tracking
- API response time monitoring
- Memory usage checks
- Bundle size validation

## Accessibility Testing

Comprehensive accessibility testing includes:
- WCAG compliance checks
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- ARIA attribute verification

## Troubleshooting

### Common Issues
1. **Tests timing out**: Increase timeout in config or use proper waits
2. **Flaky tests**: Add proper waits, use retries, or fix timing issues
3. **Selector issues**: Use more specific selectors or data-testid attributes
4. **API failures**: Check API endpoints and mock responses appropriately

### Getting Help
1. Check Playwright documentation
2. Review test logs and screenshots
3. Use debug mode to step through tests
4. Check browser console for errors
