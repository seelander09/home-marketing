"use client"

import { CustomerProofExplorerClient } from './CustomerProofExplorer.client'
import { SmartLink } from '@/components/ui/SmartLink'
import type { ProofExplorerConfig } from '@/lib/cms/types'

export function CustomerProofExplorer({ config }: { config: ProofExplorerConfig }) {
  if (!config?.markets?.length) {
    return null
  }

  return (
    <section className="section bg-white">
      <div className="container grid gap-10 lg:grid-cols-[1fr,1.1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Customer proof</p>
          <h2 className="text-3xl font-semibold text-brand-navy">{config.headline}</h2>
          <p className="text-base text-brand-navy/70">{config.description}</p>
          <p className="text-sm text-brand-navy/60">
            Filter by market style or inventory pressure to see how SmartLead partners activate winning territories.
          </p>
          <SmartLink className="btn btn-primary inline-flex" href={config.cta.href}>
            {config.cta.label}
          </SmartLink>
        </div>
        <CustomerProofExplorerClient config={config} />
      </div>
    </section>
  )
}
