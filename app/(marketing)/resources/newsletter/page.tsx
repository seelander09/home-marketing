import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Listing Intelligence Brief'
}

export default function NewsletterLanding() {
  return (
    <section className="section bg-white">
      <div className="container max-w-3xl space-y-6">
        <h1 className="text-4xl font-semibold text-brand-navy">Listing Intelligence Brief</h1>
        <p className="text-brand-navy/70">
          Thanks for subscribing! Every Wednesday we share predictive signals, scripts, and campaign templates used by the top SmartLead teams.
        </p>
        <p className="text-sm text-brand-navy/60">
          Want to feature a success story or request custom insights? Email newsroom@smartleadmarketing.com.
        </p>
      </div>
    </section>
  )
}
