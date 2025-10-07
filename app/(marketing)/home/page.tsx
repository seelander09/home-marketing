import type { Metadata } from 'next'
import { EquityOpportunityDashboard } from '@/components/sections/EquityOpportunityDashboard'
import { Hero } from '@/components/sections/Hero'
import { LogoCarousel } from '@/components/sections/LogoCarousel'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { EquityReadiness } from '@/components/sections/EquityReadiness'
import { TestimonialCarousel } from '@/components/sections/TestimonialCarousel'
import { GuideOfferSection } from '@/components/sections/GuideOfferSection'
import { RoiCalculator } from '@/components/sections/RoiCalculator'
import { CaseStudiesCarousel } from '@/components/sections/CaseStudiesCarousel'
import { CustomerProofExplorer } from '@/components/sections/CustomerProofExplorer'
import { NewsletterSignup } from '@/components/sections/NewsletterSignup'
import { TerritoryMap } from '@/components/sections/TerritoryMap'
import { JourneyTimeline } from '@/components/sections/JourneyTimeline'
import { ResourceHighlights } from '@/components/sections/ResourceHighlights'
import { FAQAccordion } from '@/components/sections/FAQAccordion'
import { getHomePage } from '@/lib/cms/getContent'
import { getEquityInsights } from '@/lib/insights/realie'

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomePage()

  return {
    title: home.seo.title,
    description: home.seo.description,
    keywords: home.seo.keywords
  }
}

export default async function HomePage() {
  const home = await getHomePage()
  const equityInsights = await getEquityInsights({ limit: 3 })

  return (
    <>
      <EquityOpportunityDashboard />
      <Hero content={home.hero} metrics={home.metrics} />
      <LogoCarousel logos={home.logos} />
      <FeatureGrid features={home.features} />
      <EquityReadiness config={home.equityReadiness} insights={equityInsights} />
      <RoiCalculator config={home.roiCalculator} />
      <TestimonialCarousel testimonials={home.testimonials.items} headline={home.testimonials.headline} />
      <CaseStudiesCarousel block={home.caseStudies} />
      <CustomerProofExplorer config={home.proofExplorer} />
      <GuideOfferSection guide={home.guide} />
      <TerritoryMap config={home.territoryMap} />
      <NewsletterSignup block={home.newsletter} />
      <JourneyTimeline steps={home.journey} />
      <ResourceHighlights headline={home.resources.headline} items={home.resources.items} />
      <FAQAccordion faqs={home.faqs} />
    </>
  )
}


