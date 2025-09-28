export const metadata = {
  title: 'Privacy Policy'
}

const sections = [
  {
    title: 'Overview',
    body: 'We respect homeowner privacy and comply with CCPA, CPRA, and other regional regulations. This policy outlines how SmartLead Marketing collects, processes, and stores personal data.'
  },
  {
    title: 'Data We Collect',
    body: 'We collect predictive seller signals, contact information provided via forms, engagement data from marketing campaigns, and CRM sync data authorized by our customers.'
  },
  {
    title: 'How We Use Data',
    body: 'Lead routing, campaign personalization, performance analytics, compliance logging, and suppression management.'
  }
]

export default function PrivacyPage() {
  return (
    <section className="section bg-white">
      <div className="container max-w-4xl space-y-8">
        <h1 className="text-4xl font-semibold text-brand-navy">Privacy Policy</h1>
        {sections.map((section) => (
          <article key={section.title}>
            <h2 className="text-2xl font-semibold text-brand-navy">{section.title}</h2>
            <p className="mt-3 text-base text-brand-navy/70">{section.body}</p>
          </article>
        ))}
        <p className="text-sm text-brand-navy/60">
          For deletion requests email privacy@smartleadmarketing.com. We respond within 7 business days.
        </p>
      </div>
    </section>
  )
}
