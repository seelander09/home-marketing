import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'seo', type: 'seo' }),
    defineField({
      name: 'navigation',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'href', type: 'string', validation: (Rule) => Rule.required() })
          ]
        }
      ]
    }),
    defineField({ name: 'primaryCta', type: 'cta' }),
    defineField({
      name: 'footer',
      type: 'object',
      fields: [
        defineField({ name: 'headline', type: 'string' }),
        defineField({ name: 'description', type: 'text' }),
        defineField({ name: 'cta', type: 'cta' }),
        defineField({ name: 'social', type: 'array', of: [{ type: 'cta' }] }),
        defineField({ name: 'legal', type: 'array', of: [{ type: 'cta' }] })
      ]
    })
  ]
})
