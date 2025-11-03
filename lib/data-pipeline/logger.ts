/**
 * Structured logging utility for data pipeline
 * Provides consistent logging with correlation IDs and log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = {
  component?: string
  action?: string
  dataSource?: string
  region?: string
  [key: string]: unknown
}

let correlationId: string | null = null

/**
 * Generate a correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Set correlation ID for current request context
 */
export function setCorrelationId(id: string): void {
  correlationId = id
}

/**
 * Get current correlation ID
 */
export function getCorrelationId(): string | null {
  return correlationId
}

/**
 * Create a logger instance for a component
 */
export function createLogger(component: string) {
  return {
    debug: (message: string, context?: LogContext) => {
      log('debug', message, { ...context, component })
    },
    info: (message: string, context?: LogContext) => {
      log('info', message, { ...context, component })
    },
    warn: (message: string, context?: LogContext) => {
      log('warn', message, { ...context, component })
    },
    error: (message: string, error?: unknown, context?: LogContext) => {
      log('error', message, {
        ...context,
        component,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : String(error)
      })
    }
  }
}

/**
 * Internal logging function
 */
function log(level: LogLevel, message: string, context: LogContext = {}): void {
  const timestamp = new Date().toISOString()
  const entry = {
    timestamp,
    level,
    message,
    correlationId: correlationId || undefined,
    ...context
  }

  // In development, use console with formatting
  if (process.env.NODE_ENV === 'development') {
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : ''
    
    switch (level) {
      case 'debug':
        console.debug(formatted, contextStr || '')
        break
      case 'info':
        console.info(formatted, contextStr || '')
        break
      case 'warn':
        console.warn(formatted, contextStr || '')
        break
      case 'error':
        console.error(formatted, contextStr || '')
        break
    }
  } else {
    // In production, use structured JSON logging
    console.log(JSON.stringify(entry))
  }
}

/**
 * Default logger for data pipeline
 */
export const logger = createLogger('data-pipeline')

