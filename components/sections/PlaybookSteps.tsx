import type { TimelineStep } from '@/lib/cms/types'

export function PlaybookSteps({ steps }: { steps: TimelineStep[] }) {
  return (
    <section className="section bg-surface-subtle">
      <div className="container grid gap-10 lg:grid-cols-[1fr,2fr]">
        <div>
          <h2 className="text-3xl font-semibold text-brand-navy">Strategic playbooks with SmartLead strategists</h2>
          <p className="mt-4 text-base text-brand-navy/70">
            Our launch, optimization, and coaching programs mirror SmartZip enablement with more automation baked in.
          </p>
        </div>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">Phase {index + 1}</p>
              <h3 className="mt-2 text-xl font-semibold text-brand-navy">{step.title}</h3>
              <p className="mt-3 text-base text-brand-navy/75">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
