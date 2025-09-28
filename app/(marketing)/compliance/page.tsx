import { DoNotSellForm } from '@/components/forms/DoNotSellForm'

export const metadata = {
  title: 'Do Not Sell My Information'
}

export default function CompliancePage() {
  return (
    <section className="section bg-white">
      <div className="container grid gap-10 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold text-brand-navy">Do Not Sell My Information</h1>
          <p className="text-brand-navy/70">
            Submit this form to opt out of the sale or sharing of your personal information. SmartLead Marketing will honor
            your request within 15 days and confirm via email.
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-brand-navy/70">
            <li>Requests can be made on behalf of yourself or a household member.</li>
            <li>We will log your preferences in our suppression system and CRM within one business day.</li>
            <li>You may also email privacy@smartleadmarketing.com or call 1-800-555-SMART.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-6">
          <DoNotSellForm />
        </div>
      </div>
    </section>
  )
}
