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
    defineField({ name: 'journey', type: 'array', of: [{ type: 'timelineStep' }] }),
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
