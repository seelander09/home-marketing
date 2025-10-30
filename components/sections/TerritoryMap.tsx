"use client"

import dynamic from 'next/dynamic'
import { SmartLink } from '@/components/ui/SmartLink'
import type { TerritoryDatasetEntry, TerritoryMapConfig } from '@/lib/cms/types'

const TerritoryMapClient = dynamic<{ dataset: TerritoryDatasetEntry[] }>(
  () => import('@/components/sections/TerritoryMap.client').then((module) => module.TerritoryMapClient),
  { ssr: false }
)

export function TerritoryMap({ config }: { config: TerritoryMapConfig }) {
  return (
    <section className="section bg-white">
      <div className="container grid gap-8 lg:grid-cols-[1fr,1.2fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Territory insights</p>
          <h2 className="text-3xl font-semibold text-brand-navy">{config.headline}</h2>
          <p className="text-base text-brand-navy/70">{config.description}</p>
          <SmartLink href={config.cta.href} className="btn btn-primary inline-flex">
            {config.cta.label}
          </SmartLink>
          <p className="text-xs text-brand-navy/50">Data updates weekly across 250+ SmartLead micro-territories.</p>
        </div>
        <div className="h-[420px]">
          <TerritoryMapClient dataset={config.dataset} />
        </div>
      </div>
    </section>
  )
}
