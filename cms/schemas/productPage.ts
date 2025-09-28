import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'productPage',
  title: 'Product Page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'overview', type: 'heroSection' }),
    defineField({
      name: 'packages',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string' }),
            defineField({ name: 'description', type: 'text' }),
            defineField({ name: 'priceHint', type: 'string' }),
            defineField({ name: 'features', type: 'array', of: [{ type: 'string' }] }),
            defineField({ name: 'cta', type: 'cta' })
          ]
        }
      ]
    }),
    defineField({ name: 'playbooks', type: 'array', of: [{ type: 'timelineStep' }] }),
    defineField({
      name: 'integrations',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({ name: 'testimonials', type: 'array', of: [{ type: 'testimonial' }] })
  ]
})
