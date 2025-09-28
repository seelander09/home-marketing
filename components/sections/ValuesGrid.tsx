import type { Feature } from '@/lib/cms/types'

export function ValuesGrid({ values }: { values: Feature[] }) {
  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="text-3xl font-semibold text-brand-navy">What guides SmartLead</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-8">
              <h3 className="text-2xl font-semibold text-brand-navy">{value.title}</h3>
              <p className="mt-3 text-base text-brand-navy/70">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
