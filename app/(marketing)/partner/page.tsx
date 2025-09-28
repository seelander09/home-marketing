import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartLead Partner Portal'
}

export default function PartnerPortal({ searchParams }: { searchParams: { access?: string } }) {
  const unlocked = searchParams?.access === 'smartlead'

  if (!unlocked) {
    return (
      <section className="section bg-white">
        <div className="container max-w-3xl rounded-3xl border border-brand-navy/10 bg-surface-subtle p-8">
          <h1 className="text-3xl font-semibold text-brand-navy">Partner resources are gated</h1>
          <p className="mt-3 text-brand-navy/70">
            If you are a co-marketing partner, use your custom link or append <code className="rounded bg-brand-sand px-2 py-1 text-xs text-brand-navy">?access=smartlead</code> after logging in via the CRM referral dashboard.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="section bg-white">
      <div className="container space-y-8">
        <div className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-8">
          <h1 className="text-3xl font-semibold text-brand-navy">Partner activation kit</h1>
          <p className="mt-3 text-brand-navy/70">Download co-branded assets, launch forms, and performance snapshots for your campaigns.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <a href="/downloads/partner-mailer.zip" className="group rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card hover:-translate-y-1">
            <p className="text-sm font-semibold text-brand-navy">Direct mail templates</p>
            <p className="mt-2 text-sm text-brand-navy/70">Editable InDesign + PDF assets</p>
          </a>
          <a href="/downloads/partner-digital.zip" className="group rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card hover:-translate-y-1">
            <p className="text-sm font-semibold text-brand-navy">Digital ad kit</p>
            <p className="mt-2 text-sm text-brand-navy/70">Meta + Display creatives</p>
          </a>
          <a href="/downloads/partner-report.pdf" className="group rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card hover:-translate-y-1">
            <p className="text-sm font-semibold text-brand-navy">Quarterly performance PDF</p>
            <p className="mt-2 text-sm text-brand-navy/70">Use in executive recaps</p>
          </a>
        </div>
      </div>
    </section>
  )
}
