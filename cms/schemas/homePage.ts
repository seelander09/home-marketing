import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO'
    }),
    defineField({
      name: 'hero',
      type: 'heroSection',
      validation: (Rule) => Rule.required()
    }),
    defineField({ name: 'metrics', type: 'array', of: [{ type: 'metric' }] }),
    defineField({
      name: 'logos',
      type: 'array',
      of: [
        {
          type: 'image'
        }
      ]
    }),
    defineField({ name: 'features', type: 'array', of: [{ type: 'featureCard' }] }),
    defineField({
      name: 'testimonials',
      type: 'object',
      fields: [
        defineField({ name: 'headline', type: 'string' }),
        defineField({ name: 'items', type: 'array', of: [{ type: 'testimonial' }] })
      ]
    }),
    defineField({
      name: 'guide',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'description', type: 'text' }),
        defineField({ name: 'cta', type: 'cta' }),
        defineField({ name: 'assetId', type: 'string' })
      ]
    }),
    defineField({
      name: 'roiCalculator',
      type: 'object',
      fields: [
        defineField({ name: 'headline', type: 'string' }),
        defineField({ name: 'subheadline', type: 'text' }),
        defineField({ name: 'primaryCta', type: 'cta' }),
        defineField({
          name: 'scenarios',
          type: 'array',
          of: [
            defineField({
              name: 'scenario',
              type: 'object',
              fields: [
                defineField({ name: 'label', type: 'string' }),
                defineField({ name: 'transactionVolume', type: 'number' }),
                defineField({ name: 'averageCommission', type: 'number' }),
                defineField({ name: 'winRate', type: 'number' })
              ]
            })
          ]
        }),
        defineField({ name: 'assumptions', type: 'array', of: [{ type: 'string' }] })
      ]
    }),
    defineField({
      name: 'caseStudies',
      type: 'object',
      fields: [
        defineField({ name: 'headline', type: 'string' }),
        defineField({ name: 'subheadline', type: 'text' }),
        defineField({
          name: 'items',
          type: 'array',
          of: [
            defineField({
              name: 'caseStudy',
              type: 'object',
              fields: [
                defineField({ name: 'title', type: 'string' }),
                defineField({ name: 'summary', type: 'text' }),
                defineField({ name: 'market', type: 'string' }),
                defineField({ name: 'logo', type: 'image' }),
                defineField({ name: 'metrics', type: 'array', of: [{ type: 'metric' }] }),
                defineField({ name: 'testimonial', type: 'testimonial' }),
                defineField({ name: 'pdfAssetId', type: 'string' }),
                defineField({ name: 'image', type: 'image' })
              ]
            })
          ]
        })
      ]
    }),
    defineField({ name: 'proofExplorer', type: 'proofExplorer' }),
    defineField({
      name: 'newsletter',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'headline', type: 'string' }),
        defineField({ name: 'description', type: 'text' }),
        defineField({ name: 'cta', type: 'cta' })
      ]
    }),
    defineField({ name: 'journey', type: 'array', of: [{ type: 'timelineStep' }] }),
    defineField({
      name: 'territoryMap',
      type: 'object',
      fields: [
        defineField({ name: 'headline', type: 'string' }),
        defineField({ name: 'description', type: 'text' }),
        defineField({ name: 'cta', type: 'cta' }),
        defineField({
          name: 'dataset',
          type: 'array',
          of: [
            defineField({
              name: 'territory',
              type: 'object',
              fields: [
                defineField({ name: 'zip', type: 'string' }),
                defineField({ name: 'city', type: 'string' }),
                defineField({ name: 'state', type: 'string' }),
                defineField({ name: 'score', type: 'number' }),
                defineField({ name: 'medianHomeValue', type: 'number' }),
                defineField({ name: 'turnoverRate', type: 'number' }),
                defineField({ name: 'latitude', type: 'number' }),
                defineField({ name: 'longitude', type: 'number' })
              ]
            })
          ]
        })
      ]
    }),
    defineField({
      name: 'resources',
      type: 'object',
      fields: [
        defineField({ name: 'headline', type: 'string' }),
        defineField({
          name: 'items',
          type: 'array',
          of: [
            {
              type: 'reference',
              to: [{ type: 'post' }]
            }
          ]
        })
      ]
    }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faq' }] })
  ]
})
