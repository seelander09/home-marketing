import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'heading', type: 'text', rows: 3, validation: (Rule) => Rule.required() }),
    defineField({ name: 'subheading', type: 'text', rows: 4 }),
    defineField({ name: 'primaryCta', type: 'cta' }),
    defineField({ name: 'secondaryCta', type: 'cta' }),
    defineField({
      name: 'video',
      type: 'object',
      fields: [
        defineField({
          name: 'provider',
          type: 'string',
          options: {
            list: [
              { title: 'Vimeo', value: 'vimeo' },
              { title: 'Wistia', value: 'wistia' }
            ]
          },
          validation: (Rule) => Rule.required()
        }),
        defineField({ name: 'id', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'thumbnail', type: 'image' })
      ]
    })
  ]
})
