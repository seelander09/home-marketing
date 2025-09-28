import { Metadata } from 'next'
import { GuideDownloadForm } from '@/components/forms/GuideDownloadForm'

export const metadata: Metadata = {
  title: 'Compliance Resource Center'
}

const states = [
  { code: 'CA', name: 'California', summary: 'CPRA requires Do Not Sell links, consent logging, and response within 15 days.' },
  { code: 'CO', name: 'Colorado', summary: 'Colorado Privacy Act enforces universal opt-out and data minimization.' },
  { code: 'VA', name: 'Virginia', summary: 'VCDPA mandates purpose limitation and assessments for targeted advertising.' }
]

export default function ComplianceResourcesPage() {
  return (
    <section className="section bg-white">
      <div className="container grid gap-10 lg:grid-cols-[1.3fr,1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Compliance hub</p>
          <h1 className="mt-4 text-4xl font-semibold text-brand-navy">Stay ahead of state privacy requirements</h1>
          <p className="mt-4 text-base text-brand-navy/70">
            SmartLead keeps your campaigns aligned with state-level privacy mandates. Download the compliance checklist and review key regulatory highlights below.
          </p>
          <div className="mt-8 space-y-4">
            {states.map((state) => (
              <div key={state.code} className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-5">
                <p className="text-sm font-semibold text-brand-navy">{state.name}</p>
                <p className="mt-2 text-sm text-brand-navy/70">{state.summary}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-brand-navy/10 bg-brand-navy p-6 text-white shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Download</p>
          <h2 className="mt-2 text-2xl font-semibold">Multi-state compliance checklist</h2>
          <p className="mt-2 text-sm text-white/70">
            Includes processing registers, consent refresh cadence, and DSAR workflow templates you can customize for your brokerage.
          </p>
          <div className="mt-4">
            <GuideDownloadForm assetId="compliance-checklist" />
          </div>
        </div>
      </div>
    </section>
  )
}
