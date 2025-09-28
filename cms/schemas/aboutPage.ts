import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', type: 'seo' }),
    defineField({
      name: 'story',
      type: 'object',
      fields: [
        defineField({ name: 'heading', type: 'string' }),
        defineField({ name: 'body', type: 'text' }),
        defineField({ name: 'stats', type: 'array', of: [{ type: 'metric' }] })
      ]
    }),
    defineField({
      name: 'leadership',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string' }),
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'bio', type: 'text' }),
            defineField({ name: 'image', type: 'image' })
          ]
        }
      ]
    }),
    defineField({ name: 'testimonials', type: 'array', of: [{ type: 'testimonial' }] }),
    defineField({ name: 'values', type: 'array', of: [{ type: 'featureCard' }] })
  ]
})
