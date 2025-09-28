export const metadata = {
  title: 'Accessibility Statement'
}

export default function AccessibilityPage() {
  return (
    <section className="section bg-white">
      <div className="container max-w-4xl space-y-6">
        <h1 className="text-4xl font-semibold text-brand-navy">Accessibility Statement</h1>
        <p className="text-base text-brand-navy/70">
          SmartLead Marketing is committed to providing a website that is accessible to the widest possible audience. We target WCAG 2.1 AA compliance across design, content, and engineering.
        </p>
        <ul className="list-disc space-y-3 pl-6 text-brand-navy/70">
          <li>Accessibility audits performed at each release using automated and manual testing.</li>
          <li>Accessible forms with clear labels, focus management, and validation feedback.</li>
          <li>Support for keyboard navigation and screen readers across interactive components.</li>
        </ul>
        <p className="text-sm text-brand-navy/60">
          Feedback or barriers? Email accessibility@smartleadmarketing.com or call 1-800-555-SMART.
        </p>
      </div>
    </section>
  )
}
