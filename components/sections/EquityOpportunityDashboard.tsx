"use client"

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn, formatNumber } from '@/lib/utils'
import {
  getPropertyOpportunities,
  listAllPropertyOpportunities,
  type PropertyOpportunity
} from '@/lib/insights/properties'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
})

const DEFAULT_MIN_SCORE = 60
const DEFAULT_MIN_EQUITY = 200000
const DEFAULT_MIN_YEARS = 5

export function EquityOpportunityDashboard() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [minScore, setMinScore] = useState(DEFAULT_MIN_SCORE)
  const [minEquity, setMinEquity] = useState(DEFAULT_MIN_EQUITY)
  const [minYears, setMinYears] = useState(DEFAULT_MIN_YEARS)

  const allProperties = useMemo(() => listAllPropertyOpportunities(), [])
  const stateOptions = useMemo(
    () => Array.from(new Set(allProperties.map((property) => property.state))).sort(),
    [allProperties]
  )

  const { properties, summary } = useMemo(
    () =>
      getPropertyOpportunities({
        query,
        city,
        state,
        zip,
        minScore,
        minEquity,
        minYears
      }),
    [query, city, state, zip, minScore, minEquity, minYears]
  )

  const handleReset = () => {
    setQuery('')
    setCity('')
    setState('')
    setZip('')
    setMinScore(DEFAULT_MIN_SCORE)
    setMinEquity(DEFAULT_MIN_EQUITY)
    setMinYears(DEFAULT_MIN_YEARS)
  }

  return (
    <section className="bg-surface-subtle pb-12 pt-24">
      <div className="container">
        <div className="rounded-4xl grid gap-8 border border-brand-navy/10 bg-white p-8 shadow-card lg:grid-cols-[320px,1fr]">
          <FilterPanel
            query={query}
            onQueryChange={setQuery}
            city={city}
            onCityChange={setCity}
            stateValue={state}
            onStateChange={setState}
            stateOptions={stateOptions}
            zip={zip}
            onZipChange={setZip}
            minScore={minScore}
            onMinScoreChange={setMinScore}
            minEquity={minEquity}
            onMinEquityChange={setMinEquity}
            minYears={minYears}
            onMinYearsChange={setMinYears}
            onReset={handleReset}
          />
          <div className="space-y-6">
            <SummaryRow summary={summary} />
            {properties.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-brand-navy/20 bg-white p-10 text-center text-brand-navy/60">
                No properties match your filters yet. Try widening the score or equity thresholds to see more inventory.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

type FilterPanelProps = {
  query: string
  onQueryChange: (value: string) => void
  city: string
  onCityChange: (value: string) => void
  stateValue: string
  onStateChange: (value: string) => void
  stateOptions: string[]
  zip: string
  onZipChange: (value: string) => void
  minScore: number
  onMinScoreChange: (value: number) => void
  minEquity: number
  onMinEquityChange: (value: number) => void
  minYears: number
  onMinYearsChange: (value: number) => void
  onReset: () => void
}

function FilterPanel({
  query,
  onQueryChange,
  city,
  onCityChange,
  stateValue,
  onStateChange,
  stateOptions,
  zip,
  onZipChange,
  minScore,
  onMinScoreChange,
  minEquity,
  onMinEquityChange,
  minYears,
  onMinYearsChange,
  onReset
}: FilterPanelProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brand-navy/10 bg-surface-subtle p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Property Filters</p>
        <p className="mt-2 text-sm text-brand-navy/60">Search by address, owner, or territory to see equity-ready sellers.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-brand-navy/60">Search</label>
          <Input
            placeholder="Address, owner name, or neighborhood"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-brand-navy/60">City</label>
            <Input placeholder="Enter city" value={city} onChange={(event) => onCityChange(event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-brand-navy/60">State</label>
            <select
              value={stateValue}
              onChange={(event) => onStateChange(event.target.value)}
              className="w-full rounded-xl border border-brand-navy/20 bg-white px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
            >
              <option value="">Select</option>
              {stateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-brand-navy/60">Zip Code</label>
            <Input placeholder="Enter ZIP" value={zip} onChange={(event) => onZipChange(event.target.value)} />
          </div>
        </div>
        <SliderInput
          label={`Minimum Listing Score: ${minScore}/100`}
          min={40}
          max={100}
          step={5}
          value={minScore}
          onChange={onMinScoreChange}
          marks={['Low Priority', 'Medium Priority', 'High Priority']}
        />
        <SliderInput
          label={`Minimum Equity: ${currencyFormatter.format(minEquity)}`}
          min={100000}
          max={750000}
          step={25000}
          value={minEquity}
          onChange={onMinEquityChange}
          marks={['$100K', '$550K', '$1M+']}
        />
        <SliderInput
          label={`Minimum Years in Home: ${minYears} years`}
          min={1}
          max={30}
          step={1}
          value={minYears}
          onChange={onMinYearsChange}
          marks={['1 year', '15 years', '30+ years']}
        />
      </div>
      <Button type="button" variant="secondary" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}

type SliderInputProps = {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  marks: string[]
}

function SliderInput({ label, min, max, step, value, onChange, marks }: SliderInputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-brand-navy/60">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-brand-turquoise"
      />
      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wide text-brand-navy/40">
        {marks.map((mark) => (
          <span key={mark}>{mark}</span>
        ))}
      </div>
    </div>
  )
}

function SummaryRow({
  summary
}: {
  summary: { total: number; highPriority: number; averageScore: number; totalEquity: number }
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard label="Total Properties" value={summary.total ? formatNumber(summary.total) : '0'} />
      <SummaryCard label="High Priority" value={formatNumber(summary.highPriority)} />
      <SummaryCard label="Avg Score" value={`${percentFormatter.format(summary.averageScore)}/100`} accent="warning" />
      <SummaryCard label="Total Equity" value={currencyFormatter.format(summary.totalEquity)} />
    </div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: 'warning' }) {
  return (
    <div className="rounded-3xl border border-brand-navy/10 bg-surface-subtle px-5 py-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold text-brand-navy',
          accent === 'warning' ? 'text-brand-orange' : undefined
        )}
      >
        {value}
      </p>
    </div>
  )
}

function PropertyCard({ property }: { property: PropertyOpportunity }) {
  const equityGain = property.marketValue - property.assessedValue
  return (
    <article className="flex h-full flex-col gap-5 rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-navy">{property.address}</h3>
          <p className="text-sm text-brand-navy/60">
            {property.city}, {property.state} {property.zip}
          </p>
        </div>
        <div className="rounded-full bg-brand-turquoise/10 px-3 py-1 text-xs font-semibold text-brand-turquoise">
          {property.listingScore}/100
        </div>
      </div>
      <div className="grid gap-2 text-sm text-brand-navy/70">
        <InfoRow label="Owner" value={property.owner} />
        <InfoRow label="Priority" value={property.priority} />
      </div>
      <div className="space-y-3 rounded-2xl bg-surface-subtle p-4 text-sm text-brand-navy">
        <ValueRow label="Assessed Value" value={currencyFormatter.format(property.assessedValue)} />
        <ValueRow label="Market Value" value={currencyFormatter.format(property.marketValue)} highlight />
        <ValueRow label="Estimated Equity" value={currencyFormatter.format(property.estimatedEquity)} positive />
        <ValueRow
          label="Potential Upside"
          value={`${equityGain >= 0 ? '+' : ''}${currencyFormatter.format(Math.abs(equityGain))}`}
          highlight={equityGain >= 0}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-brand-navy/50">
        <span>{property.yearsInHome} years in home</span>
        <div className="flex gap-2">
          <button type="button" className="rounded-full border border-brand-navy/20 px-3 py-1">
            Details
          </button>
          <button type="button" className="rounded-full bg-brand-turquoise px-3 py-1 text-white">
            Contact
          </button>
        </div>
      </div>
    </article>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-brand-navy/50">{label}</span>
      <span className="font-semibold text-brand-navy">{value}</span>
    </div>
  )
}

function ValueRow({
  label,
  value,
  highlight,
  positive
}: {
  label: string
  value: string
  highlight?: boolean
  positive?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span
        className={cn(
          'font-semibold',
          highlight ? 'text-brand-orange' : undefined,
          positive ? 'text-brand-turquoise' : undefined
        )}
      >
        {value}
      </span>
    </div>
  )
}
