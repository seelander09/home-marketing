/**
 * 30 Fake User Profiles for Testing
 * Diverse set of realistic real estate professional profiles
 */

export type FakeUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'Agent' | 'Broker' | 'Team Lead' | 'Brokerage Owner'
  brokerage: string
  crm: 'HubSpot' | 'Salesforce' | 'Follow Up Boss' | 'Chime' | 'KVCore' | 'RealtyJuggler' | 'Other'
  transactionsPerYear: string
  territory: {
    city: string
    state: string
    zip: string
  }
  message?: string
  persona: 'first-time' | 'returning' | 'power-user' | 'enterprise' | 'skeptical'
}

const FIRST_NAMES = [
  'Sarah', 'Michael', 'Jessica', 'David', 'Jennifer', 'James', 'Emily', 'Robert',
  'Amanda', 'Christopher', 'Michelle', 'Daniel', 'Melissa', 'Matthew', 'Ashley',
  'Anthony', 'Nicole', 'Mark', 'Stephanie', 'Joshua', 'Laura', 'Andrew', 'Lisa',
  'Kevin', 'Kimberly', 'Brian', 'Angela', 'Ryan', 'Brittany', 'Jason', 'Megan'
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
]

const BROKERAGES = [
  'Keller Williams Realty',
  'RE/MAX',
  'Coldwell Banker',
  'Century 21',
  'Berkshire Hathaway HomeServices',
  'Compass Real Estate',
  'Sotheby\'s International Realty',
  'Windermere Real Estate',
  'Long & Foster',
  'The Corcoran Group',
  'ERA Real Estate',
  'Better Homes and Gardens',
  'Keller Williams Premier Realty',
  'RE/MAX Alliance',
  'Coldwell Banker Residential'
]

const CITIES_STATES_ZIPS = [
  { city: 'Austin', state: 'TX', zip: '78701' },
  { city: 'Houston', state: 'TX', zip: '77001' },
  { city: 'Dallas', state: 'TX', zip: '75201' },
  { city: 'Los Angeles', state: 'CA', zip: '90001' },
  { city: 'San Francisco', state: 'CA', zip: '94102' },
  { city: 'San Diego', state: 'CA', zip: '92101' },
  { city: 'Miami', state: 'FL', zip: '33101' },
  { city: 'Tampa', state: 'FL', zip: '33601' },
  { city: 'Orlando', state: 'FL', zip: '32801' },
  { city: 'New York', state: 'NY', zip: '10001' },
  { city: 'Seattle', state: 'WA', zip: '98101' },
  { city: 'Phoenix', state: 'AZ', zip: '85001' },
  { city: 'Denver', state: 'CO', zip: '80201' },
  { city: 'Chicago', state: 'IL', zip: '60601' },
  { city: 'Atlanta', state: 'GA', zip: '30301' },
  { city: 'Boston', state: 'MA', zip: '02101' },
  { city: 'Portland', state: 'OR', zip: '97201' },
  { city: 'Las Vegas', state: 'NV', zip: '89101' },
  { city: 'Nashville', state: 'TN', zip: '37201' },
  { city: 'Charlotte', state: 'NC', zip: '28201' },
  { city: 'Raleigh', state: 'NC', zip: '27601' },
  { city: 'Minneapolis', state: 'MN', zip: '55401' },
  { city: 'Detroit', state: 'MI', zip: '48201' },
  { city: 'Philadelphia', state: 'PA', zip: '19101' },
  { city: 'San Antonio', state: 'TX', zip: '78201' },
  { city: 'Columbus', state: 'OH', zip: '43201' },
  { city: 'Indianapolis', state: 'IN', zip: '46201' },
  { city: 'Milwaukee', state: 'WI', zip: '53201' },
  { city: 'Baltimore', state: 'MD', zip: '21201' },
  { city: 'Sacramento', state: 'CA', zip: '95814' }
]

const ROLES: FakeUser['role'][] = ['Agent', 'Broker', 'Team Lead', 'Brokerage Owner']
const CRMS: FakeUser['crm'][] = ['HubSpot', 'Salesforce', 'Follow Up Boss', 'Chime', 'KVCore', 'RealtyJuggler', 'Other']
const TRANSACTION_VOLUMES = ['1-10', '11-25', '26-50', '51-100', '100+']
const PERSONAS: FakeUser['persona'][] = ['first-time', 'returning', 'power-user', 'enterprise', 'skeptical']

/**
 * Generate a random phone number in US format
 */
function generatePhoneNumber(): string {
  const areaCode = Math.floor(Math.random() * 800) + 200 // 200-999
  const exchange = Math.floor(Math.random() * 800) + 200
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${areaCode}-${exchange}-${number}`
}

/**
 * Generate a realistic email address
 */
function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'realestate.com']
  const domain = domains[index % domains.length]
  const variants = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName[0]?.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName[0]?.toLowerCase()}${index}`
  ]
  const variant = variants[index % variants.length]
  return `${variant}@${domain}`
}

/**
 * 30 Pre-defined fake user profiles
 */
export const FAKE_USERS: FakeUser[] = Array.from({ length: 30 }, (_, index) => {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length]
  const lastName = LAST_NAMES[index % LAST_NAMES.length]
  const location = BROKERAGES[index % BROKERAGES.length]
  const territory = CITIES_STATES_ZIPS[index % CITIES_STATES_ZIPS.length]
  const role = ROLES[index % ROLES.length]
  const crm = CRMS[index % CRMS.length]
  const transactionsPerYear = TRANSACTION_VOLUMES[index % TRANSACTION_VOLUMES.length]
  const persona = PERSONAS[index % PERSONAS.length]

  return {
    id: `user-${index + 1}`,
    firstName,
    lastName,
    email: generateEmail(firstName, lastName, index),
    phone: generatePhoneNumber(),
    role,
    brokerage: location,
    crm,
    transactionsPerYear,
    territory,
    message: index % 3 === 0 ? `Interested in learning more about ${territory.city} market opportunities.` : undefined,
    persona
  }
})

/**
 * Get a random user from the pool
 */
export function getRandomUser(): FakeUser {
  return FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)]!
}

/**
 * Get a user by ID
 */
export function getUserById(id: string): FakeUser | undefined {
  return FAKE_USERS.find(user => user.id === id)
}

/**
 * Get users by persona
 */
export function getUsersByPersona(persona: FakeUser['persona']): FakeUser[] {
  return FAKE_USERS.filter(user => user.persona === persona)
}

/**
 * Get users by role
 */
export function getUsersByRole(role: FakeUser['role']): FakeUser[] {
  return FAKE_USERS.filter(user => user.role === role)
}

/**
 * Get users by state
 */
export function getUsersByState(state: string): FakeUser[] {
  return FAKE_USERS.filter(user => user.territory.state === state)
}

/**
 * Get all users
 */
export function getAllUsers(): FakeUser[] {
  return FAKE_USERS
}

/**
 * Generate a user for demo request form (with all required fields)
 */
export function getDemoRequestUser(): FakeUser {
  return getRandomUser()
}

/**
 * Get edge case users (for testing validation)
 */
export const EDGE_CASE_USERS = {
  longName: {
    id: 'edge-long-name',
    firstName: 'VeryLongFirstNameThatExceedsTypicalLimits',
    lastName: 'VeryLongLastNameThatAlsoExceedsTypicalLimits',
    email: 'longname@example.com',
    phone: '555-123-4567',
    role: 'Agent' as const,
    brokerage: 'Test Brokerage',
    crm: 'HubSpot' as const,
    transactionsPerYear: '26-50',
    territory: { city: 'Austin', state: 'TX', zip: '78701' },
    persona: 'first-time' as const
  },
  specialCharacters: {
    id: 'edge-special-chars',
    firstName: "O'Brien",
    lastName: "Smith-Johnson",
    email: 'test+user@example.com',
    phone: '555-123-4567',
    role: 'Agent' as const,
    brokerage: 'Test & Associates',
    crm: 'Salesforce' as const,
    transactionsPerYear: '51-100',
    territory: { city: 'San Francisco', state: 'CA', zip: '94102' },
    persona: 'returning' as const
  },
  minimalData: {
    id: 'edge-minimal',
    firstName: 'A',
    lastName: 'B',
    email: 'a@b.co',
    phone: '555-123-4567',
    role: 'Agent' as const,
    brokerage: 'X',
    crm: 'Other' as const,
    transactionsPerYear: '1-10',
    territory: { city: 'NY', state: 'NY', zip: '10001' },
    persona: 'first-time' as const
  }
}

