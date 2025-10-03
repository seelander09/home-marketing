"use client"

import { useEffect, useMemo, useState } from 'react'
import type { RoiCalculatorConfig, RoiScenario } from '@/lib/cms/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn, formatNumber } from '@/lib/utils'

const budgetSteps = [2500, 5000, 7500, 10000]
const householdSteps = [5000, 10000, 20000, 40000]
const ROI_STORAGE_KEY = 'smartlead-roi-result'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

type StoredRoi = {
  scenarioLabel: string
  monthlyBudget: number
  households: number
  revenue: number
  influencedDeals: number
  adjustedWinRate: number
  roi: number
}

function calculatePipeline(scenario: RoiScenario, budget: number, households: number) {
  const marketingLift = Math.min(0.65, budget / 20000)
  const territoryLift = Math.min(0.45, households / 80000)
  const adjustedWinRate = scenario.winRate + marketingLift * 0.35 + territoryLift * 0.25
  const influencedDeals = scenario.transactionVolume * adjustedWinRate
  const revenue = influencedDeals * scenario.averageCommission
  const roi = budget > 0 ? revenue / (budget * 12) : 0

  return {
    adjustedWinRate,
    influencedDeals,
    revenue,
    roi
  }
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.max(0, Math.round(value)))
}

export function RoiCalculator({ config }: { config: RoiCalculatorConfig }) {
  const [scenario, setScenario] = useState<RoiScenario>(config.scenarios[0])
  const [monthlyBudget, setMonthlyBudget] = useState<number>(budgetSteps[1])
  const [households, setHouseholds] = useState<number>(householdSteps[1])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(ROI_STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as StoredRoi
      const matchedScenario = config.scenarios.find((item) => item.label === parsed.scenarioLabel)
      if (matchedScenario) {
        setScenario(matchedScenario)
        setMonthlyBudget(parsed.monthlyBudget)
        setHouseholds(parsed.households)
      }
    } catch (error) {
      console.warn('Unable to hydrate ROI calculator from storage', error)
    }
  }, [config.scenarios])

  const results = useMemo(
    () => calculatePipeline(scenario, monthlyBudget, households),
    [scenario, monthlyBudget, households]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload: StoredRoi = {
      scenarioLabel: scenario.label,
      monthlyBudget,
      households,
      revenue: results.revenue,
      influencedDeals: results.influencedDeals,
      adjustedWinRate: results.adjustedWinRate,
      roi: results.roi
    }
    window.localStorage.setItem(ROI_STORAGE_KEY, JSON.stringify(payload))
  }, [scenario, monthlyBudget, households, results])

  return (
    <section className="section bg-surface-subtle">
      <div className="container grid gap-10 lg:grid-cols-[1.3fr,1fr]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">ROI Calculator</p>
            <h2 className="mt-3 text-3xl font-semibold text-brand-navy">{config.headline}</h2>
            <p className="mt-3 text-base text-brand-navy/70">{config.subheadline}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {config.scenarios.map((item) => (
              <Button
                key={item.label}
                type="button"
                variant={item.label === scenario.label ? 'primary' : 'secondary'}
                onClick={() => setScenario(item)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="space-y-6 rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-brand-navy">Monthly marketing budget</label>
                <Input
                  type="number"
                  min={1000}
                  step={500}
                  value={monthlyBudget}
                  onChange={(event) => setMonthlyBudget(Number(event.target.value) || 0)}
                />
                <div className="mt-3 flex gap-2">
                  {budgetSteps.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        'rounded-full border border-brand-navy/10 px-3 py-1 text-xs font-semibold text-brand-navy/70 transition hover:border-brand-turquoise hover:text-brand-navy',
                        monthlyBudget === value && 'border-brand-turquoise bg-brand-turquoise/10 text-brand-navy'
                      )}
                      onClick={() => setMonthlyBudget(value)}
                    >
                      {formatCurrency(value)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-navy">Households in territory</label>
                <Input
                  type="number"
                  min={1000}
                  step={1000}
                  value={households}
                  onChange={(event) => setHouseholds(Number(event.target.value) || 0)}
                />
                <div className="mt-3 flex gap-2">
                  {householdSteps.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        'rounded-full border border-brand-navy/10 px-3 py-1 text-xs font-semibold text-brand-navy/70 transition hover:border-brand-turquoise hover:text-brand-navy',
                        households === value && 'border-brand-turquoise bg-brand-turquoise/10 text-brand-navy'
                      )}
                      onClick={() => setHouseholds(value)}
                    >
                      {formatNumber(value)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Projected annual revenue" value={formatCurrency(results.revenue)} />
              <StatCard label="Influenced listings / year" value={formatNumber(results.influencedDeals)} />
              <StatCard label="Adjusted win rate" value={`${(results.adjustedWinRate * 100).toFixed(1)}%`} />
              <StatCard label="Return on spend" value={`${results.roi.toFixed(1)}x`} />
            </div>
            <ul className="space-y-2 text-sm text-brand-navy/60">
              {config.assumptions.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[6px] inline-flex h-1.5 w-1.5 rounded-full bg-brand-turquoise" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button type="button" onClick={() => window.open(config.primaryCta.href, '_self')}>
              {config.primaryCta.label}
            </Button>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
          <h3 className="text-xl font-semibold text-brand-navy">Scenario inputs</h3>
          <dl className="space-y-3 text-sm text-brand-navy/70">
            <InfoRow label="Annual transactions" value={formatNumber(scenario.transactionVolume)} />
            <InfoRow label="Average commission" value={formatCurrency(scenario.averageCommission)} />
            <InfoRow label="Baseline win rate" value={`${(scenario.winRate * 100).toFixed(0)}%`} />
            <InfoRow label="Annual marketing spend" value={formatCurrency(monthlyBudget * 12)} />
            <InfoRow label="Households in territory" value={formatNumber(households)} />
          </dl>
          <p className="text-xs text-brand-navy/50">
            ROI projections are directional and based on SmartLead benchmark data from recent territory launches.
          </p>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-subtle p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-navy">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="font-semibold text-brand-navy">{value}</dd>
    </div>
  )
}

