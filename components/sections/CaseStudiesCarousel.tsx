"use client"

import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'
import type { CaseStudiesBlock } from '@/lib/cms/types'
import { Button } from '@/components/ui/Button'
import { formatNumber } from '@/lib/utils'

export function CaseStudiesCarousel({ block }: { block: CaseStudiesBlock }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/60">Case studies</p>
            <h2 className="mt-3 text-3xl font-semibold text-brand-navy">{block.headline}</h2>
            <p className="mt-3 text-base text-brand-navy/70">{block.subheadline}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={scrollPrev} className="btn btn-secondary border border-brand-navy/10" aria-label="Previous case study">
              ←
            </button>
            <button onClick={scrollNext} className="btn btn-secondary border border-brand-navy/10" aria-label="Next case study">
              →
            </button>
          </div>
        </div>
        <div className="mt-10 overflow-hidden" ref={emblaRef}>
          <div className="-ml-8 flex">
            {block.items.map((item) => (
              <article key={item.title} className="w-full shrink-0 px-8 md:w-1/2 xl:w-1/3">
                <div className="flex h-full flex-col gap-6 rounded-3xl border border-brand-navy/10 bg-surface-subtle p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    {item.logo ? (
                      <div className="relative h-10 w-24">
                        <Image src={item.logo} alt={${item.market} logo} fill className="object-contain" />
                      </div>
                    ) : null}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">{item.market}</p>
                      <h3 className="text-xl font-semibold text-brand-navy">{item.title}</h3>
                    </div>
                  </div>
                  {item.image ? (
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                  ) : null}
                  <p className="text-sm text-brand-navy/70">{item.summary}</p>
                  <ul className="space-y-2 text-sm text-brand-navy/80">
                    {item.metrics.map((metric) => (
                      <li key={metric.label} className="flex items-center justify-between rounded-2xl bg-white p-3">
                        <span className="font-semibold">{metric.label}</span>
                        <span>
                          {metric.prefix}
                          {formatNumber(metric.value)}
                          {metric.suffix}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {item.testimonial ? (
                    <blockquote className="rounded-2xl border border-brand-navy/10 bg-white p-4 text-sm text-brand-navy/70">
                      “{item.testimonial.quote}”
                      <footer className="mt-2 text-xs font-semibold text-brand-navy">
                        {item.testimonial.author}
                        {item.testimonial.role ? <span className="text-brand-navy/50"> · {item.testimonial.role}</span> : null}
                      </footer>
                    </blockquote>
                  ) : null}
                  {item.pdfAssetId ? (
                    <Button asChild variant="secondary">
                      <a href={/downloads/.pdf} download>
                        Download case study
                      </a>
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
