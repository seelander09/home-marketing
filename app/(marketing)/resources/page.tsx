import type { Metadata } from 'next'
import { ResourceHero } from '@/components/sections/ResourceHero'
import { ResourceGrid } from '@/components/sections/ResourceGrid'
import { getResourcesPage } from '@/lib/cms/getContent'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getResourcesPage()
  return {
    title: page.seo.title,
    description: page.seo.description
  }
}

export default async function ResourcesPage() {
  const page = await getResourcesPage()

  return (
    <>
      <ResourceHero featured={page.featured} />
      <ResourceGrid posts={page.posts} />
    </>
  )
}
