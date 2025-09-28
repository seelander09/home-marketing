import Image from 'next/image'
import Link from 'next/link'
import type { ResourceItem } from '@/lib/cms/types'

export function ResourceHighlights({ headline, items }: { headline: string; items: ResourceItem[] }) {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-brand-navy">{headline}</h2>
            <p className="mt-3 text-base text-brand-navy/70">
              Stay ahead with guides, webinars, and intelligence reports built for listing-obsessed teams.
            </p>
          </div>
          <Link href="/resources" className="btn btn-secondary self-start">
            View all resources
          </Link>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <Link key={item.slug} href={`/resources/${item.slug}`} className="group block rounded-3xl border border-brand-navy/10 bg-white shadow-card transition hover:-translate-y-1">
              <div className="relative h-48 overflow-hidden rounded-3xl">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-brand-sand" />
                )}
              </div>
              <div className="space-y-3 p-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-orange">{item.category}</span>
                <h3 className="text-xl font-semibold text-brand-navy">{item.title}</h3>
                <p className="text-sm text-brand-navy/70">{item.description}</p>
                <p className="text-xs text-brand-navy/50">{new Date(item.publishDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })} • {item.readingTime}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
