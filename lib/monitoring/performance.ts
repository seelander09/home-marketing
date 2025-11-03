/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom metrics
 */

type MetricType = 'web-vital' | 'custom' | 'api' | 'navigation'

interface PerformanceMetric {
  name: string
  value: number
  type: MetricType
  timestamp: number
  url?: string
  metadata?: Record<string, unknown>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.observeWebVitals()
    }
  }

  private observeWebVitals() {
    if (!('PerformanceObserver' in window)) {
      return
    }

    // Observe Core Web Vitals
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.entryType === 'navigation' ? (entry as PerformanceNavigationTiming).loadEventEnd : (entry as PerformanceEntry).duration,
            type: entry.entryType === 'navigation' ? 'navigation' : 'web-vital',
            timestamp: Date.now(),
            url: window.location.href,
            metadata: {
              entryType: entry.entryType
            }
          })
        }
      })

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error)
    }
  }

  recordMetric(metric: PerformanceMetric) {
    if (!this.enabled) return

    this.metrics.push(metric)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Performance]', metric)
    }

    // Send to error tracking in production
    if (process.env.NODE_ENV === 'production' && metric.type === 'web-vital') {
      const { captureMessage } = require('./error-tracker')
      captureMessage(`Performance: ${metric.name}`, metric.value > 3000 ? 'warning' : 'info', {
        metric: metric.name,
        value: metric.value,
        url: metric.url
      })
    }
  }

  startTimer(name: string): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordMetric({
        name,
        value: duration,
        type: 'custom',
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined
      })
    }
  }

  async measureApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(`api.${name}`)
    try {
      const result = await fn()
      endTimer()
      return result
    } catch (error) {
      endTimer()
      throw error
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  clearMetrics() {
    this.metrics = []
  }

  disable() {
    this.enabled = false
  }

  enable() {
    this.enabled = true
  }
}

let monitorInstance: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance && typeof window !== 'undefined') {
    monitorInstance = new PerformanceMonitor()
  } else if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor()
  }
  return monitorInstance
}

export function recordPerformanceMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
  getPerformanceMonitor().recordMetric({
    ...metric,
    timestamp: Date.now()
  })
}

export function startPerformanceTimer(name: string): () => void {
  return getPerformanceMonitor().startTimer(name)
}

export async function measureApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return getPerformanceMonitor().measureApiCall(name, fn)
}

