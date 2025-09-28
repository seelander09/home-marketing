export function IntegrationMarquee({ integrations }: { integrations: string[] }) {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-10 text-center shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Plug into your stack</p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-lg font-semibold text-brand-navy">
            {integrations.map((integration) => (
              <span key={integration} className="rounded-full bg-white px-5 py-2 shadow-sm">
                {integration}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
