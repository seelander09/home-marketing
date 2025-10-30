"use client"

import type { MapViewMode } from './MapControls'
import type { PropertyOpportunity } from '@/lib/insights/properties'

type MapLegendProps = {
  viewMode: MapViewMode
  scoreRange: [number, number]
  equityRange: [number, number]
}

const PRIORITY_COLORS: Record<PropertyOpportunity['priority'], string> = {
  'High Priority': '#FF564F',
  'Medium Priority': '#0BADD5',
  'Low Priority': '#4DD4AC'
}

export function MapLegend({ viewMode, scoreRange, equityRange }: MapLegendProps) {
  return (
    <aside
      className="pointer-events-auto w-72 space-y-4 rounded-3xl border border-brand-navy/10 bg-white/90 p-4 text-xs text-brand-navy shadow-card backdrop-blur"
      aria-label="Map legend"
    >
      <header>
        <h3 className="text-sm font-semibold text-brand-navy">
          {viewMode === 'heatmap' && 'Heatmap gradient'}
          {viewMode === 'clusters' && 'Cluster marker cues'}
          {viewMode === 'choropleth' && 'Choropleth scale'}
        </h3>
        <p className="text-[11px] text-brand-navy/60">
          {viewMode === 'heatmap' && 'Darker tones = higher equity or seller intent concentration.'}
          {viewMode === 'clusters' && 'Circle size grows with score/equity. Border color shows dominant priority.'}
          {viewMode === 'choropleth' && 'Regions shaded by seller intent score with interactive tooltips.'}
        </p>
      </header>
      {viewMode === 'heatmap' ? (
        <div>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#F0F5F8] via-[#4DD4AC] via-50% via-[#0BADD5] to-[#FF564F]" aria-hidden="true" />
          <div className="mt-2 flex justify-between text-[11px] text-brand-navy/60">
            <span>Low density</span>
            <span>High density</span>
          </div>
        </div>
      ) : null}
      {viewMode === 'clusters' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-turquoise bg-brand-turquoise/10 font-semibold text-brand-turquoise"
              aria-hidden="true"
            >
              12
            </span>
            <div>
              <p className="font-semibold text-brand-navy">Cluster badge</p>
              <p className="text-[11px] text-brand-navy/60">Dominant priority color with total opportunities.</p>
            </div>
          </div>
          <div className="space-y-1">
            {(Object.keys(PRIORITY_COLORS) as PropertyOpportunity['priority'][]).map((priority) => (
              <div key={priority} className="flex items-center gap-2">
                <span className="h-2.5 w-8 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[priority] }} aria-hidden="true" />
                <span className="text-[11px] font-medium text-brand-navy/70">{priority}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-surface-subtle px-3 py-2 text-[11px] text-brand-navy/60">
            Marker diameter scales linearly with the selected metric (min {scoreRange[0]} / max {scoreRange[1]} for score, min $
            {equityRange[0].toLocaleString()} / max ${equityRange[1].toLocaleString()} for equity).
          </div>
        </div>
      ) : null}
      {viewMode === 'choropleth' ? (
        <div className="space-y-3">
          <div className="grid gap-1">
            {[
              { label: '90+', color: '#FF564F' },
              { label: '80-89', color: '#FF8A7E' },
              { label: '70-79', color: '#36C9E9' },
              { label: '60-69', color: '#4DD4AC' },
              { label: '<60', color: '#C1EDE2' }
            ].map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-2">
                <span className="h-3 w-8 rounded-full" style={{ backgroundColor: bucket.color }} aria-hidden="true" />
                <span className="text-[11px] text-brand-navy/60">{bucket.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-brand-navy/60">
            Hover a region to view seller intent, median values, turnover, and total opportunities mapped to that territory.
          </p>
        </div>
      ) : null}
      <footer className="space-y-1 text-[11px] text-brand-navy/50">
        <p>• Rings mark 1, 3, and 5 mile trade areas from the active opportunity centroid.</p>
        <p>• Dotted connectors highlight owners with multi-property holdings.</p>
      </footer>
    </aside>
  )
}
