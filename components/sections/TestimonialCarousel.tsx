"use client"

import Image from 'next/image'
import { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { Testimonial } from '@/lib/cms/types'

export function TestimonialCarousel({ testimonials, headline }: { testimonials: Testimonial[]; headline: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true, skipSnaps: false })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section className="section bg-brand-navy text-white">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <h2 className="max-w-xl text-3xl font-semibold">{headline}</h2>
          <div className="flex gap-3">
            <button onClick={scrollPrev} className="btn btn-secondary border border-white/40 bg-white/10 p-2" aria-label="Previous testimonial">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button onClick={scrollNext} className="btn btn-secondary border border-white/40 bg-white/10 p-2" aria-label="Next testimonial">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-10 overflow-hidden" ref={emblaRef}>
          <div className="-ml-6 flex">
            {testimonials.map((item, index) => (
              <article
                key={`${item.author}-${index}`}
                className="min-w-full shrink-0 px-6 md:min-w-[50%]"
              >
                <div className="h-full rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur">
                  <p className="text-lg text-white/80">“{item.quote}”</p>
                  <div className="mt-6 flex items-center gap-4">
                    {item.avatar ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/40">
                        <Image src={item.avatar} alt={item.author} fill className="object-cover" />
                      </div>
                    ) : null}
                    <div>
                      <p className="font-semibold text-white">{item.author}</p>
                      <p className="text-sm text-white/60">{item.role}</p>
                    </div>
                    {item.companyLogo ? (
                      <div className="ml-auto h-10 w-24 opacity-80">
                        <Image src={item.companyLogo} alt={`${item.author} company`} fill className="object-contain" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
