import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { ProductPackages } from '@/components/sections/ProductPackages'
import { PlaybookSteps } from '@/components/sections/PlaybookSteps'
import { IntegrationMarquee } from '@/components/sections/IntegrationMarquee'
import { TestimonialCarousel } from '@/components/sections/TestimonialCarousel'
import { DashboardPreview } from '@/components/sections/DashboardPreview'
import { getProductsPage } from '@/lib/cms/getContent'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getProductsPage()

  return {
    title: page.seo.title,
    description: page.seo.description
  }
}

export default async function ProductsPage() {
  const page = await getProductsPage()

  return (
    <>
      <Hero content={page.overview} />
      <ProductPackages packages={page.packages} />
      <DashboardPreview config={page.dashboard} />
      <PlaybookSteps steps={page.playbooks} />
      <IntegrationMarquee integrations={page.integrations} />
      <TestimonialCarousel testimonials={page.testimonials} headline="Brokerages that scale with SmartLead" />
    </>
  )
}
