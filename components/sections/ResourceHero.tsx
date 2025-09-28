import Image from 'next/image'
import Link from 'next/link'
import type { ResourcePagePayload } from '@/lib/cms/types'

export function ResourceHero({ featured }: { featured: ResourcePagePayload['featured'] }) {
  return (
    <section className="section bg-brand-navy text-white">
      <div className="container grid gap-10 lg:grid-cols-[1.5fr,1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Featured resource</p>
          <h1 className="mt-4 text-4xl font-semibold">{featured.title}</h1>
          <p className="mt-5 text-lg text-white/80">{featured.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span className="rounded-full border border-white/20 px-4 py-1 uppercase tracking-wide">{featured.category}</span>
            <span>{new Date(featured.publishDate).toLocaleDateString()}</span>
            <span>• {featured.readingTime}</span>
          </div>
          <Link href={`/resources/${featured.slug}`} className="btn btn-primary mt-8 inline-flex">
            Access resource
          </Link>
        </div>
        <div className="relative h-64 overflow-hidden rounded-3xl border border-white/20 bg-white/10">
          {featured.image ? <Image src={featured.image} alt={featured.title} fill className="object-cover" /> : null}
        </div>
      </div>
    </section>
  )
}
