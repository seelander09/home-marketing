"use client"

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn, formatNumber } from '@/lib/utils'
import {
  listAllPropertyOpportunities,
  type PropertyOpportunity
} from '@/lib/insights/properties'
import type {
  SellerPropensityAnalysis,
  SellerPropensityScore
} from '@/lib/predictions/seller-propensity'
import type { SellerRadarMapPoint } from '@/components/sections/SellerRadarMap.client'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const SellerRadarMap = dynamic(
  () => import('@/components/sections/SellerRadarMap.client'),
  { ssr: false }
) as ComponentType<{ points: SellerRadarMapPoint[] }>

type FetchStatus = 'idle' | 'loading' | 'ready' | 'error'

type SellerRadarFilters = {
  state?: string
  minScore: number
  minYears: number
  limit: number
}

const DEFAULT_FILTERS: SellerRadarFilters = {
  state: undefined,
  minScore: 70,
  minYears: 3,
  limit: 50
}

const allProperties = listAllPropertyOpportunities()
const stateOptions = Array.from(new Set(allProperties.map((property) => property.state))).sort()

export function SellerRadarDashboard() {
  const [filters, setFilters] = useState<SellerRadarFilters>(DEFAULT_FILTERS)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [analysis, setAnalysis] = useState<SellerPropensityAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()
    params.set('persist', 'false')

    if (filters.state) params.set('state', filters.state)
    if (filters.minScore > 0) params.set('minScore', filters.minScore.toString())
    if (filters.minYears > 0) params.set('minYears', filters.minYears.toString())
    if (filters.limit > 0) params.set('limit', filters.limit.toString())

    setStatus('loading')
    setErrorMessage(null)

    fetch(`/api/predictions/seller?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json() as Promise<{ analysis: SellerPropensityAnalysis }>
      })
      .then((payload) => {
        setAnalysis(payload.analysis)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        console.error('Unable to load seller propensity analysis', error)
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error')
        setStatus('error')
      })

    return () => controller.abort()
  }, [filters])

  const scoreIndex = useMemo(() => {
    if (!analysis) return new Map<string, SellerPropensityScore>()
    return new Map(analysis.scores.map((score) => [score.propertyId, score]))
  }, [analysis])

  const componentRadarData = useMemo(() => {
    if (!analysis || analysis.scores.length === 0) {
      return null
    }

    const totals: Record<string, number> = {
      ownerEquityReadiness: 0,
      marketHeat: 0,
      affordabilityPressure: 0,
      macroEconomicMomentum: 0
    }

    for (const score of analysis.scores) {
      totals.ownerEquityReadiness += score.components.ownerEquityReadiness.score
      totals.marketHeat += score.components.marketHeat.score
      totals.affordabilityPressure += score.components.affordabilityPressure.score
      totals.macroEconomicMomentum += score.components.macroEconomicMomentum.score
    }

    const count = analysis.scores.length

    return {
      labels: ['Owner equity readiness', 'Market heat', 'Affordability pressure', 'Macro momentum'],
      datasets: [
        {
          label: 'Avg component score',
          data: [
            Math.round((totals.ownerEquityReadiness / count) * 10) / 10,
            Math.round((totals.marketHeat / count) * 10) / 10,
            Math.round((totals.affordabilityPressure / count) * 10) / 10,
            Math.round((totals.macroEconomicMomentum / count) * 10) / 10
          ],
          backgroundColor: 'rgba(11, 173, 213, 0.35)',
          borderColor: '#0BADD5',
          borderWidth: 2,
          pointBackgroundColor: '#0BADD5',
          pointBorderColor: '#0BADD5'
        }
      ]
    }
  }, [analysis])

  const topDrivers = useMemo(() => aggregateFrequencies(analysis?.scores ?? [], 'drivers'), [analysis])
  const topRisks = useMemo(() => aggregateFrequencies(analysis?.scores ?? [], 'riskFlags'), [analysis])

  const mapPoints = useMemo<SellerRadarMapPoint[]>(() => {
    if (!analysis) return []

    return analysis.rankings.zip.slice(0, 16).flatMap((entry) => {
      const coordinates = entry.topProperties
        .map((top) => scoreIndex.get(top.propertyId)?.geography.coordinates)
        .filter(
          (coord): coord is NonNullable<SellerPropensityScore['geography']['coordinates']> =>
            Boolean(coord?.latitude) && Boolean(coord?.longitude)
        )

      if (coordinates.length === 0) {
        return []
      }

      const latitude =
        coordinates.reduce((acc, coord) => acc + (coord.latitude ?? 0), 0) / coordinates.length
      const longitude =
        coordinates.reduce((acc, coord) => acc + (coord.longitude ?? 0), 0) / coordinates.length

      return [
        {
          id: entry.key,
          label: entry.label,
          averageScore: entry.averageScore,
          scoreRange: entry.scoreRange,
          sampleSize: entry.sampleSize,
          latitude,
          longitude
        }
      ]
    })
  }, [analysis, scoreIndex])

  const propertyIndex = useMemo(() => buildPropertyIndex(allProperties), [])

  function handleFilterChange<K extends keyof SellerRadarFilters>(key: K, value: SellerRadarFilters[K]) {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  function handleResetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  function handleExportCsv() {
    if (!analysis || analysis.scores.length === 0) return

    const headers = [
      'Property ID',
      'Address',
      'City',
      'State',
      'ZIP',
      'County',
      'Neighborhood',
      'Owner',
      'Priority',
      'Seller Score',
      'Confidence',
      'Equity Score',
      'Market Heat',
      'Affordability',
      'Macro Momentum',
      'Estimated Equity',
      'Equity Upside',
      'Years In Home'
    ]

    const rows = analysis.scores.map((score) => {
      const { geography, components, propertySummary } = score
      return [
        score.propertyId,
        score.propertyDetails.address,
        geography.city,
        geography.state,
        geography.zip,
        geography.county ?? '',
        geography.neighborhood ?? '',
        score.propertyDetails.owner,
        score.propertyDetails.priority,
        score.overallScore,
        score.confidence,
        components.ownerEquityReadiness.score,
        components.marketHeat.score,
        components.affordabilityPressure.score,
        components.macroEconomicMomentum.score,
        propertySummary.estimatedEquity,
        propertySummary.equityUpside,
        propertySummary.yearsInHome
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            if (value == null) return ''
            const cell = typeof value === 'string' ? value : value.toString()
            return `"${cell.replace(/"/g, '""')}"`
          })
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `seller-radar-${analysis.generatedAt}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function handleExportPdf() {
    if (!analysis || analysis.scores.length === 0) return

    const printable = window.open('', '_blank', 'width=1024,height=768')
    if (!printable) return

    const tableRows = analysis.scores
      .slice(0, 25)
      .map((score) => {
        const { geography, propertySummary } = score
        return `
          <tr>
            <td>${score.propertyDetails.address}<br/><small>${geography.city}, ${geography.state} ${geography.zip}</small></td>
            <td style="text-align:center">${score.overallScore}</td>
            <td style="text-align:center">${score.confidence}</td>
            <td style="text-align:center">${score.components.ownerEquityReadiness.score.toFixed(0)}</td>
            <td style="text-align:center">${score.components.marketHeat.score.toFixed(0)}</td>
            <td style="text-align:center">${score.components.affordabilityPressure.score.toFixed(0)}</td>
            <td style="text-align:center">${score.components.macroEconomicMomentum.score.toFixed(0)}</td>
            <td style="text-align:center">${formatCurrency(propertySummary.estimatedEquity)}</td>
          </tr>
        `
      })
      .join('')

    printable.document.write(`
      <html>
        <head>
          <title>Seller Radar Lead Sheet</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px; color: #051B35; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p.meta { font-size: 12px; color: #6B778C; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e1e6ef; padding: 8px 12px; font-size: 12px; }
            th { background: #f5f7fb; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>Seller Radar Lead Sheet</h1>
          <p class="meta">
            Generated ${new Date(analysis.generatedAt).toLocaleString()} &bull;
            Filters: ${filters.state ?? 'All states'} • Min score ${filters.minScore} • Min tenure ${filters.minYears} years
          </p>
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Seller Score</th>
                <th>Confidence</th>
                <th>Equity</th>
                <th>Market</th>
                <th>Affordability</th>
                <th>Macro</th>
                <th>Estimated Equity</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `)

    printable.document.close()
    printable.focus()
    printable.print()
  }

  return (
    <section className="section bg-surface-subtle">
      <div className="container space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">
            Seller Radar
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-semibold text-brand-navy">
                Rank seller-ready homeowners by trendline, territory, and risk exposure
              </h2>
              <p className="text-base text-brand-navy/70">
                Blend equity position, regional demand, affordability pressure, and macro indicators
                to prioritize listing conversations. Export a lead sheet or drill into market heat spots.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleExportPdf} disabled={!analysis?.scores.length}>
                Export lead sheet (PDF)
              </Button>
              <Button onClick={handleExportCsv} disabled={!analysis?.scores.length}>
                Export CSV
              </Button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Filters</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">
                State
              </label>
              <select
                value={filters.state ?? ''}
                onChange={(event) => handleFilterChange('state', event.target.value || undefined)}
                className="w-full rounded-full border border-brand-navy/20 px-4 py-2 text-sm focus:border-brand-turquoise focus:outline-none"
              >
                <option value="">All states</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <FilterNumberInput
              label="Minimum seller score"
              value={filters.minScore}
              min={40}
              max={100}
              onChange={(value) => handleFilterChange('minScore', value)}
            />
            <FilterNumberInput
              label="Minimum tenure (years)"
              value={filters.minYears}
              min={0}
              max={25}
              onChange={(value) => handleFilterChange('minYears', value)}
            />
            <FilterNumberInput
              label="Top properties to rank"
              value={filters.limit}
              min={10}
              max={200}
              step={10}
              onChange={(value) => handleFilterChange('limit', value)}
            />
            <div className="flex items-end">
              <Button variant="ghost" onClick={handleResetFilters}>
                Reset filters
              </Button>
            </div>
          </div>
        </section>

        <StatusPanel status={status} analysis={analysis} errorMessage={errorMessage} />

        {status === 'ready' && analysis ? (
          <>
            <SummaryGrid analysis={analysis} />

            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-navy">Component balance</h3>
                    <p className="text-xs text-brand-navy/50">
                      Average component scores for filtered properties
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-80">
                  {componentRadarData ? (
                    <Radar
                      data={componentRadarData}
                      options={{
                        scales: {
                          r: {
                            suggestedMin: 0,
                            suggestedMax: 100,
                            ticks: { display: false },
                            grid: { color: 'rgba(11, 173, 213, 0.08)' },
                            angleLines: { color: 'rgba(11, 173, 213, 0.08)' },
                            pointLabels: {
                              font: { size: 12 }
                            }
                          }
                        },
                        plugins: { legend: { display: false } }
                      }}
                    />
                  ) : (
                    <EmptyState message="No component data available for current filters." />
                  )}
                </div>
              </div>

              <div className="grid gap-6">
                <FrequencyCard title="Most common opportunity drivers" items={topDrivers} />
                <FrequencyCard title="Top risk signals to monitor" items={topRisks} tone="warning" />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <div className="rounded-3xl border border-brand-navy/10 bg-white p-0 shadow-card">
                <div className="border-b border-brand-navy/10 px-6 py-4">
                  <h3 className="text-lg font-semibold text-brand-navy">Heatmap — ZIP clusters</h3>
                  <p className="text-xs text-brand-navy/50">
                    Average seller scores for leading ZIP clusters (top 16)
                  </p>
                </div>
                <div className="h-[420px] overflow-hidden rounded-b-3xl">
                  <SellerRadarMap points={mapPoints} />
                </div>
              </div>

              <div className="rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
                <h3 className="text-lg font-semibold text-brand-navy">Geography leaderboard</h3>
                <p className="text-xs text-brand-navy/50">
                  Regions ranked by average seller score across the filtered cohort
                </p>
                <LeaderboardTabs analysis={analysis} />
              </div>
            </div>

            <PropertyTable
              analysis={analysis}
              expandedPropertyId={expandedPropertyId}
              onToggleExpand={setExpandedPropertyId}
              propertiesIndex={propertyIndex}
            />
          </>
        ) : null}
      </div>
    </section>
  )
}
function FilterNumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">
        {label}
      </label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (Number.isNaN(parsed)) return
          onChange(Math.max(min, Math.min(max, parsed)))
        }}
      />
    </div>
  )
}

function StatusPanel({
  status,
  analysis,
  errorMessage
}: {
  status: FetchStatus
  analysis: SellerPropensityAnalysis | null
  errorMessage: string | null
}) {
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-brand-navy/10 bg-white px-5 py-4 text-sm text-brand-navy/60 shadow-card">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-turquoise" />
        Updating seller radar for the latest filters…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-3xl border border-brand-orange/20 bg-brand-orange/5 px-5 py-4 text-sm text-brand-orange shadow-card">
        <strong className="font-semibold">Unable to load seller radar.</strong> {errorMessage ??
          'Please try adjusting filters or refresh the page.'}
      </div>
    )
  }

  if (status === 'ready' && analysis && analysis.scores.length === 0) {
    return (
      <div className="rounded-3xl border border-brand-navy/10 bg-white px-5 py-4 text-sm text-brand-navy/60 shadow-card">
        No properties matched the current filters. Try lowering the minimum score or expanding the
        geography.
      </div>
    )
  }

  return null
}

function SummaryGrid({ analysis }: { analysis: SellerPropensityAnalysis }) {
  const cards = [
    {
      label: 'Average seller score',
      value: Math.round(analysis.summary.averageScore),
      detail: `Range ${Math.round(analysis.summary.scoreRange.min)} – ${Math.round(analysis.summary.scoreRange.max)}`
    },
    {
      label: 'Average confidence',
      value: Math.round(analysis.summary.averageConfidence),
      detail: `${analysis.sampleSize} properties scored`
    },
    {
      label: 'Top component weight',
      value: formatPercent(Math.max(...Object.values(analysis.componentWeights))),
      detail: `${capitalize(
        getMaxWeightKey(analysis.componentWeights)
      )} weighted highest`
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="seller-radar-summary">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="rounded-3xl border border-brand-navy/10 bg-white px-6 py-5 shadow-card"
          data-testid={`seller-radar-summary-card-${index}`}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50"
            data-testid="seller-radar-summary-label"
          >
            {card.label}
          </p>
          <p
            className="mt-3 text-3xl font-semibold text-brand-navy"
            data-testid="seller-radar-summary-value"
          >
            {card.value}
          </p>
          <p className="mt-1 text-xs text-brand-navy/50" data-testid="seller-radar-summary-detail">
            {card.detail}
          </p>
        </div>
      ))}
    </div>
  )
}

function FrequencyCard({
  title,
  items,
  tone = 'default'
}: {
  title: string
  items: Array<{ label: string; count: number }>
  tone?: 'default' | 'warning'
}) {
  const isWarning = tone === 'warning'
  return (
    <div
      className={cn(
        'rounded-3xl border px-6 py-5 shadow-card',
        isWarning
          ? 'border-brand-orange/20 bg-brand-orange/5'
          : 'border-brand-navy/10 bg-white'
      )}
    >
      <h3 className="text-lg font-semibold text-brand-navy">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-brand-navy/70">
        {items.length === 0 ? (
          <li className="text-xs text-brand-navy/40">No signals surfaced — broaden filters.</li>
        ) : (
          items.slice(0, 5).map((item) => (
            <li key={item.label} className="flex justify-between">
              <span>{item.label}</span>
              <span className="font-semibold text-brand-navy">
                ×{item.count}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

function LeaderboardTabs({ analysis }: { analysis: SellerPropensityAnalysis }) {
  const [activeTab, setActiveTab] = useState<'state' | 'region' | 'zip' | 'county' | 'neighborhood'>(
    'state'
  )

  const leaderboard = analysis.rankings[activeTab]

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {(['state', 'region', 'zip', 'county', 'neighborhood'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide',
              activeTab === tab
                ? 'border-brand-turquoise bg-brand-turquoise text-white'
                : 'border-brand-navy/20 text-brand-navy/60 hover:border-brand-navy/30 hover:text-brand-navy'
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {leaderboard.slice(0, 6).map((entry) => (
          <div
            key={`${activeTab}-${entry.key}`}
            className="flex items-center justify-between rounded-2xl border border-brand-navy/10 bg-surface-subtle px-4 py-3 text-sm text-brand-navy"
          >
            <div>
              <p className="font-semibold text-brand-navy">{entry.label}</p>
              <p className="text-xs text-brand-navy/50">
                {entry.sampleSize} properties • confidence {entry.averageConfidence} • range{' '}
                {Math.round(entry.scoreRange.min)}–{Math.round(entry.scoreRange.max)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-brand-navy/40">Avg score</span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-navy shadow-sm">
                {entry.averageScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PropertyTable({
  analysis,
  propertiesIndex,
  expandedPropertyId,
  onToggleExpand
}: {
  analysis: SellerPropensityAnalysis
  propertiesIndex: Map<string, PropertyOpportunity>
  expandedPropertyId: string | null
  onToggleExpand: (propertyId: string | null) => void
}) {
  return (
    <div className="rounded-3xl border border-brand-navy/10 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-brand-navy/10 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy">Ranked seller opportunities</h3>
          <p className="text-xs text-brand-navy/50">
            Tap a row to inspect drivers, risks, and source coverage for each prospect.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-navy/10 text-sm text-brand-navy">
          <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-brand-navy/50">
            <tr>
              <th className="px-6 py-3 text-left">Property</th>
              <th className="px-4 py-3 text-center">Seller score</th>
              <th className="px-4 py-3 text-center">Confidence</th>
              <th className="px-4 py-3 text-center">Equity</th>
              <th className="px-4 py-3 text-center">Market</th>
              <th className="px-4 py-3 text-center">Affordability</th>
              <th className="px-4 py-3 text-center">Macro</th>
              <th className="px-4 py-3 text-center">Tenure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/10">
            {analysis.scores.map((score) => {
              const property = propertiesIndex.get(score.propertyId)
              const isExpanded = expandedPropertyId === score.propertyId
              return (
                <FragmentRow
                  key={score.propertyId}
                  score={score}
                  property={property}
                  isExpanded={isExpanded}
                  onToggleExpand={onToggleExpand}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FragmentRow({
  score,
  property,
  isExpanded,
  onToggleExpand
}: {
  score: SellerPropensityScore
  property: PropertyOpportunity | undefined
  isExpanded: boolean
  onToggleExpand: (propertyId: string | null) => void
}) {
  const { components, propertySummary, geography } = score
  const addressLine = property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zip}`
    : score.propertyDetails.address

  return (
    <>
      <tr
        className="cursor-pointer bg-white transition hover:bg-brand-turquoise/5"
        onClick={() => onToggleExpand(isExpanded ? null : score.propertyId)}
      >
        <td className="max-w-[260px] px-6 py-4">
          <div className="space-y-1">
            <p className="font-semibold text-brand-navy">{score.propertyDetails.address}</p>
            <p className="text-xs text-brand-navy/60">{addressLine}</p>
            <p className="text-xs text-brand-navy/40">
              {geography.county ?? 'County N/A'} • {score.propertyDetails.owner}
            </p>
          </div>
        </td>
        <Cell value={score.overallScore} highlight="primary" />
        <Cell value={score.confidence} />
        <Cell value={components.ownerEquityReadiness.score} />
        <Cell value={components.marketHeat.score} />
        <Cell value={components.affordabilityPressure.score} />
        <Cell value={components.macroEconomicMomentum.score} />
        <td className="px-4 py-4 text-center text-sm text-brand-navy/70">
          {propertySummary.yearsInHome} yrs
        </td>
      </tr>
      {isExpanded ? (
        <tr className="bg-surface-subtle/80">
          <td colSpan={8} className="px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailCard title="Top drivers" tone="positive" items={score.drivers} />
              <DetailCard title="Watchlist risks" tone="warning" items={score.riskFlags} />
              <DetailCard
                title="Data coverage"
                items={buildCoverageSummary(score)}
                tone="neutral"
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function Cell({ value, highlight }: { value: number; highlight?: 'primary' }) {
  return (
    <td className="px-4 py-4 text-center">
      <span
        className={cn(
          'inline-flex min-w-[48px] justify-center rounded-full px-3 py-1 text-sm font-semibold',
          highlight === 'primary'
            ? 'bg-brand-turquoise text-white'
            : 'bg-white text-brand-navy shadow-sm'
        )}
      >
        {Math.round(value)}
      </span>
    </td>
  )
}

function DetailCard({
  title,
  items,
  tone
}: {
  title: string
  items: string[]
  tone: 'positive' | 'warning' | 'neutral'
}) {
  const toneClasses =
    tone === 'positive'
      ? 'border-brand-turquoise/20 bg-brand-turquoise/5'
      : tone === 'warning'
        ? 'border-brand-orange/20 bg-brand-orange/5'
        : 'border-brand-navy/10 bg-white'

  return (
    <div className={cn('rounded-3xl border p-4 text-sm text-brand-navy', toneClasses)}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-navy/60">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.length ? (
          items.slice(0, 4).map((item) => (
            <li key={item} className="leading-relaxed text-brand-navy/80">
              {item}
            </li>
          ))
        ) : (
          <li className="text-xs text-brand-navy/40">No signals captured.</li>
        )}
      </ul>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-brand-navy/20 text-sm text-brand-navy/40">
      {message}
    </div>
  )
}

function buildCoverageSummary(score: SellerPropensityScore) {
  const sources = score.dataAvailability.sources
  const entries = Object.entries(sources).map(([source, available]) => ({
    label: source.toUpperCase(),
    detail: available ? 'Cached' : 'Missing'
  }))
  entries.push({
    label: 'Coverage score',
    detail: `${score.dataAvailability.coverageScore}/100`
  })
  return entries.map((entry) => `${entry.label}: ${entry.detail}`)
}

function aggregateFrequencies(
  scores: SellerPropensityScore[],
  key: 'drivers' | 'riskFlags'
): Array<{ label: string; count: number }> {
  const frequencyMap = new Map<string, number>()
  for (const score of scores) {
    const items = score[key]
    for (const item of items) {
      frequencyMap.set(item, (frequencyMap.get(item) ?? 0) + 1)
    }
  }

  return Array.from(frequencyMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function buildPropertyIndex(properties: PropertyOpportunity[]) {
  return new Map(properties.map((property) => [property.id, property]))
}

function getMaxWeightKey(weights: Record<string, number>) {
  return Object.entries(weights).reduce(
    (top, current) => (current[1] > top[1] ? current : top),
    Object.entries(weights)[0]
  )[0]
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1').trim()
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatCurrency(value: number) {
  return `$${formatNumber(Math.round(value))}`
}
