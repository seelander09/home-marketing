/**
 * Cache validation utilities
 * Validates cached data against schemas and data quality rules
 */

import { z } from 'zod'
import { ValidationError } from './errors'

/**
 * Validate cached data against a schema
 */
export function validateCacheData<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  cacheKey?: string
): { valid: true; data: T } | { valid: false; error: ValidationError } {
  try {
    const parsed = schema.parse(data)
    return { valid: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        `Cache data validation failed${cacheKey ? ` for ${cacheKey}` : ''}`,
        undefined,
        data,
        'Zod schema'
      )
      return { valid: false, error: validationError }
    }
    throw error
  }
}

/**
 * Validate numeric range
 */
export function validateRange(
  value: number | null | undefined,
  min: number,
  max: number,
  fieldName: string
): boolean {
  if (value === null || value === undefined) {
    return true // Null values are allowed
  }
  return value >= min && value <= max
}

/**
 * Validate date is not in the future
 */
export function validateDateNotFuture(dateString: string | null | undefined): boolean {
  if (!dateString) return true
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() <= Date.now()
}

/**
 * Validate data relationships (e.g., owner + renter = total)
 */
export function validateRelationship(
  values: Array<number | null | undefined>,
  expectedSum: number | null | undefined,
  tolerance: number = 0.01
): boolean {
  if (!expectedSum || expectedSum === 0) return true
  
  const sum = values.reduce((acc: number, val) => (acc || 0) + (val || 0), 0)
  const diff = Math.abs(sum - (expectedSum || 0))
  const percentDiff = expectedSum ? diff / expectedSum : 0
  
  return percentDiff <= tolerance
}

/**
 * Calculate data completeness score
 */
export function calculateCompleteness<T extends Record<string, unknown>>(
  data: T | null | undefined,
  requiredFields: (keyof T)[]
): number {
  if (!data) return 0
  
  const presentFields = requiredFields.filter(field => {
    const value = data[field]
    return value !== null && value !== undefined && value !== ''
  })
  
  return requiredFields.length > 0 
    ? (presentFields.length / requiredFields.length) * 100 
    : 100
}

/**
 * Validate cache structure
 */
export function validateCacheStructure(
  data: unknown,
  expectedKeys: string[]
): { valid: boolean; missingKeys: string[] } {
  if (!data || typeof data !== 'object') {
    return { valid: false, missingKeys: expectedKeys }
  }
  
  const obj = data as Record<string, unknown>
  const missingKeys = expectedKeys.filter(key => !(key in obj))
  
  return {
    valid: missingKeys.length === 0,
    missingKeys
  }
}

