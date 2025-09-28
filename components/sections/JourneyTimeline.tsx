import type { TimelineStep } from '@/lib/cms/types'

const iconMap: Record<string, string> = {
  map: 'M9 2.25L3 4.5v15l6-2.25 6 2.25 6-2.25v-15L15 4.5 9 2.25z',
  megaphone: 'M3 11.25v-2.5a1 1 0 0 1 1.447-.894L9 10.5v-3A3 3 0 0 1 12 4.5h1.5v15H12a3 3 0 0 1-3-3v-3l-4.553 2.644A1 1 0 0 1 3 14.25v-3z',
  chart: 'M4.5 19.5h15M7.5 16.5v-6l3 3 4.5-6 4.5 6',
  rocket: 'M12 2.25c2.49 0 6.75 2.004 6.75 6.75 0 4.746-4.26 9-6.75 12-2.49-3-6.75-7.254-6.75-12 0-4.746 4.26-6.75 6.75-6.75z',
  compass: 'M12 3l8 4-3 10-5 4-5-4-3-10 8-4z'
}

function StepIcon({ name }: { name: string }) {
  const path = iconMap[name] || iconMap.map
  return (
    <svg className="h-10 w-10 text-brand-turquoise" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

export function JourneyTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <section className="section bg-surface-subtle">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-brand-navy">How SmartLead activates your seller funnel</h2>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-brand-navy/10 bg-white p-8 shadow-card">
              <div className="flex items-center justify-between">
                <StepIcon name={step.icon} />
                <span className="text-5xl font-bold text-brand-sand/70">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-brand-navy">{step.title}</h3>
              <p className="mt-4 text-base text-brand-navy/70">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
