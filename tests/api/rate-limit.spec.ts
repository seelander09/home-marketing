import { describe, it, expect, beforeEach } from 'vitest'
import { createRateLimiter, rateLimiters } from '@/lib/middleware/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit stores between tests
    const stores = new Map<string, Map<string, { count: number; resetAt: number }>>()
  })

  describe('createRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = createRateLimiter('test-namespace', {
        maxRequests: 5,
        windowMs: 60000
      })

      const request = new Request('http://localhost:3000/api/test')

      for (let i = 0; i < 5; i++) {
        const result = await limiter(request)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBeGreaterThanOrEqual(0)
      }
    })

    it('should block requests exceeding limit', async () => {
      const limiter = createRateLimiter('test-block', {
        maxRequests: 2,
        windowMs: 60000
      })

      const request = new Request('http://localhost:3000/api/test')

      // Make 2 allowed requests
      await limiter(request)
      await limiter(request)

      // Third should be blocked
      const result = await limiter(request)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const limiter = createRateLimiter('test-reset', {
        maxRequests: 2,
        windowMs: 100 // Very short window for testing
      })

      const request = new Request('http://localhost:3000/api/test')

      // Exhaust limit
      await limiter(request)
      await limiter(request)
      const blocked = await limiter(request)
      expect(blocked.allowed).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const allowed = await limiter(request)
      expect(allowed.allowed).toBe(true)
    })
  })

  describe('pre-configured rate limiters', () => {
    it('should have forms rate limiter', async () => {
      const request = new Request('http://localhost:3000/api/forms/demo')
      const result = await rateLimiters.forms(request)
      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('resetAt')
    })

    it('should have market data rate limiter', async () => {
      const request = new Request('http://localhost:3000/api/market/comprehensive')
      const result = await rateLimiters.marketData(request)
      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('resetAt')
    })
  })
})

