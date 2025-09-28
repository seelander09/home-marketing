import { type SchemaTypeDefinition } from 'sanity'

import siteSettings from './schemas/siteSettings'
import homePage from './schemas/homePage'
import productPage from './schemas/productPage'
import resourcesPage from './schemas/resourcesPage'
import aboutPage from './schemas/aboutPage'
import contactPage from './schemas/contactPage'
import post from './schemas/post'

import cta from './schemas/objects/cta'
import heroSection from './schemas/objects/hero'
import metric from './schemas/objects/metric'
import featureCard from './schemas/objects/feature'
import testimonial from './schemas/objects/testimonial'
import timelineStep from './schemas/objects/timelineStep'
import faq from './schemas/objects/faq'
import seo from './schemas/objects/seo'
import proofMarket from './schemas/objects/proofMarket'
import proofExplorer from './schemas/objects/proofExplorer'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    siteSettings,
    homePage,
    productPage,
    resourcesPage,
    aboutPage,
    contactPage,
    post,
    cta,
    heroSection,
    metric,
    featureCard,
    testimonial,
    timelineStep,
    faq,
    seo,
    proofMarket,
    proofExplorer
  ]
}
