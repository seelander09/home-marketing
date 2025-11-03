/**
 * Metrics collection for data pipeline
 * Tracks API calls, cache performance, and data quality
 */

type MetricValue = number | string | boolean

interface Metric {
  name: string
  value: MetricValue
  timestamp: number
  tags?: Record<string, string>
}

const metrics: Metric[] = []
const maxMetrics = 1000 // Keep last 1000 metrics in memory

/**
 * Record a metric
 */
export function recordMetric(
  name: string,
  value: MetricValue,
  tags?: Record<string, string>
): void {
  metrics.push({
    name,
    value,
    timestamp: Date.now(),
    tags
  })

  // Trim old metrics
  if (metrics.length > maxMetrics) {
    metrics.splice(0, metrics.length - maxMetrics)
  }
}

/**
 * Increment a counter metric
 */
export function incrementCounter(name: string, tags?: Record<string, string>): void {
  recordMetric(name, 1, tags)
}

/**
 * Record timing metric (duration in milliseconds)
 */
export function recordTiming(name: string, durationMs: number, tags?: Record<string, string>): void {
  recordMetric(name, durationMs, { ...tags, unit: 'ms' })
}

/**
 * Record gauge metric (current value)
 */
export function recordGauge(name: string, value: number, tags?: Record<string, string>): void {
  recordMetric(name, value, { ...tags, type: 'gauge' })
}

/**
 * Get metrics matching a pattern
 */
export function getMetrics(namePattern?: string, tags?: Record<string, string>): Metric[] {
  return metrics.filter(metric => {
    if (namePattern && !metric.name.includes(namePattern)) {
      return false
    }
    if (tags) {
      for (const [key, value] of Object.entries(tags)) {
        if (metric.tags?.[key] !== value) {
          return false
        }
      }
    }
    return true
  })
}

/**
 * Get metric summary statistics
 */
export function getMetricSummary(name: string): {
  count: number
  sum: number
  avg: number
  min: number
  max: number
} | null {
  const matching = metrics.filter(m => m.name === name && typeof m.value === 'number')
  
  if (matching.length === 0) {
    return null
  }

  const values = matching.map(m => m.value as number)
  const sum = values.reduce((a, b) => a + b, 0)

  return {
    count: matching.length,
    sum,
    avg: sum / matching.length,
    min: Math.min(...values),
    max: Math.max(...values)
  }
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  metrics.length = 0
}

/**
 * Get all metrics as JSON
 */
export function getAllMetrics(): Metric[] {
  return [...metrics]
}

// Predefined metric names
export const MetricNames = {
  // API metrics
  API_CALL: 'api.call',
  API_SUCCESS: 'api.success',
  API_FAILURE: 'api.failure',
  API_LATENCY: 'api.latency',
  
  // Cache metrics
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  CACHE_EXPIRED: 'cache.expired',
  CACHE_STALE: 'cache.stale',
  CACHE_SIZE: 'cache.size',
  
  // Data quality metrics
  DATA_VALIDATION_PASS: 'data.validation.pass',
  DATA_VALIDATION_FAIL: 'data.validation.fail',
  DATA_COMPLETENESS: 'data.completeness',
  
  // Pipeline metrics
  PIPELINE_DURATION: 'pipeline.duration',
  PIPELINE_SUCCESS: 'pipeline.success',
  PIPELINE_FAILURE: 'pipeline.failure'
} as const

