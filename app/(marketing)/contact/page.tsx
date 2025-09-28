import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { FAQAccordion } from '@/components/sections/FAQAccordion'
import { DemoRequestForm } from '@/components/forms/DemoRequestForm'
import { getContactPage } from '@/lib/cms/getContent'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContactPage()
  return {
    title: page.seo.title,
    description: page.seo.description
  }
}

export default async function ContactPage() {
  const page = await getContactPage()

  return (
    <>
      <Hero content={page.hero} />
      <section className="section bg-white">
        <div className="container grid gap-10 lg:grid-cols-[1.2fr,1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-brand-navy">Request a SmartLead strategy session</h2>
            <p className="mt-3 text-base text-brand-navy/70">
              Share your goals, coverage area, and current tech stack. Our strategists will tailor a SmartLead demo for your market.
            </p>
            <div className="mt-6 grid gap-4 text-sm text-brand-navy/70">
              <div>
                <p className="font-semibold text-brand-navy">Territory questions</p>
                <p>territory@smartleadmarketing.com</p>
              </div>
              <div>
                <p className="font-semibold text-brand-navy">Partner inquiries</p>
                <p>partners@smartleadmarketing.com</p>
              </div>
            </div>
          </div>
          <DemoRequestForm />
        </div>
      </section>
      <FAQAccordion faqs={page.faqs} />
    </>
  )
}
