"use client"

import type { ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import type { PropertyOpportunity } from '@/lib/insights/properties'
import type { HeatmapMetric } from './PropertyHeatmap'

export type MapViewMode = 'clusters' | 'heatmap' | 'choropleth'

type Range = [number, number]

type MapControlsProps = {
  viewMode: MapViewMode
  onViewModeChange: (mode: MapViewMode) => void
  activePriorities: Record<PropertyOpportunity['priority'], boolean>
  onTogglePriority: (priority: PropertyOpportunity['priority']) => void
  heatmapMetric: HeatmapMetric
  onHeatmapMetricChange: (metric: HeatmapMetric) => void
  sizeMetric: 'listingScore' | 'estimatedEquity'
  onSizeMetricChange: (metric: 'listingScore' | 'estimatedEquity') => void
  scoreRange: Range
  onScoreRangeChange: (range: Range) => void
  equityRange: Range
  onEquityRangeChange: (range: Range) => void
  showMarketRadius: boolean
  onToggleMarketRadius: (value: boolean) => void
  showOwnerConnections: boolean
  onToggleOwnerConnections: (value: boolean) => void
}

const VIEW_LABELS: Record<MapViewMode, string> = {
  clusters: 'Smart clusters',
  heatmap: 'Opportunity heatmap',
  choropleth: 'Territory choropleth'
}

const PRIORITY_ORDER: PropertyOpportunity['priority'][] = ['High Priority', 'Medium Priority', 'Low Priority']

const PRIORITY_LABELS: Record<PropertyOpportunity['priority'], string> = {
  'High Priority': 'High (80+)',
  'Medium Priority': 'Medium (60-79)',
  'Low Priority': 'Low (<60)'
}

const PRIORITY_COLORS: Record<PropertyOpportunity['priority'], string> = {
  'High Priority': '#FF564F',
  'Medium Priority': '#0BADD5',
  'Low Priority': '#4DD4AC'
}

function updateRange(range: Range, index: 0 | 1, value: number): Range {
  const next: Range = [...range] as Range
  next[index] = value
  return next
}

export function MapControls({
  viewMode,
  onViewModeChange,
  activePriorities,
  onTogglePriority,
  heatmapMetric,
  onHeatmapMetricChange,
  sizeMetric,
  onSizeMetricChange,
  scoreRange,
  onScoreRangeChange,
  equityRange,
  onEquityRangeChange,
  showMarketRadius,
  onToggleMarketRadius,
  showOwnerConnections,
  onToggleOwnerConnections
}: MapControlsProps) {
  const handleMinScoreChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10)
    onScoreRangeChange(updateRange(scoreRange, 0, Number.isNaN(value) ? 0 : value))
  }

  const handleMaxScoreChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10)
    onScoreRangeChange(updateRange(scoreRange, 1, Number.isNaN(value) ? 100 : value))
  }

  const handleMinEquityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10)
    onEquityRangeChange(updateRange(equityRange, 0, Number.isNaN(value) ? 0 : value))
  }

  const handleMaxEquityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10)
    onEquityRangeChange(updateRange(equityRange, 1, Number.isNaN(value) ? equityRange[1] : value))
  }

  return (
    <aside
      className="pointer-events-auto flex max-w-sm flex-col gap-5 rounded-3xl border border-brand-navy/10 bg-white/95 p-5 text-sm text-brand-navy shadow-card backdrop-blur"
      aria-label="Opportunity map controls"
    >
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">View</h3>
        <div className="mt-3 grid gap-2">
          {(Object.keys(VIEW_LABELS) as MapViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                'flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition',
                viewMode === mode
                  ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                  : 'border-brand-navy/10 bg-white hover:border-brand-turquoise/40 hover:text-brand-turquoise'
              )}
            >
              <span className="font-semibold">{VIEW_LABELS[mode]}</span>
              <span className="text-xs uppercase tracking-wide text-brand-navy/40">{mode}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">Focus</h3>
        <div className="mt-3 grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(
                'rounded-2xl border px-3 py-2 text-left transition',
                heatmapMetric === 'listingScore'
                  ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                  : 'border-brand-navy/10 hover:border-brand-turquoise/40 hover:text-brand-turquoise'
              )}
              onClick={() => onHeatmapMetricChange('listingScore')}
            >
              <p className="text-xs uppercase tracking-wide text-brand-navy/50">Heatmap</p>
              <p className="font-semibold">Seller intent</p>
            </button>
            <button
              type="button"
              className={cn(
                'rounded-2xl border px-3 py-2 text-left transition',
                heatmapMetric === 'estimatedEquity'
                  ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                  : 'border-brand-navy/10 hover:border-brand-turquoise/40 hover:text-brand-turquoise'
              )}
              onClick={() => onHeatmapMetricChange('estimatedEquity')}
            >
              <p className="text-xs uppercase tracking-wide text-brand-navy/50">Heatmap</p>
              <p className="font-semibold">Equity strength</p>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(
                'rounded-2xl border px-3 py-2 text-left transition',
                sizeMetric === 'listingScore'
                  ? 'border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise'
                  : 'border-brand-navy/10 hover:border-brand-turquoise/40 hover:text-brand-turquoise'
              )}
              onClick={() => onSizeMetricChange('listingScore')}
            >
              <p className="text-xs uppercase tracking-wide text-brand-navy/50">Markers</p>
              <p className="font-semibold">Score size</p>
            </button>
            <button
              type="button"
              className={cn(
                'rounded-2xl border px-3 py-2 text-left transition',
                sizeMetric === 'estimatedEquity'
                  ? 'border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise'
                  : 'border-brand-navy/10 hover:border-brand-turquoise/40 hover:text-brand-turquoise'
              )}
              onClick={() => onSizeMetricChange('estimatedEquity')}
            >
              <p className="text-xs uppercase tracking-wide text-brand-navy/50">Markers</p>
              <p className="font-semibold">Equity size</p>
            </button>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">Priority</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRIORITY_ORDER.map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => onTogglePriority(priority)}
              aria-pressed={activePriorities[priority]}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition',
                activePriorities[priority]
                  ? 'border-transparent text-white'
                  : 'border-brand-navy/10 bg-white text-brand-navy hover:border-brand-turquoise/40 hover:text-brand-turquoise'
              )}
              style={
                activePriorities[priority]
                  ? {
                      backgroundColor: PRIORITY_COLORS[priority]
                    }
                  : undefined
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                aria-hidden="true"
              />
              {PRIORITY_LABELS[priority]}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">Score range</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-brand-navy/50">Min score</span>
            <input
              aria-label="Minimum seller intent score"
              type="number"
              min={0}
              max={scoreRange[1]}
              value={scoreRange[0]}
              onChange={handleMinScoreChange}
              className="rounded-xl border border-brand-navy/15 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-brand-navy/50">Max score</span>
            <input
              aria-label="Maximum seller intent score"
              type="number"
              min={scoreRange[0]}
              max={100}
              value={scoreRange[1]}
              onChange={handleMaxScoreChange}
              className="rounded-xl border border-brand-navy/15 px-3 py-2"
            />
          </label>
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">Equity range</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-brand-navy/50">Min equity</span>
            <input
              aria-label="Minimum estimated equity"
              type="number"
              min={0}
              value={equityRange[0]}
              onChange={handleMinEquityChange}
              className="rounded-xl border border-brand-navy/15 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-brand-navy/50">Max equity</span>
            <input
              aria-label="Maximum estimated equity"
              type="number"
              min={equityRange[0]}
              value={equityRange[1]}
              onChange={handleMaxEquityChange}
              className="rounded-xl border border-brand-navy/15 px-3 py-2"
            />
          </label>
        </div>
      </section>
      <section className="flex flex-col gap-3 text-xs">
        <button
          type="button"
          onClick={() => onToggleMarketRadius(!showMarketRadius)}
          className={cn(
            'flex items-center gap-2 rounded-2xl border px-3 py-2 transition',
            showMarketRadius
              ? 'border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise'
              : 'border-brand-navy/10 hover:border-brand-turquoise/40 hover:text-brand-turquoise'
          )}
        >
          <span
            className={cn(
              'inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold',
              showMarketRadius ? 'border-brand-turquoise text-brand-turquoise' : 'border-brand-navy/30 text-brand-navy/60'
            )}
            aria-hidden="true"
          >
            {showMarketRadius ? '✓' : ''}
          </span>
          Show market radius rings
        </button>
        <button
          type="button"
          onClick={() => onToggleOwnerConnections(!showOwnerConnections)}
          className={cn(
            'flex items-center gap-2 rounded-2xl border px-3 py-2 transition',
            showOwnerConnections
              ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
              : 'border-brand-navy/10 hover:border-brand-turquoise/40 hover:text-brand-turquoise'
          )}
        >
          <span
            className={cn(
              'inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold',
              showOwnerConnections ? 'border-brand-orange text-brand-orange' : 'border-brand-navy/30 text-brand-navy/60'
            )}
            aria-hidden="true"
          >
            {showOwnerConnections ? '✓' : ''}
          </span>
          Connect shared-owner properties
        </button>
      </section>
    </aside>
  )
}
