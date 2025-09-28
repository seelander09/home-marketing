import Image from 'next/image'
import Link from 'next/link'
import type { ResourceItem } from '@/lib/cms/types'

export function ResourceGrid({ posts }: { posts: ResourceItem[] }) {
  return (
    <section className="section bg-white">
      <div className="container grid gap-10 lg:grid-cols-[1fr,2fr]">
        <div className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-6">
          <h2 className="text-2xl font-semibold text-brand-navy">Browse by category</h2>
          <ul className="mt-4 space-y-3 text-brand-navy/70">
            {Array.from(new Set(posts.map((post) => post.category))).map((category) => (
              <li key={category} className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
                {category}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/resources/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-brand-navy/10 bg-white shadow-card transition hover:-translate-y-1"
            >
              <div className="relative h-48 w-full overflow-hidden">
                {post.image ? <Image src={post.image} alt={post.title} fill className="object-cover transition group-hover:scale-105" /> : null}
              </div>
              <div className="flex flex-1 flex-col space-y-3 p-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-orange">{post.category}</span>
                <h3 className="text-xl font-semibold text-brand-navy">{post.title}</h3>
                <p className="text-sm text-brand-navy/70">{post.description}</p>
                <p className="mt-auto text-xs text-brand-navy/50">
                  {new Date(post.publishDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {post.readingTime}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
