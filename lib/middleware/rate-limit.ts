/**
 * Simple in-memory rate limiting for API routes
 * For production, consider using Redis or a dedicated rate limiting service
 */

type RateLimitOptions = {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: Request) => string
}

type RateLimitStore = Map<string, { count: number; resetAt: number }>

const stores = new Map<string, RateLimitStore>()

function getStore(namespace: string): RateLimitStore {
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map())
  }
  return stores.get(namespace)!
}

function getClientKey(request: Request, keyGenerator?: (request: Request) => string): string {
  if (keyGenerator) {
    return keyGenerator(request)
  }

  // Default: use IP address or API key
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
  return apiKey || ip
}

function cleanupExpiredEntries(store: RateLimitStore, now: number) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) {
      store.delete(key)
    }
  }
}

/**
 * Rate limiting middleware
 * Returns a function that can be used in API routes
 */
export function createRateLimiter(namespace: string, options: RateLimitOptions) {
  const { maxRequests, windowMs, keyGenerator } = options
  const store = getStore(namespace)

  return async (request: Request): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
    const now = Date.now()
    const clientKey = getClientKey(request, keyGenerator)

    // Cleanup expired entries periodically (every 10th request)
    if (Math.random() < 0.1) {
      cleanupExpiredEntries(store, now)
    }

    const entry = store.get(clientKey)

    if (!entry || entry.resetAt < now) {
      // Create or reset entry
      const newEntry = {
        count: 1,
        resetAt: now + windowMs
      }
      store.set(clientKey, newEntry)
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: newEntry.resetAt
      }
    }

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt
      }
    }

    entry.count += 1
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt
    }
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Form submissions: 5 requests per 15 minutes per IP
  forms: createRateLimiter('forms', {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000
  }),

  // API endpoints: 100 requests per minute per IP
  api: createRateLimiter('api', {
    maxRequests: 100,
    windowMs: 60 * 1000
  }),

  // Market data: 30 requests per minute per IP
  marketData: createRateLimiter('market-data', {
    maxRequests: 30,
    windowMs: 60 * 1000
  }),

  // Territory lookup: 20 requests per minute per IP
  territory: createRateLimiter('territory', {
    maxRequests: 20,
    windowMs: 60 * 1000
  })
}

/**
 * Helper to create rate limit response headers
 */
export function createRateLimitHeaders(remaining: number, resetAt: number): HeadersInit {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
    'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString()
  }
}

