/**
 * Environment variable validation and type-safe access
 * Validates required environment variables on startup
 */

type EnvConfig = {
  // Sanity CMS
  sanity: {
    projectId: string
    dataset: string
    apiVersion: string
    readToken?: string
  }
  // reCAPTCHA
  recaptcha: {
    siteKey?: string
    secretKey?: string
  }
  // CRM Integration
  crm: {
    webhookUrl?: string
    sellerWebhookUrl?: string
    sellerWebhookToken?: string
  }
  // Realie API
  realie: {
    apiUrl?: string
    apiKey?: string
  }
  // Data Sources
  dataSources: {
    redfinDataDir?: string
    redfinCacheDir?: string
    censusApiKey?: string
    fredApiKey?: string
    hudApiKey?: string
  }
  // Analytics
  analytics: {
    gtmId?: string
    sentryDsn?: string
  }
  // App Config
  app: {
    nodeEnv: 'development' | 'production' | 'test'
    appVersion?: string
  }
}

type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const requiredInProduction = [
  { key: 'NEXT_PUBLIC_SANITY_PROJECT_ID', description: 'Sanity CMS Project ID' },
  { key: 'NEXT_PUBLIC_SANITY_DATASET', description: 'Sanity CMS Dataset' }
] as const

const optionalButRecommended = [
  { key: 'RECAPTCHA_SECRET', description: 'reCAPTCHA secret key for form protection' },
  { key: 'CRM_WEBHOOK_URL', description: 'CRM webhook URL for lead routing' },
  { key: 'NEXT_PUBLIC_GTM_ID', description: 'Google Tag Manager ID for analytics' },
  { key: 'CENSUS_API_KEY', description: 'Census API key for demographic data' },
  { key: 'FRED_API_KEY', description: 'FRED API key for economic data' },
  { key: 'HUD_API_KEY', description: 'HUD API key for housing market data' }
] as const

/**
 * Validate environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const isProduction = process.env.NODE_ENV === 'production'

  // Check required variables in production
  if (isProduction) {
    for (const { key, description } of requiredInProduction) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key} (${description})`)
      }
    }
  }

  // Check recommended variables
  for (const { key, description } of optionalButRecommended) {
    if (!process.env[key]) {
      warnings.push(`Missing recommended environment variable: ${key} (${description})`)
    }
  }

  // Validate Sanity config if provided
  if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    errors.push('NEXT_PUBLIC_SANITY_DATASET is required when NEXT_PUBLIC_SANITY_PROJECT_ID is set')
  }

  // Validate reCAPTCHA config
  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !process.env.RECAPTCHA_SECRET) {
    warnings.push('RECAPTCHA_SECRET should be set when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is configured')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnvironment()

  if (!validation.valid && process.env.NODE_ENV === 'production') {
    throw new Error(`Invalid environment configuration: ${validation.errors.join(', ')}`)
  }

  if (validation.warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('Environment warnings:', validation.warnings)
  }

  return {
    sanity: {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
      readToken: process.env.SANITY_READ_TOKEN
    },
    recaptcha: {
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      secretKey: process.env.RECAPTCHA_SECRET
    },
    crm: {
      webhookUrl: process.env.CRM_WEBHOOK_URL,
      sellerWebhookUrl: process.env.CRM_SELLER_WEBHOOK_URL,
      sellerWebhookToken: process.env.CRM_SELLER_WEBHOOK_TOKEN
    },
    realie: {
      apiUrl: process.env.REALIE_API_URL,
      apiKey: process.env.REALIE_API_KEY
    },
    dataSources: {
      redfinDataDir: process.env.REDFIN_DATA_DIR,
      redfinCacheDir: process.env.REDFIN_CACHE_DIR,
      censusApiKey: process.env.CENSUS_API_KEY,
      fredApiKey: process.env.FRED_API_KEY,
      hudApiKey: process.env.HUD_API_KEY
    },
    analytics: {
      gtmId: process.env.NEXT_PUBLIC_GTM_ID,
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN
    },
    app: {
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION
    }
  }
}

/**
 * Initialize and validate environment on module load (server-side only)
 */
if (typeof window === 'undefined') {
  const validation = validateEnvironment()

  if (!validation.valid && process.env.NODE_ENV === 'production') {
    console.error('Environment validation failed:', validation.errors)
    if (process.env.VERCEL_ENV === 'production') {
      throw new Error('Production environment validation failed. Please check your environment variables.')
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('Environment warnings:', validation.warnings)
  }
}

