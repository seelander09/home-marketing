"use client"

import { useMemo, useState } from 'react'
import type { RoiCalculatorConfig, RoiScenario } from '@/lib/cms/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatNumber } from '@/lib/utils'

const budgetSteps = [2500, 5000, 7500, 10000]
const householdSteps = [5000, 10000, 20000, 40000]

function calculatePipeline(scenario: RoiScenario, budget: number, households: number) {
  const marketingLift = Math.min(0.65, budget / 20000)
  const territoryLift = Math.min(0.45, households / 80000)
  const adjustedWinRate = scenario.winRate + marketingLift * 0.35 + territoryLift * 0.25
  const influencedDeals = scenario.transactionVolume * adjustedWinRate
  const revenue = influencedDeals * scenario.averageCommission
  const roi = revenue / (budget * 12)

  return {
    adjustedWinRate,
    influencedDeals,
    revenue,
    roi
  }
}

export function RoiCalculator({ config }: { config: RoiCalculatorConfig }) {
  const [scenario, setScenario] = useState<RoiScenario>(config.scenarios[0])
  const [monthlyBudget, setMonthlyBudget] = useState<number>(budgetSteps[1])
  const [households, setHouseholds] = useState<number>(householdSteps[1])

  const results = useMemo(() => calculatePipeline(scenario, monthlyBudget, households), [scenario, monthlyBudget, households])

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
                      className={ounded-full px-3 py-1 text-xs font-semibold }
                      onClick={() => setMonthlyBudget(value)}
                    >
                      
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
                      className={ounded-full px-3 py-1 text-xs font-semibold }
                      onClick={() => setHouseholds(value)}
                    >
                      {formatNumber(value)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">Projected annual revenue</p>
                <p className="mt-2 text-2xl font-semibold text-brand-navy"></p>
              </div>
              <div className="rounded-2xl bg-surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">Influenced listings / year</p>
                <p className="mt-2 text-2xl font-semibold text-brand-navy">{formatNumber(results.influencedDeals)}</p>
              </div>
              <div className="rounded-2xl bg-surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">Adjusted win rate</p>
                <p className="mt-2 text-2xl font-semibold text-brand-navy">{(results.adjustedWinRate * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl bg-surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">Return on spend</p>
                <p className="mt-2 text-2xl font-semibold text-brand-navy">{results.roi.toFixed(1)}x</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-brand-navy/60">
              {config.assumptions.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[6px] inline-flex h-1.5 w-1.5 rounded-full bg-brand-turquoise" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild>
              <a href={config.primaryCta.href}>{config.primaryCta.label}</a>
            </Button>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
          <h3 className="text-xl font-semibold text-brand-navy">Scenario inputs</h3>
          <dl className="space-y-3 text-sm text-brand-navy/70">
            <div className="flex justify-between">
              <dt>Annual transactions</dt>
              <dd className="font-semibold text-brand-navy">{scenario.transactionVolume}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Average commission</dt>
              <dd className="font-semibold text-brand-navy"></dd>
            </div>
            <div className="flex justify-between">
              <dt>Baseline win rate</dt>
              <dd className="font-semibold text-brand-navy">{(scenario.winRate * 100).toFixed(0)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Annual marketing spend</dt>
              <dd className="font-semibold text-brand-navy"></dd>
            </div>
            <div className="flex justify-between">
              <dt>Households in territory</dt>
              <dd className="font-semibold text-brand-navy">{formatNumber(households)}</dd>
            </div>
          </dl>
          <p className="text-xs text-brand-navy/50">
            ROI projections are directional and based on SmartLead benchmark data from 2024-2025 launches.
          </p>
        </div>
      </div>
    </section>
  )
}
