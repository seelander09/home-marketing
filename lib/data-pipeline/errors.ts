/**
 * Custom error types for data pipeline operations
 */

export class CacheError extends Error {
  constructor(
    message: string,
    public readonly cacheKey?: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'CacheError'
    Error.captureStackTrace?.(this, CacheError)
  }
}

export class APIFetchError extends Error {
  constructor(
    message: string,
    public readonly url?: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'APIFetchError'
    Error.captureStackTrace?.(this, APIFetchError)
  }

  get isRetryable(): boolean {
    return this.statusCode === undefined || this.statusCode >= 500 || this.statusCode === 429
  }

  get isRateLimit(): boolean {
    return this.statusCode === 429
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    public readonly schema?: string
  ) {
    super(message)
    this.name = 'ValidationError'
    Error.captureStackTrace?.(this, ValidationError)
  }
}

export class DataStalenessError extends Error {
  constructor(
    message: string,
    public readonly dataSource: string,
    public readonly ageMs: number,
    public readonly maxAgeMs: number
  ) {
    super(message)
    this.name = 'DataStalenessError'
    Error.captureStackTrace?.(this, DataStalenessError)
  }
}

/**
 * Helper to create APIFetchError from fetch response
 */
export function createAPIFetchError(
  url: string,
  response: Response,
  cause?: unknown
): APIFetchError {
  return new APIFetchError(
    `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    url,
    response.status,
    cause
  )
}

/**
 * Helper to create APIFetchError from network error
 */
export function createNetworkError(
  url: string,
  cause: unknown
): APIFetchError {
  const message = cause instanceof Error ? cause.message : String(cause)
  return new APIFetchError(
    `Network error fetching ${url}: ${message}`,
    url,
    undefined,
    cause
  )
}

