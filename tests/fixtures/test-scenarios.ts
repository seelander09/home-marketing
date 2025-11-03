/**
 * Pre-defined test scenarios for user journeys
 */

import type { FakeUser } from './fake-users'
import { getRandomUser, getAllUsers, EDGE_CASE_USERS } from './fake-users'

export type TestScenario = {
  name: string
  description: string
  user: FakeUser
  steps: string[]
  expectedOutcome: string
}

/**
 * User journey scenarios
 */
export const USER_JOURNEY_SCENARIOS: TestScenario[] = [
  {
    name: 'Complete Demo Request - First Time User',
    description: 'New user completes full demo request form',
    user: getRandomUser(),
    steps: [
      'Navigate to homepage',
      'Click demo request CTA',
      'Fill contact information',
      'Fill business information',
      'Fill territory information',
      'Submit form',
      'Verify success message'
    ],
    expectedOutcome: 'Form submits successfully and user receives confirmation'
  },
  {
    name: 'Guide Download Flow',
    description: 'User downloads a guide after email capture',
    user: getRandomUser(),
    steps: [
      'Navigate to resources page',
      'Click guide download CTA',
      'Enter email address',
      'Submit form',
      'Verify download link appears'
    ],
    expectedOutcome: 'Guide download link is available after email submission'
  },
  {
    name: 'Do Not Sell Request',
    description: 'User submits do not sell request',
    user: getRandomUser(),
    steps: [
      'Navigate to compliance page',
      'Fill do not sell form',
      'Submit form',
      'Verify confirmation'
    ],
    expectedOutcome: 'Do not sell request is processed successfully'
  },
  {
    name: 'Navigation Flow',
    description: 'User navigates through all main pages',
    user: getRandomUser(),
    steps: [
      'Start at homepage',
      'Navigate to Products',
      'Navigate to Resources',
      'Navigate to About',
      'Navigate to Contact',
      'Return to homepage'
    ],
    expectedOutcome: 'All pages load correctly and navigation works'
  },
  {
    name: 'Form Validation - Invalid Email',
    description: 'User attempts to submit form with invalid email',
    user: getRandomUser(),
    steps: [
      'Navigate to demo request form',
      'Fill form with invalid email',
      'Attempt to submit',
      'Verify validation error appears'
    ],
    expectedOutcome: 'Form shows validation error for invalid email'
  },
  {
    name: 'Mobile Navigation',
    description: 'User navigates site on mobile device',
    user: getRandomUser(),
    steps: [
      'Set viewport to mobile size',
      'Open mobile menu',
      'Navigate to different pages',
      'Close mobile menu',
      'Verify responsive layout'
    ],
    expectedOutcome: 'Mobile navigation works correctly and layout is responsive'
  }
]

/**
 * Get scenario by name
 */
export function getScenario(name: string): TestScenario | undefined {
  return USER_JOURNEY_SCENARIOS.find(scenario => scenario.name === name)
}

/**
 * Get all scenarios for a specific user
 */
export function getScenariosForUser(userId: string): TestScenario[] {
  return USER_JOURNEY_SCENARIOS.filter(scenario => scenario.user.id === userId)
}

/**
 * Generate test scenarios for all 30 users
 */
export function generateUserJourneyScenarios(): TestScenario[] {
  const users = getAllUsers()
  return users.map((user, index) => ({
    name: `User Journey - ${user.firstName} ${user.lastName} (${user.role})`,
    description: `Complete demo request flow for ${user.firstName} ${user.lastName}`,
    user,
    steps: [
      'Navigate to homepage',
      'Locate demo request form',
      'Fill step 1: Contact information',
      'Fill step 2: Business information',
      'Fill step 3: Territory information',
      'Submit form',
      'Verify success message'
    ],
    expectedOutcome: `Form submits successfully for ${user.brokerage} in ${user.territory.city}, ${user.territory.state}`
  }))
}

/**
 * Edge case scenarios
 */
export const EDGE_CASE_SCENARIOS: TestScenario[] = [
  {
    name: 'Long Name Handling',
    description: 'Test form with very long name',
    user: EDGE_CASE_USERS.longName,
    steps: [
      'Fill form with long name',
      'Verify form accepts input',
      'Submit form',
      'Verify no truncation errors'
    ],
    expectedOutcome: 'Form handles long names correctly'
  },
  {
    name: 'Special Characters',
    description: 'Test form with special characters in name',
    user: EDGE_CASE_USERS.specialCharacters,
    steps: [
      'Fill form with special characters',
      'Verify form accepts input',
      'Submit form',
      'Verify data is preserved'
    ],
    expectedOutcome: 'Form handles special characters correctly'
  },
  {
    name: 'Minimal Data',
    description: 'Test form with minimal valid data',
    user: EDGE_CASE_USERS.minimalData,
    steps: [
      'Fill form with minimal data',
      'Verify form accepts input',
      'Submit form',
      'Verify submission succeeds'
    ],
    expectedOutcome: 'Form accepts minimal valid data'
  }
]

