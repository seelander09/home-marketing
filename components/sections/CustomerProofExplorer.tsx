import dynamic from 'next/dynamic'
import type { ProofExplorerConfig } from '@/lib/cms/types'

const ProofExplorerClient = dynamic(() => import('./CustomerProofExplorer.client').then((mod) => mod.CustomerProofExplorerClient), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-brand-navy/10 bg-surface-subtle shadow-card">
      Loading territory insight...
    </div>
  )
})

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
          <a className="btn btn-primary inline-flex" href={config.cta.href}>
            {config.cta.label}
          </a>
        </div>
        <ProofExplorerClient config={config} />
      </div>
    </section>
  )
}
