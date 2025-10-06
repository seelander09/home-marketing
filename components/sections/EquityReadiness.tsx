"use client"

import type { EquityReadinessConfig } from '@/lib/cms/types'
import type { EquityInsight } from '@/lib/insights/realie'
import { Button } from '@/components/ui/Button'
import { formatNumber } from '@/lib/utils'

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

type EquityReadinessProps = {
  config?: EquityReadinessConfig
  insights: EquityInsight[]
}

export function EquityReadiness({ config, insights }: EquityReadinessProps) {
  const hasInsights = insights.length > 0
  const cta = config?.cta

  return (
    <section className="section bg-surface-subtle">
      <div className="container grid gap-10 lg:grid-cols-[1.15fr,1fr]">
        <div className="space-y-6">
          {config ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/60">{config.eyebrow}</p>
              <h2 className="text-3xl font-semibold text-brand-navy">{config.headline}</h2>
              <p className="text-base text-brand-navy/70">{config.description}</p>
              {config.bullets?.length ? (
                <ul className="space-y-2 text-sm text-brand-navy/60">
                  {config.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-[6px] inline-flex h-1.5 w-1.5 rounded-full bg-brand-turquoise" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {cta ? (
                <Button
                  type="button"
                  variant={cta.variant ?? 'primary'}
                  onClick={() => {
                    window.location.href = cta.href
                  }}
                >
                  {cta.label}
                </Button>
              ) : null}
            </>
          ) : (
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-brand-navy">Equity readiness insights</h2>
              <p className="text-base text-brand-navy/70">
                Combine payoff balances, closing costs, and seller net targets to predict when homeowners are ready to list.
              </p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {hasInsights ? (
            insights.map((insight) => <InsightCard key={insight.marketId} insight={insight} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-brand-navy/20 bg-white p-6 text-sm text-brand-navy/60">
              Connect your Realie API credentials to populate equity readiness benchmarks.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function InsightCard({ insight }: { insight: EquityInsight }) {
  const readinessWidth = Math.max(0, Math.min(100, insight.readinessScore))
  const bufferPositive = insight.equityBuffer >= 0
  const bufferLabel = bufferPositive ? 'Equity surplus' : 'Equity gap'
  const readinessHelper = bufferPositive
    ? 'Sellers typically clear their net goal'
    : `Owners need ${formatCurrency(Math.abs(insight.equityBuffer))} more equity`

  return (
    <div className="space-y-5 rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">Market</p>
          <h3 className="mt-1 text-lg font-semibold text-brand-navy">{insight.marketName}</h3>
          <p className="text-xs text-brand-navy/50">
            Sample size {formatNumber(insight.sampleSize)}
            {insight.lastUpdated ? ` · Updated ${formatDate(insight.lastUpdated)}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">Readiness</p>
          <p className="text-2xl font-semibold text-brand-navy">{Math.round(insight.readinessScore)}</p>
        </div>
      </div>
      <div>
        <div className="h-2 rounded-full bg-surface-subtle">
          <div className="h-full rounded-full bg-brand-turquoise" style={{ width: `${readinessWidth}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-navy/50">{readinessHelper}</p>
      </div>
      <dl className="grid gap-3 text-sm text-brand-navy/70 sm:grid-cols-2">
        <InfoRow label="Current equity" value={formatCurrency(insight.currentEquity)} />
        <InfoRow label="Break-even equity" value={formatCurrency(insight.breakEvenEquity)} />
        <InfoRow
          label={bufferLabel}
          value={`${bufferPositive ? '+' : '-'}${formatCurrency(Math.abs(insight.equityBuffer))}`}
          accent={bufferPositive ? 'positive' : 'negative'}
        />
        <InfoRow
          label="Closing cost estimate"
          value={`${formatCurrency(insight.closingCostEstimate)} (${formatPercent(insight.assumptions.closingCostRate)})`}
        />
        <InfoRow label="Seller net goal" value={formatCurrency(insight.sellerNetGoal)} />
        <InfoRow
          label="Median equity at listing"
          value={`${formatCurrency(insight.medianEquityAtListing)} (${formatPercent(insight.medianEquityRatio)})`}
        />
      </dl>
      <div className="rounded-2xl bg-surface-subtle p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">Equity distribution</p>
        <ul className="mt-2 space-y-1 text-xs text-brand-navy/70">
          {insight.percentileBreakdown.map((item) => (
            <li key={item.label} className="flex justify-between">
              <span>{item.label}</span>
              <span>
                {formatCurrency(item.equity)} ({formatPercent(item.ratio)})
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-brand-navy/50">
        {typeof insight.medianDaysOnMarket === 'number' && insight.medianDaysOnMarket > 0 ? (
          <span className="rounded-full border border-brand-navy/10 px-3 py-1">Median DOM {Math.round(insight.medianDaysOnMarket)}</span>
        ) : null}
        <span className="rounded-full border border-brand-navy/10 px-3 py-1">Last updated {formatDate(insight.lastUpdated)}</span>
        <span className="rounded-full border border-brand-navy/10 px-3 py-1">Sample {formatNumber(insight.sampleSize)}</span>
      </div>
    </div>
  )
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: 'positive' | 'negative' }) {
  const color =
    accent === 'positive'
      ? 'text-brand-turquoise'
      : accent === 'negative'
        ? 'text-brand-orange'
        : 'text-brand-navy'

  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-brand-navy/60">{label}</dt>
      <dd className={`font-semibold ${color}`}>{value}</dd>
    </div>
  )
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value))
}

function formatPercent(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  return percentFormatter.format(safe)
}

function formatDate(value?: string) {
  if (!value) {
    return '—'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }
  return dateFormatter.format(parsed)
}
