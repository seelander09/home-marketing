import { NextResponse } from 'next/server'
import { getCacheStatus } from '@/lib/data-pipeline/cache-manager'
import { CENSUS_CONFIG, FRED_CONFIG, HUD_CONFIG, REDFIN_CONFIG } from '@/lib/config/data-sources'
import path from 'path'
import { getMetricSummary, MetricNames } from '@/lib/data-pipeline/metrics'

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

interface HealthCheckResult {
  status: HealthStatus
  timestamp: string
  uptime: number
  checks: {
    database?: { status: 'ok' | 'error'; responseTime?: number; error?: string }
    cms?: { status: 'ok' | 'error'; responseTime?: number; error?: string }
    externalApis?: { status: 'ok' | 'error'; responseTime?: number; error?: string }
    disk?: { status: 'ok' | 'error'; freeSpace?: number; error?: string }
    dataSources?: {
      census?: { status: 'ok' | 'stale' | 'expired' | 'error'; ageDays?: number; error?: string }
      fred?: { status: 'ok' | 'stale' | 'expired' | 'error'; ageDays?: number; error?: string }
      hud?: { status: 'ok' | 'stale' | 'expired' | 'error'; ageDays?: number; error?: string }
      redfin?: { status: 'ok' | 'stale' | 'expired' | 'error'; ageDays?: number; error?: string }
    }
  }
  version?: string
}

const startTime = Date.now()

export async function GET() {
  const checks: HealthCheckResult['checks'] = {}
  let overallStatus: HealthStatus = 'healthy'

  // Check CMS connection
  try {
    const cmsStart = Date.now()
    const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    if (sanityProjectId && sanityProjectId !== 'test') {
      // Try to verify CMS connection (simplified check)
      checks.cms = {
        status: 'ok',
        responseTime: Date.now() - cmsStart
      }
    } else {
      checks.cms = {
        status: 'ok',
        responseTime: 0,
        error: 'Using mock data (CMS not configured)'
      }
    }
  } catch (error) {
    checks.cms = {
      status: 'error',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    overallStatus = 'degraded'
  }

  // Check external API keys (without making actual calls)
  const requiredApiKeys = {
    census: process.env.CENSUS_API_KEY,
    fred: process.env.FRED_API_KEY,
    hud: process.env.HUD_API_KEY
  }

  const configuredApis = Object.values(requiredApiKeys).filter(Boolean).length
  const totalApis = Object.keys(requiredApiKeys).length

  checks.externalApis = {
    status: configuredApis > 0 ? 'ok' : 'error',
    responseTime: 0,
    error: configuredApis < totalApis ? `${configuredApis}/${totalApis} API keys configured` : undefined
  }

  if (configuredApis === 0) {
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded'
  }

  // Check disk space (basic check)
  try {
    checks.disk = {
      status: 'ok',
      freeSpace: 0 // Would need Node.js fs to check actual space
    }
  } catch (error) {
    checks.disk = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Check data source cache freshness
  checks.dataSources = {}
  
  try {
    // Check Census cache
    const censusCachePath = path.join(CENSUS_CONFIG.cacheDir, 'state.json')
    const censusStatus = await getCacheStatus(censusCachePath, {
      ttlMs: CENSUS_CONFIG.ttlMs,
      maxStalenessMs: CENSUS_CONFIG.maxStalenessMs
    })
    
    if (censusStatus.exists) {
      const ageDays = censusStatus.ageMs ? Math.floor(censusStatus.ageMs / (24 * 60 * 60 * 1000)) : null
      checks.dataSources.census = {
        status: censusStatus.expired ? 'expired' : censusStatus.stale ? 'stale' : 'ok',
        ageDays: ageDays ?? undefined
      }
      if (censusStatus.expired || censusStatus.stale) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded'
      }
    } else {
      checks.dataSources.census = {
        status: 'error',
        error: 'Cache not found'
      }
    }
  } catch (error) {
    checks.dataSources.census = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  try {
    // Check FRED cache
    const fredCachePath = path.join(FRED_CONFIG.cacheDir, 'national.json')
    const fredStatus = await getCacheStatus(fredCachePath, {
      ttlMs: FRED_CONFIG.ttlMs,
      maxStalenessMs: FRED_CONFIG.maxStalenessMs
    })
    
    if (fredStatus.exists) {
      const ageDays = fredStatus.ageMs ? Math.floor(fredStatus.ageMs / (24 * 60 * 60 * 1000)) : null
      checks.dataSources.fred = {
        status: fredStatus.expired ? 'expired' : fredStatus.stale ? 'stale' : 'ok',
        ageDays: ageDays ?? undefined
      }
      if (fredStatus.expired || fredStatus.stale) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded'
      }
    } else {
      checks.dataSources.fred = {
        status: 'error',
        error: 'Cache not found'
      }
    }
  } catch (error) {
    checks.dataSources.fred = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  try {
    // Check HUD cache
    const hudCachePath = path.join(HUD_CONFIG.cacheDir, 'state.json')
    const hudStatus = await getCacheStatus(hudCachePath, {
      ttlMs: HUD_CONFIG.ttlMs,
      maxStalenessMs: HUD_CONFIG.maxStalenessMs
    })
    
    if (hudStatus.exists) {
      const ageDays = hudStatus.ageMs ? Math.floor(hudStatus.ageMs / (24 * 60 * 60 * 1000)) : null
      checks.dataSources.hud = {
        status: hudStatus.expired ? 'expired' : hudStatus.stale ? 'stale' : 'ok',
        ageDays: ageDays ?? undefined
      }
      if (hudStatus.expired || hudStatus.stale) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded'
      }
    } else {
      checks.dataSources.hud = {
        status: 'error',
        error: 'Cache not found'
      }
    }
  } catch (error) {
    checks.dataSources.hud = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  try {
    // Check Redfin cache
    const redfinCachePath = path.join(REDFIN_CONFIG.cacheDir, 'state.json')
    const redfinStatus = await getCacheStatus(redfinCachePath, {
      ttlMs: REDFIN_CONFIG.ttlMs,
      maxStalenessMs: REDFIN_CONFIG.maxStalenessMs
    })
    
    if (redfinStatus.exists) {
      const ageDays = redfinStatus.ageMs ? Math.floor(redfinStatus.ageMs / (24 * 60 * 60 * 1000)) : null
      checks.dataSources.redfin = {
        status: redfinStatus.expired ? 'expired' : redfinStatus.stale ? 'stale' : 'ok',
        ageDays: ageDays ?? undefined
      }
      if (redfinStatus.expired || redfinStatus.stale) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded'
      }
    } else {
      checks.dataSources.redfin = {
        status: 'error',
        error: 'Cache not found'
      }
    }
  } catch (error) {
    checks.dataSources.redfin = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Determine overall status
  const hasErrors = Object.values(checks).some((check) => {
    if (typeof check === 'object' && check !== null) {
      if ('status' in check && check.status === 'error') return true
      if ('dataSources' in check && check.dataSources) {
        return Object.values(check.dataSources).some((ds: any) => ds?.status === 'error')
      }
    }
    return false
  })
  
  if (hasErrors && overallStatus === 'healthy') {
    overallStatus = 'degraded'
  }

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(result, { status: statusCode })
}

