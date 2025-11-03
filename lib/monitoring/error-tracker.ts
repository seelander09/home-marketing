/**
 * Error tracking and monitoring utilities
 * Supports Sentry integration or console fallback for development
 */

type ErrorContext = {
  userId?: string
  email?: string
  url?: string
  userAgent?: string
  [key: string]: unknown
}

type ErrorTracker = {
  init: (options?: { dsn?: string; environment?: string }) => void
  captureException: (error: Error, context?: ErrorContext) => void
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) => void
  setUser: (user: { id?: string; email?: string; [key: string]: unknown }) => void
  addBreadcrumb: (breadcrumb: { message: string; category: string; level?: 'info' | 'warning' | 'error'; data?: Record<string, unknown> }) => void
}

class ConsoleErrorTracker implements ErrorTracker {
  init(_options?: { dsn?: string; environment?: string }) {
    if (process.env.NODE_ENV === 'production') {
      console.info('[Error Tracker] Initialized (console fallback mode)')
    }
  }

  captureException(error: Error, context?: ErrorContext) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString()
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('[Error Tracker] Exception:', errorInfo)
    } else {
      console.error('Error:', errorInfo)
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    const logData = {
      message,
      level,
      context,
      timestamp: new Date().toISOString()
    }

    if (level === 'error') {
      console.error('[Error Tracker]', logData)
    } else if (level === 'warning') {
      console.warn('[Error Tracker]', logData)
    } else {
      console.info('[Error Tracker]', logData)
    }
  }

  setUser(user: { id?: string; email?: string; [key: string]: unknown }) {
    if (process.env.NODE_ENV === 'production') {
      console.info('[Error Tracker] User set:', { id: user.id, email: user.email })
    }
  }

  addBreadcrumb(breadcrumb: { message: string; category: string; level?: 'info' | 'warning' | 'error'; data?: Record<string, unknown> }) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Error Tracker] Breadcrumb:', breadcrumb)
    }
  }
}

class SentryErrorTracker implements ErrorTracker {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sentry: any = null

  async init(options?: { dsn?: string; environment?: string }) {
    try {
      // Dynamic import with error handling for optional Sentry dependency
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let sentryModule: any = null
      try {
        sentryModule = await import('@sentry/nextjs')
      } catch {
        // Sentry not installed, will fall back to console
        return
      }
      
      if (!sentryModule) {
        return
      }
      this.sentry = sentryModule

      if (options?.dsn) {
        sentryModule.init({
          dsn: options.dsn,
          environment: options.environment || process.env.NODE_ENV,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          beforeSend(event: any, hint: any) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Sentry event:', event, hint)
            }
            return event
          }
        })
      }
    } catch (error) {
      console.warn('Failed to initialize Sentry, falling back to console:', error)
      // Return new console tracker on init failure
    }
  }

  captureException(error: Error, context?: ErrorContext) {
    if (!this.sentry) {
      console.error('Error tracker not initialized:', error, context)
      return
    }

    this.sentry.captureException(error, {
      extra: context,
      tags: {
        component: context?.component as string,
        action: context?.action as string
      }
    })
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (!this.sentry) {
      console.warn('Error tracker not initialized:', message, context)
      return
    }

    const sentryLevel = level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info'
    this.sentry.captureMessage(message, {
      level: sentryLevel,
      extra: context
    })
  }

  setUser(user: { id?: string; email?: string; [key: string]: unknown }) {
    if (!this.sentry) return
    this.sentry.setUser({
      id: user.id as string,
      email: user.email as string
    })
  }

  addBreadcrumb(breadcrumb: { message: string; category: string; level?: 'info' | 'warning' | 'error'; data?: Record<string, unknown> }) {
    if (!this.sentry) return
    this.sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category,
      level: breadcrumb.level === 'error' ? 'error' : breadcrumb.level === 'warning' ? 'warning' : 'info',
      data: breadcrumb.data
    })
  }
}

let trackerInstance: ErrorTracker | null = null

/**
 * Initialize error tracking
 * Automatically uses Sentry if SENTRY_DSN is set, otherwise uses console fallback
 */
export function initErrorTracking(options?: { dsn?: string; environment?: string }) {
  const dsn = options?.dsn || process.env.NEXT_PUBLIC_SENTRY_DSN

  if (dsn && typeof window === 'undefined') {
    const sentryTracker = new SentryErrorTracker()
    sentryTracker.init({ dsn, environment: options?.environment }).catch(() => {
      // Fallback to console if Sentry init fails
      trackerInstance = new ConsoleErrorTracker()
      trackerInstance.init(options)
    })
    trackerInstance = sentryTracker
  } else {
    trackerInstance = new ConsoleErrorTracker()
    trackerInstance.init(options)
  }
}

/**
 * Get the error tracker instance
 */
export function getErrorTracker(): ErrorTracker {
  if (!trackerInstance) {
    trackerInstance = new ConsoleErrorTracker()
    trackerInstance.init()
  }
  return trackerInstance
}

/**
 * Capture an exception
 */
export function captureException(error: Error, context?: ErrorContext) {
  getErrorTracker().captureException(error, context)
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
  getErrorTracker().captureMessage(message, level, context)
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; email?: string; [key: string]: unknown }) {
  getErrorTracker().setUser(user)
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: { message: string; category: string; level?: 'info' | 'warning' | 'error'; data?: Record<string, unknown> }) {
  getErrorTracker().addBreadcrumb(breadcrumb)
}

/**
 * Wrapper for async functions that automatically captures errors
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: { component: string; action: string }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      if (context) {
        addBreadcrumb({
          message: `Starting ${context.action}`,
          category: context.component,
          level: 'info',
          data: { args: args.length }
        })
      }
      const result = await fn(...args)
      return result
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), context)
      throw error
    }
  }) as T
}

