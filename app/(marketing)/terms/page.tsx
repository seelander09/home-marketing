export const metadata = {
  title: 'Terms of Service'
}

const clauses = [
  {
    title: 'Acceptance',
    body: 'By accessing SmartLead Marketing you agree to these terms, including acceptable use and subscription policies.'
  },
  {
    title: 'Subscriptions',
    body: 'Programs renew monthly unless canceled with 30 days notice. Territory exclusivity is governed by signed agreements.'
  },
  {
    title: 'Data Rights',
    body: 'Customers own CRM data; SmartLead owns predictive models and analytics. We provide data exports upon request.'
  }
]

export default function TermsPage() {
  return (
    <section className="section bg-white">
      <div className="container max-w-4xl space-y-8">
        <h1 className="text-4xl font-semibold text-brand-navy">Terms of Service</h1>
        {clauses.map((clause) => (
          <article key={clause.title}>
            <h2 className="text-2xl font-semibold text-brand-navy">{clause.title}</h2>
            <p className="mt-3 text-base text-brand-navy/70">{clause.body}</p>
          </article>
        ))}
        <p className="text-sm text-brand-navy/60">Last updated September 2025.</p>
      </div>
    </section>
  )
}
