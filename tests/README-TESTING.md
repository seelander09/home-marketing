# Frontend Testing with Fake Users

This test suite includes 30 realistic fake user profiles and comprehensive Playwright E2E tests for all frontend functionality.

## Quick Start

### Run Tests in UI Mode (Watch Live in Browser)
```bash
npm run test:e2e:ui
```

This opens Playwright's UI mode where you can:
- Watch tests execute in real-time
- See the browser interactions
- Debug failures interactively
- Run specific tests

### Run Tests with Visible Browser
```bash
npm run test:e2e:headed
```

### Run Specific Test Suites
```bash
# User journey tests (30 users)
npm run test:e2e:users

# All form tests
npm run test:e2e:forms

# Navigation tests
npm run test:e2e:navigation

# Responsive design tests
npm run test:e2e:responsive

# Accessibility tests
npm run test:e2e:a11y
```

## Test Structure

### Fake Users (`tests/fixtures/fake-users.ts`)
- 30 diverse user profiles with realistic data
- Mix of roles: Agent, Broker, Team Lead, Brokerage Owner
- Various territories across US markets
- Different CRM systems and transaction volumes
- Edge case users for validation testing

### Page Objects (`tests/page-objects/`)
- `HomePage.ts` - Homepage interactions
- `ProductsPage.ts` - Products page
- `ResourcesPage.ts` - Resources page
- `AboutPage.ts` - About page
- `ContactPage.ts` - Contact page
- `DemoRequestFormPage.ts` - Multi-step demo form
- `GuideDownloadFormPage.ts` - Guide download form
- `CompliancePage.ts` - Do Not Sell form

### Test Suites

#### User Journeys (`tests/users/user-journeys.spec.ts`)
- Tests all 30 fake users through complete demo request flow
- Edge case testing (long names, special characters)
- Verifies form submissions work correctly

#### Forms (`tests/forms/all-forms.spec.ts`)
- DemoRequestForm (multi-step form)
- GuideDownloadForm
- DoNotSellForm
- Form validation
- Accessibility features

#### Navigation (`tests/navigation/navigation.spec.ts`)
- Desktop navigation
- Mobile navigation
- Footer links
- Skip navigation
- Breadcrumbs

#### Responsive (`tests/responsive/responsive.spec.ts`)
- Multiple viewport sizes (mobile, tablet, desktop)
- Layout adaptation
- Touch interactions
- Mobile menu functionality

#### Accessibility (`tests/accessibility/a11y.spec.ts`)
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader compatibility
- Color contrast
- Form accessibility

## Using Fake Users in Tests

```typescript
import { getRandomUser, getAllUsers, getUserById } from '../fixtures/fake-users'

// Get a random user
const user = getRandomUser()

// Get all users
const users = getAllUsers()

// Get specific user
const user = getUserById('user-1')

// Use in form
await demoForm.fillCompleteForm(user)
```

## Test Scenarios

Pre-defined test scenarios are available in `tests/fixtures/test-scenarios.ts`:
- Complete demo request flows
- Guide download flows
- Do not sell requests
- Navigation flows
- Form validation scenarios

## Screenshots and Videos

- Screenshots are captured on test failures
- Videos are recorded on test failures
- Screenshots are saved to `test-results/screenshots/`
- Responsive tests include viewport-specific screenshots

## Tips

1. **Watch Tests Live**: Use `npm run test:e2e:ui` to see tests run in real-time
2. **Debug Failures**: Use `npm run test:e2e:debug` to step through tests
3. **View Reports**: After running tests, use `npm run test:e2e:report` to view HTML report
4. **Filter Tests**: In UI mode, you can filter tests by name or tag
5. **Re-run Failed**: In UI mode, you can re-run only failed tests

## Requirements

- Node.js 18+
- Playwright installed (`npm run test:e2e:install` if needed)
- Dev server running on `http://localhost:3000` (starts automatically)

## Notes

- reCAPTCHA is mocked in tests to avoid actual API calls
- Tests use realistic data that passes validation
- All tests are designed to work with existing frontend components
- Page objects handle both select and input elements for flexibility

