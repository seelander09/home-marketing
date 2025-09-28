import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'proofMarket',
  title: 'Proof Market',
  type: 'object',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'city', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'state', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'marketType', type: 'string' }),
    defineField({ name: 'inventoryLevel', type: 'string' }),
    defineField({ name: 'latitude', type: 'number', validation: (Rule) => Rule.required() }),
    defineField({ name: 'longitude', type: 'number', validation: (Rule) => Rule.required() }),
    defineField({ name: 'sellerIntentScore', type: 'number' }),
    defineField({ name: 'avgDaysOnMarket', type: 'number' }),
    defineField({ name: 'closedVolume', type: 'number', description: 'Closed volume in millions.' }),
    defineField({ name: 'caseStudyTitle', type: 'string' }),
    defineField({ name: 'caseStudySummary', type: 'text' }),
    defineField({ name: 'pdfAssetId', type: 'string' })
  ]
})
