import dynamic from 'next/dynamic'
import type { TerritoryMapConfig } from '@/lib/cms/types'
import { Button } from '@/components/ui/Button'

const TerritoryMapClient = dynamic(() => import('@/components/sections/TerritoryMap.client').then((mod) => mod.TerritoryMapClient), {
  ssr: false,
  loading: () => <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-brand-navy/10 bg-surface-subtle">Loading map…</div>
})

export function TerritoryMap({ config }: { config: TerritoryMapConfig }) {
  return (
    <section className="section bg-white">
      <div className="container grid gap-8 lg:grid-cols-[1fr,1.2fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Territory insights</p>
          <h2 className="text-3xl font-semibold text-brand-navy">{config.headline}</h2>
          <p className="text-base text-brand-navy/70">{config.description}</p>
          <Button asChild>
            <a href={config.cta.href}>{config.cta.label}</a>
          </Button>
          <p className="text-xs text-brand-navy/50">Data updates weekly across 250+ SmartLead micro-territories.</p>
        </div>
        <div className="h-[420px] overflow-hidden rounded-3xl border border-brand-navy/10 shadow-card">
          <TerritoryMapClient dataset={config.dataset} />
        </div>
      </div>
    </section>
  )
}
