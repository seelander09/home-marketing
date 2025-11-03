/**
 * Request deduplication utility
 * Prevents duplicate concurrent requests for the same data
 */

type PendingRequest<T> = {
  promise: Promise<T>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest<unknown>>()

const MAX_PENDING_AGE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Clean up stale pending requests
 */
function cleanupStaleRequests() {
  const now = Date.now()
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > MAX_PENDING_AGE_MS) {
      pendingRequests.delete(key)
    }
  }
}

/**
 * Deduplicate concurrent requests
 * If a request with the same key is already pending, returns the existing promise
 * 
 * @param key - Unique key for the request
 * @param fn - Function that returns a promise
 * @returns Result of the function call
 */
export async function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  // Periodic cleanup (every 10th request)
  if (Math.random() < 0.1) {
    cleanupStaleRequests()
  }

  // Check if request is already pending
  const existing = pendingRequests.get(key)
  if (existing) {
    return existing.promise as Promise<T>
  }

  // Create new request
  const promise = fn().finally(() => {
    // Remove from pending when complete
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now()
  })

  return promise
}

/**
 * Clear all pending requests (useful for testing)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear()
}

/**
 * Get number of pending requests
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size
}

