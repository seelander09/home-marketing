"use client"

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import type { DashboardConfig, DashboardWidget } from '@/lib/cms/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

function renderWidget(widget: DashboardWidget) {
  const data = {
    labels: widget.labels,
    datasets: widget.dataset.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor ?? ['#0BADD5'],
      borderRadius: widget.chartType === 'bar' ? 12 : undefined,
      borderWidth: widget.chartType === 'line' ? 2 : 0,
      fill: widget.chartType === 'line'
    }))
  }

  if (widget.chartType === 'bar') {
    return <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />
  }
  if (widget.chartType === 'doughnut') {
    return <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%' }} />
  }
  return <Line data={data} options={{ responsive: true, maintainAspectRatio: false, tension: 0.4 }} />
}

export function DashboardPreview({ config }: { config: DashboardConfig }) {
  const widgets = useMemo(() => config.widgets.slice(0, 3), [config.widgets])

  return (
    <section className="section bg-surface-subtle">
      <div className="container space-y-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Analytics</p>
          <h2 className="mt-3 text-3xl font-semibold text-brand-navy">{config.headline}</h2>
          <p className="mt-3 text-base text-brand-navy/70">{config.subheadline}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {widgets.map((widget) => (
            <div key={widget.title} className="flex h-80 flex-col rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-navy">{widget.title}</h3>
                  <p className="text-xs text-brand-navy/50">{widget.description}</p>
                </div>
              </div>
              <div className="mt-4 flex-1">
                {renderWidget(widget)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
