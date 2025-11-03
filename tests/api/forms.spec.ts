import { describe, it, expect, beforeEach, vi } from 'vitest'
import { demoRequestSchema, downloadRequestSchema, doNotSellSchema } from '@/lib/forms/schemas'

describe('Form Validation Schemas', () => {
  describe('demoRequestSchema', () => {
    it('should validate a valid demo request', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'Agent',
        brokerage: 'ABC Realty',
        territory: {
          city: 'Austin',
          state: 'TX',
          zip: '78701'
        },
        recaptchaToken: 'test-token'
      }

      const result = demoRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '1234567890',
        role: 'Agent',
        brokerage: 'ABC Realty',
        territory: {
          city: 'Austin',
          state: 'TX',
          zip: '78701'
        },
        recaptchaToken: 'test-token'
      }

      const result = demoRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('email'))).toBe(true)
      }
    })

    it('should reject invalid ZIP code', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'Agent',
        brokerage: 'ABC Realty',
        territory: {
          city: 'Austin',
          state: 'TX',
          zip: '123'
        },
        recaptchaToken: 'test-token'
      }

      const result = demoRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('territory') && e.path.includes('zip'))).toBe(true)
      }
    })

    it('should require all mandatory fields', () => {
      const incompleteData = {
        firstName: 'John',
        email: 'john@example.com'
      }

      const result = demoRequestSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })
  })

  describe('downloadRequestSchema', () => {
    it('should validate a valid download request', () => {
      const validData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        assetId: 'guide-123',
        recaptchaToken: 'test-token'
      }

      const result = downloadRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require assetId', () => {
      const invalidData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        recaptchaToken: 'test-token'
      }

      const result = downloadRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('doNotSellSchema', () => {
    it('should validate a valid Do Not Sell request', () => {
      const validData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        message: 'Please remove my data',
        recaptchaToken: 'test-token'
      }

      const result = doNotSellSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow optional phone and message', () => {
      const validData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        recaptchaToken: 'test-token'
      }

      const result = doNotSellSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require fullName and email', () => {
      const invalidData = {
        email: 'john@example.com',
        recaptchaToken: 'test-token'
      }

      const result = doNotSellSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

