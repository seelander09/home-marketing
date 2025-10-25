import fs from 'fs/promises'
import path from 'path'
import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'

import {
  createSellerAnalysisResponse,
  DEFAULT_SELLER_ANALYSIS_MOCK
} from '@/lib/predictions/mock-data'

const RUN_LOG_PATH = path.resolve(process.cwd(), 'predictions-data', 'seller-propensity-run-log.json')

const caAnalysis = createSellerAnalysisResponse(
  [
    {
      propertyId: 'sf-oak-002',
      address: '123 Oak Street',
      owner: 'John Smith',
      priority: 'High Priority',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      county: 'San Francisco County',
      neighborhood: 'Hayes Valley',
      msa: 'San Francisco Metro',
      overallScore: 91,
      latitude: 37.7793,
      longitude: -122.4192,
      yearsInHome: 4,
      estimatedEquity: 407595,
      equityUpside: 155408
    },
    {
      propertyId: 'la-hill-007',
      address: '482 Hillcrest Avenue',
      owner: 'Alicia Gomez',
      priority: 'Medium Priority',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90012',
      county: 'Los Angeles County',
      neighborhood: 'Echo Park',
      msa: 'Los Angeles Metro',
      overallScore: 82,
      latitude: 34.0619,
      longitude: -118.244,
      yearsInHome: 7,
      estimatedEquity: 365000,
      equityUpside: 142000
    }
  ],
  { filters: { state: 'CA' } }
)

const scoreAllCachedPropertyOpportunitiesMock = vi.fn(
  async (options?: { filters?: Record<string, unknown> | null }) => {
    if (options?.filters?.state === 'CA') {
      return caAnalysis.analysis
    }
    return DEFAULT_SELLER_ANALYSIS_MOCK.analysis
  }
)

let sellerPredictionsGET: typeof import('@/app/api/predictions/seller/route').GET

async function readRunLog() {
  try {
    const raw = await fs.readFile(RUN_LOG_PATH, 'utf-8')
    return JSON.parse(raw) as Array<Record<string, unknown>>
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

describe('/api/predictions/seller', () => {
  beforeAll(async () => {
    await fs.rm(RUN_LOG_PATH, { force: true })
    const sellerModule = await import('@/lib/predictions/seller-propensity')
    vi.spyOn(sellerModule, 'scoreAllCachedPropertyOpportunities').mockImplementation(
      scoreAllCachedPropertyOpportunitiesMock as typeof sellerModule.scoreAllCachedPropertyOpportunities
    )

    const module = await import('@/app/api/predictions/seller/route')
    sellerPredictionsGET = module.GET
  })

  afterAll(async () => {
    await fs.mkdir(path.dirname(RUN_LOG_PATH), { recursive: true })
  })

  test('persists run logs when generating scores', async () => {
    const request = new Request('http://localhost/api/predictions/seller?state=TX&minScore=70&limit=25')
    const response = await sellerPredictionsGET(request)
    expect(response.ok).toBe(true)

    const payload = (await response.json()) as typeof DEFAULT_SELLER_ANALYSIS_MOCK
    expect(payload.analysis.scores.length).toBeGreaterThan(0)
    expect(payload.analysis.inputs.filters).toMatchObject({ state: 'TX', minScore: 70 })
    expect(payload.metadata.persisted).toBe(true)
    expect(payload.metadata.attributionSummary).toBeDefined()
    expect(payload.metadata.cohortDimensions).toContain('ownerType')

    const logEntries = await readRunLog()
    expect(logEntries.length).toBe(1)
    expect(logEntries[0]).toMatchObject({
      filters: payload.analysis.inputs.filters,
      averageScore: payload.analysis.summary.averageScore,
      attributionSummary: payload.analysis.attributionSummary
    })
  })

  test('increments run log and supports non-persistent queries', async () => {
    const firstRequest = new Request('http://localhost/api/predictions/seller?state=CA')
    const firstResponse = await sellerPredictionsGET(firstRequest)
    expect(firstResponse.ok).toBe(true)

    let logEntries = await readRunLog()
    expect(logEntries.length).toBe(2)

    const nonPersistRequest = new Request('http://localhost/api/predictions/seller?state=CA&persist=false')
    const nonPersistResponse = await sellerPredictionsGET(nonPersistRequest)
    expect(nonPersistResponse.ok).toBe(true)

    logEntries = await readRunLog()
    expect(logEntries.length).toBe(2)
  })
})
