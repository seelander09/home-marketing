export type CTA = {
  label: string
  href: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
}

export type Metric = {
  label: string
  value: number
  suffix?: string
  prefix?: string
  description?: string
}

export type Feature = {
  title: string
  description: string
  icon: string
  bullets?: string[]
}

export type Testimonial = {
  quote: string
  author: string
  role: string
  avatar?: string
  companyLogo?: string
}

export type ResourceItem = {
  title: string
  slug: string
  category: string
  description: string
  image?: string
  publishDate: string
  readingTime?: string
}

export type HeroSection = {
  eyebrow: string
  heading: string
  subheading: string
  primaryCta: CTA
  secondaryCta?: CTA
  video?: {
    provider: 'wistia' | 'vimeo'
    id: string
    thumbnail?: string
  }
  backgroundImage?: string
}

export type GuideOffer = {
  title: string
  description: string
  cta: CTA
  assetId: string
}

export type FAQItem = {
  question: string
  answer: string
}

export type TimelineStep = {
  title: string
  description: string
  icon: string
}

export type PageSEO = {
  title: string
  description: string
  keywords?: string[]
}

export type RoiScenario = {
  label: string
  transactionVolume: number
  averageCommission: number
  winRate: number
}

export type RoiCalculatorConfig = {
  headline: string
  subheadline: string
  primaryCta: CTA
  scenarios: RoiScenario[]
  assumptions: string[]
}

export type CaseStudy = {
  title: string
  summary: string
  market: string
  metrics: Metric[]
  logo?: string
  testimonial?: Testimonial
  pdfAssetId?: string
  image?: string
}

export type CaseStudiesBlock = {
  headline: string
  subheadline: string
  items: CaseStudy[]
}

export type NewsletterBlock = {
  eyebrow: string
  headline: string
  description: string
  cta: CTA
}

export type TerritoryDatasetEntry = {
  zip: string
  city: string
  state: string
  score: number
  medianHomeValue: number
  turnoverRate: number
  geojson?: string
}

export type TerritoryMapConfig = {
  headline: string
  description: string
  cta: CTA
  dataset: TerritoryDatasetEntry[]
}

export type DashboardWidget = {
  title: string
  description: string
  chartType: 'line' | 'bar' | 'doughnut'
  dataset: {
    label: string
    data: number[]
    backgroundColor?: string[]
  }[]
  labels: string[]
}

export type DashboardConfig = {
  headline: string
  subheadline: string
  widgets: DashboardWidget[]
}

export type HomePagePayload = {
  seo: PageSEO
  hero: HeroSection
  metrics: Metric[]
  logos: string[]
  features: Feature[]
  testimonials: {
    headline: string
    items: Testimonial[]
  }
  guide: GuideOffer
  roiCalculator: RoiCalculatorConfig
  caseStudies: CaseStudiesBlock
  newsletter: NewsletterBlock
  journey: TimelineStep[]
  territoryMap: TerritoryMapConfig
  resources: {
    headline: string
    items: ResourceItem[]
  }
  faqs: FAQItem[]
}

export type ProductPagePayload = {
  seo: PageSEO
  overview: HeroSection
  packages: Array<{
    name: string
    description: string
    priceHint: string
    features: string[]
    cta: CTA
  }>
  playbooks: TimelineStep[]
  integrations: string[]
  testimonials: Testimonial[]
  dashboard: DashboardConfig
}

export type ResourcePagePayload = {
  seo: PageSEO
  featured: ResourceItem
  categories: string[]
  posts: ResourceItem[]
}

export type AboutPagePayload = {
  seo: PageSEO
  story: {
    heading: string
    body: string
    stats: Metric[]
  }
  leadership: Array<{
    name: string
    title: string
    bio: string
    image?: string
  }>
  testimonials: Testimonial[]
  values: Feature[]
}

export type ContactPagePayload = {
  seo: PageSEO
  hero: HeroSection
  faqs: FAQItem[]
  partnerPortalCta: CTA
}

export type GlobalSettings = {
  seo: PageSEO
  navigation: CTA[]
  primaryCta?: CTA
  footer: {
    headline: string
    description: string
    cta: CTA
    social: CTA[]
    legal: CTA[]
  }
}
