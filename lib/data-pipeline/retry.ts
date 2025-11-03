/**
 * Retry utility with exponential backoff and jitter
 * Used for API calls that may fail due to transient network issues
 */

type RetryOptions = {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableErrors?: (error: unknown) => boolean
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
}

/**
 * Determine if an error should trigger a retry
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors, timeouts, and 5xx status codes are retryable
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
      return true
    }
    
    // Check for HTTP errors
    if ('status' in error && typeof (error as { status: number }).status === 'number') {
      const status = (error as { status: number }).status
      // Retry on 5xx errors and rate limiting (429)
      return status >= 500 || status === 429
    }
  }
  
  return false
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'retryableErrors'>>): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt)
  const delay = Math.min(exponentialDelay, options.maxDelayMs)
  
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1)
  
  return Math.max(0, Math.floor(delay + jitter))
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry (should return a Promise)
 * @param options - Retry configuration
 * @returns Result of the function call
 * @throws Last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = {
    ...DEFAULT_OPTIONS,
    retryableErrors: options.retryableErrors || isRetryableError,
    ...options
  }

  let lastError: unknown
  let attempt = 0

  while (attempt <= config.maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if it's not a retryable error
      if (!config.retryableErrors(error)) {
        throw error
      }

      // Don't retry if we've exhausted all attempts
      if (attempt >= config.maxRetries) {
        break
      }

      const delay = calculateDelay(attempt, config)
      
      // Log retry attempt (will be replaced with structured logging later)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms:`, error)
      }

      await sleep(delay)
      attempt++
    }
  }

  // All retries exhausted
  throw lastError
}

/**
 * Create a fetch wrapper with retry logic
 */
export function fetchWithRetry(
  url: string | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init)
      
      // Throw error for non-2xx status codes
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status: number }
        error.status = response.status
        throw error
      }
      
      return response
    },
    options
  )
}

