"use client"

import { useState } from 'react'
import type { FAQItem } from '@/lib/cms/types'

export function FAQAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="section bg-surface-subtle">
      <div className="container max-w-3xl">
        <h2 className="text-center text-3xl font-semibold text-brand-navy">Common questions</h2>
        <div className="mt-10 divide-y divide-brand-navy/10 rounded-3xl border border-brand-navy/10 bg-white">
          {faqs.map((faq, index) => {
            const open = openIndex === index
            return (
              <div key={faq.question}>
                <button
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-lg font-semibold text-brand-navy"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                >
                  {faq.question}
                  <span className="ml-4 text-brand-orange">{open ? '−' : '+'}</span>
                </button>
                <div className={`px-6 pb-5 text-brand-navy/70 transition-all ${open ? 'max-h-96 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
