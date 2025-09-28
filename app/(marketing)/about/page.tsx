import type { Metadata } from 'next'
import { StorySection } from '@/components/sections/StorySection'
import { LeadershipGrid } from '@/components/sections/LeadershipGrid'
import { ValuesGrid } from '@/components/sections/ValuesGrid'
import { TestimonialCarousel } from '@/components/sections/TestimonialCarousel'
import { getAboutPage } from '@/lib/cms/getContent'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage()
  return {
    title: page.seo.title,
    description: page.seo.description
  }
}

export default async function AboutPage() {
  const page = await getAboutPage()

  return (
    <>
      <StorySection story={page.story} />
      <LeadershipGrid leaders={page.leadership} />
      <TestimonialCarousel testimonials={page.testimonials} headline="Brokerages trusting SmartLead" />
      <ValuesGrid values={page.values} />
    </>
  )
}
