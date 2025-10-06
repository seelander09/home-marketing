import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResourceBySlug, getResourcesPage } from '@/lib/cms/getContent'

export async function generateStaticParams() {
  const page = await getResourcesPage()
  return page.posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getResourceBySlug(params.slug)
  return {
    title: post.title,
    description: post.description
  }
}

export default async function ResourceDetailPage({ params }: { params: { slug: string } }) {
  try {
    const post = await getResourceBySlug(params.slug)
    return (
      <article className="section bg-white">
        <div className="container max-w-4xl">
          <Link href="/resources" className="text-sm text-brand-turquoise hover:text-brand-orange">
            Back to resources
          </Link>
          <h1 className="mt-6 text-4xl font-semibold text-brand-navy">{post.title}</h1>
          <p className="mt-3 text-base text-brand-navy/70">{post.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide text-brand-navy/50">
            <span>{post.category}</span>
            <span>{new Date(post.publishDate).toLocaleDateString()}</span>
            <span>- {post.readingTime}</span>
          </div>
          {post.image ? (
            <div className="relative mt-8 h-80 overflow-hidden rounded-3xl">
              <Image src={post.image} alt={post.title} fill className="object-cover" />
            </div>
          ) : null}
          <div
            className="mt-10 space-y-4 text-brand-navy/80 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_p]:text-base [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: post.body || '' }}
          />
        </div>
      </article>
    )
  } catch {
    notFound()
  }
}

