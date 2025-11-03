import { RedfinMarketSnapshot, getStateMarketSnapshot, getCityMarketSnapshot, getZipMarketSnapshot } from './redfin'
import { CensusHousingData, getStateCensusData, getCountyCensusData, getZipCensusData } from './census'
import { HUDMarketData, getStateHUDData, getCountyHUDData, getMetroHUDData } from './hud'
import { FREDEconomicData, getFREDEconomicData } from './fred'
import { dedupeRequest } from '@/lib/data-pipeline/request-dedup'
import { recordTiming, MetricNames, incrementCounter } from '@/lib/data-pipeline/metrics'
import { createLogger } from '@/lib/data-pipeline/logger'

const logger = createLogger('unified-market-data')

export type ComprehensiveMarketData = {
  // Core identification
  regionType: 'state' | 'county' | 'city' | 'zip' | 'metro'
  regionCode: string
  regionName: string
  state: string
  stateCode: string
  
  // Data sources
  redfin: RedfinMarketSnapshot | null
  census: CensusHousingData | null
  hud: HUDMarketData | null
  economic: FREDEconomicData | null
  
  // Computed insights
  insights: {
    marketHealth: 'excellent' | 'good' | 'fair' | 'poor' | null
    affordabilityScore: number | null
    investmentPotential: number | null
    marketVelocity: number | null
    riskFactors: string[]
    opportunities: string[]
  }
  
  // Data freshness
  dataFreshness: {
    redfin: string | null
    census: string | null
    hud: string | null
    economic: string | null
    overall: string | null
  }
  
  lastUpdated: string
}

export type MarketDataRequest = {
  zip?: string
  city?: string
  state?: string
  county?: string
  metro?: string
  includeInsights?: boolean
}

function calculateAffordabilityScore(
  redfin: RedfinMarketSnapshot | null,
  census: CensusHousingData | null,
  economic: FREDEconomicData | null
): number | null {
  if (!redfin?.medianSalePrice || !census?.demographics?.medianHouseholdIncome || !economic?.mortgageRates.rate30Year) {
    return null
  }

  const annualIncome = census.demographics.medianHouseholdIncome
  const homePrice = redfin.medianSalePrice
  const interestRate = economic.mortgageRates.rate30Year / 100
  
  // Calculate monthly mortgage payment (30-year fixed)
  const monthlyRate = interestRate / 12
  const numPayments = 30 * 12
  const monthlyPayment = homePrice * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  // Add property taxes and insurance (estimate 2% of home value annually)
  const monthlyTaxesInsurance = (homePrice * 0.02) / 12
  const totalMonthlyPayment = monthlyPayment + monthlyTaxesInsurance
  
  // Calculate affordability ratio (should be < 28% of income)
  const affordabilityRatio = (totalMonthlyPayment * 12) / annualIncome
  const affordabilityScore = Math.max(0, Math.min(100, 100 - (affordabilityRatio * 100)))
  
  return Math.round(affordabilityScore)
}

function calculateInvestmentPotential(
  redfin: RedfinMarketSnapshot | null,
  census: CensusHousingData | null,
  hud: HUDMarketData | null,
  economic: FREDEconomicData | null
): number | null {
  if (!redfin) return null

  let score = 50 // Base score
  
  // Price appreciation potential
  if (redfin.soldAboveList && redfin.soldAboveList > 0.1) score += 15
  if (redfin.priceDrops && redfin.priceDrops < 0.2) score += 10
  
  // Market velocity
  if (redfin.medianDom && redfin.medianDom < 30) score += 15
  if (redfin.inventory && redfin.inventory < 1000) score += 10
  
  // Economic indicators
  if (economic?.economicIndicators.unemploymentRate && economic.economicIndicators.unemploymentRate < 5) score += 10
  
  // Population growth
  if (census?.demographics?.totalPopulation) {
    // This would need historical data for actual growth calculation
    score += 5 // Placeholder
  }
  
  return Math.min(100, Math.max(0, score))
}

function calculateMarketVelocity(
  redfin: RedfinMarketSnapshot | null
): number | null {
  if (!redfin?.medianDom || !redfin?.inventory || !redfin?.newListings) return null
  
  // Simple velocity calculation based on days on market and inventory turnover
  const domScore = Math.max(0, 100 - (redfin.medianDom / 100 * 100))
  const turnoverScore = redfin.newListings > 0 ? Math.min(100, (redfin.inventory / redfin.newListings) * 20) : 0
  
  return Math.round((domScore + turnoverScore) / 2)
}

function generateRiskFactors(
  redfin: RedfinMarketSnapshot | null,
  census: CensusHousingData | null,
  hud: HUDMarketData | null,
  economic: FREDEconomicData | null
): string[] {
  const risks: string[] = []
  
  if (redfin?.monthsOfSupply && redfin.monthsOfSupply > 6) {
    risks.push('High inventory levels (buyer\'s market)')
  }
  
  if (redfin?.medianDom && redfin.medianDom > 60) {
    risks.push('Slow market velocity')
  }
  
  if (economic?.economicIndicators.unemploymentRate && economic.economicIndicators.unemploymentRate > 8) {
    risks.push('High unemployment rate')
  }
  
  if (economic?.mortgageRates.rate30Year && economic.mortgageRates.rate30Year > 7) {
    risks.push('High mortgage rates')
  }
  
  if (census?.demographics?.povertyRate && census.demographics.povertyRate > 20) {
    risks.push('High poverty rate')
  }
  
  return risks
}

function generateOpportunities(
  redfin: RedfinMarketSnapshot | null,
  census: CensusHousingData | null,
  hud: HUDMarketData | null,
  economic: FREDEconomicData | null
): string[] {
  const opportunities: string[] = []
  
  if (redfin?.soldAboveList && redfin.soldAboveList > 0.2) {
    opportunities.push('Strong seller leverage')
  }
  
  if (redfin?.medianDom && redfin.medianDom < 20) {
    opportunities.push('Fast market velocity')
  }
  
  if (economic?.economicIndicators.unemploymentRate && economic.economicIndicators.unemploymentRate < 4) {
    opportunities.push('Low unemployment')
  }
  
  if (census?.demographics?.medianHouseholdIncome && census.demographics.medianHouseholdIncome > 75000) {
    opportunities.push('High median income')
  }
  
  if (census?.housingUnitsBuilt?.after2020 && census.housingUnitsBuilt.after2020 > 100) {
    opportunities.push('New construction activity')
  }
  
  return opportunities
}

function determineMarketHealth(
  affordabilityScore: number | null,
  investmentPotential: number | null,
  marketVelocity: number | null,
  riskFactors: string[],
  opportunities: string[]
): 'excellent' | 'good' | 'fair' | 'poor' | null {
  if (affordabilityScore === null || investmentPotential === null || marketVelocity === null) {
    return null
  }
  
  const avgScore = (affordabilityScore + investmentPotential + marketVelocity) / 3
  const riskPenalty = riskFactors.length * 5
  const opportunityBonus = opportunities.length * 3
  
  const finalScore = avgScore - riskPenalty + opportunityBonus
  
  if (finalScore >= 80) return 'excellent'
  if (finalScore >= 65) return 'good'
  if (finalScore >= 50) return 'fair'
  return 'poor'
}

export async function getComprehensiveMarketData(request: MarketDataRequest): Promise<ComprehensiveMarketData | null> {
  const startTime = Date.now()
  const { zip, city, state, county, metro, includeInsights = true } = request
  
  logger.info('Fetching comprehensive market data', { zip, city, state, county, metro })
  
  // Determine region type and prepare fetch functions
  let regionType: ComprehensiveMarketData['regionType']
  let regionCode: string
  let regionName: string
  let stateCode = ''
  let stateName = ''
  
  // Prepare parallel fetch promises
  const fetchPromises: Array<() => Promise<unknown>> = []
  const promiseLabels: string[] = []
  
  if (zip) {
    regionType = 'zip'
    regionCode = zip
    regionName = zip
    const cacheKey = `redfin:zip:${zip}`
    fetchPromises.push(() => dedupeRequest(cacheKey, () => getZipMarketSnapshot(zip)))
    promiseLabels.push('redfin')
    
    const censusKey = `census:zip:${zip}`
    fetchPromises.push(() => dedupeRequest(censusKey, () => getZipCensusData(zip)))
    promiseLabels.push('census')
    // HUD and economic data don't have ZIP-level granularity
  } else if (city && state) {
    regionType = 'city'
    regionCode = `${state}|${city}`
    regionName = city
    stateCode = state
    const cacheKey = `redfin:city:${state}:${city}`
    fetchPromises.push(() => dedupeRequest(cacheKey, () => getCityMarketSnapshot(state, city)))
    promiseLabels.push('redfin')
    // Census city data would need county lookup
  } else if (state) {
    regionType = 'state'
    regionCode = state
    regionName = state
    stateCode = state
    const redfinKey = `redfin:state:${state}`
    fetchPromises.push(() => dedupeRequest(redfinKey, () => getStateMarketSnapshot(state)))
    promiseLabels.push('redfin')
    
    const censusKey = `census:state:${state}`
    fetchPromises.push(() => dedupeRequest(censusKey, () => getStateCensusData(state)))
    promiseLabels.push('census')
    
    const hudKey = `hud:state:${state}`
    fetchPromises.push(() => dedupeRequest(hudKey, () => getStateHUDData(state)))
    promiseLabels.push('hud')
  } else if (county && state) {
    regionType = 'county'
    regionCode = `${state}|${county}`
    regionName = county
    stateCode = state
    const censusKey = `census:county:${state}:${county}`
    fetchPromises.push(() => dedupeRequest(censusKey, () => getCountyCensusData(state, county)))
    promiseLabels.push('census')
    
    const hudKey = `hud:county:${state}:${county}`
    fetchPromises.push(() => dedupeRequest(hudKey, () => getCountyHUDData(state, county)))
    promiseLabels.push('hud')
  } else if (metro) {
    regionType = 'metro'
    regionCode = metro
    regionName = metro
    const hudKey = `hud:metro:${metro}`
    fetchPromises.push(() => dedupeRequest(hudKey, () => getMetroHUDData(metro)))
    promiseLabels.push('hud')
  } else {
    return null
  }
  
  // Always fetch economic data (national level) - use deduplication
  const economicKey = 'fred:economic:national'
  fetchPromises.push(() => dedupeRequest(economicKey, () => getFREDEconomicData()))
  promiseLabels.push('economic')
  
  // Fetch all data sources in parallel with timeout
  const timeoutMs = 10000 // 10 second timeout per source
  const fetchWithTimeout = async (fn: () => Promise<unknown>, label: string) => {
    const fetchStart = Date.now()
    try {
      const result = await Promise.race([
        fn(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ])
      const duration = Date.now() - fetchStart
      recordTiming(`${MetricNames.API_LATENCY}.${label}`, duration)
      incrementCounter(`${MetricNames.API_SUCCESS}.${label}`)
      return { success: true as const, data: result, source: label }
    } catch (error) {
      const duration = Date.now() - fetchStart
      recordTiming(`${MetricNames.API_LATENCY}.${label}`, duration)
      incrementCounter(`${MetricNames.API_FAILURE}.${label}`)
      logger.error(`Failed to fetch ${label} data`, error, { source: label })
      return { success: false as const, error, source: label }
    }
  }
  
  // Execute all fetches in parallel
  const results = await Promise.all(
    fetchPromises.map((fn, index) => fetchWithTimeout(fn, promiseLabels[index]))
  )
  
  // Extract results by source
  let redfin: RedfinMarketSnapshot | null = null
  let census: CensusHousingData | null = null
  let hud: HUDMarketData | null = null
  let economic: FREDEconomicData | null = null
  
  for (const result of results) {
    if (result.success) {
      if (result.source === 'redfin') {
        redfin = result.data as RedfinMarketSnapshot | null
      } else if (result.source === 'census') {
        census = result.data as CensusHousingData | null
      } else if (result.source === 'hud') {
        hud = result.data as HUDMarketData | null
      } else if (result.source === 'economic') {
        economic = result.data as FREDEconomicData | null
      }
    } else {
      logger.warn(`Failed to fetch ${result.source} data`, { error: result.error })
    }
  }
  
  // Calculate insights if requested
  let insights: ComprehensiveMarketData['insights'] = {
    marketHealth: null,
    affordabilityScore: null,
    investmentPotential: null,
    marketVelocity: null,
    riskFactors: [],
    opportunities: []
  }

  if (includeInsights) {
    const affordabilityScore = calculateAffordabilityScore(redfin, census, economic)
    const investmentPotential = calculateInvestmentPotential(redfin, census, hud, economic)
    const marketVelocity = calculateMarketVelocity(redfin)
    const riskFactors = generateRiskFactors(redfin, census, hud, economic)
    const opportunities = generateOpportunities(redfin, census, hud, economic)
    const marketHealth = determineMarketHealth(affordabilityScore, investmentPotential, marketVelocity, riskFactors, opportunities)
    
    insights = {
      marketHealth,
      affordabilityScore,
      investmentPotential,
      marketVelocity,
      riskFactors,
      opportunities
    }
  }
  
  // Determine data freshness
  const dataFreshness = {
    redfin: redfin?.lastUpdated || null,
    census: census?.lastUpdated || null,
    hud: hud?.lastUpdated || null,
    economic: economic?.lastUpdated || null,
    overall: (() => {
      const dates = [redfin?.lastUpdated, census?.lastUpdated, hud?.lastUpdated, economic?.lastUpdated]
        .filter(Boolean)
        .map(d => new Date(d!))
      return dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null
    })()
  }
  
  const result: ComprehensiveMarketData = {
    regionType,
    regionCode,
    regionName,
    state: stateName || redfin?.state || census?.state || hud?.state || '',
    stateCode: stateCode || redfin?.stateCode || census?.stateCode || hud?.stateCode || '',
    redfin,
    census,
    hud,
    economic,
    insights,
    dataFreshness,
    lastUpdated: new Date().toISOString()
  }

  const duration = Date.now() - startTime
  recordTiming(MetricNames.PIPELINE_DURATION, duration, { regionType, regionCode })
  incrementCounter(MetricNames.PIPELINE_SUCCESS)
  
  logger.info('Comprehensive market data fetched', {
    regionType,
    regionCode,
    duration,
    sources: {
      redfin: !!redfin,
      census: !!census,
      hud: !!hud,
      economic: !!economic
    }
  })
  
  return result
}
