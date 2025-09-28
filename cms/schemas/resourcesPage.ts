import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'resourcesPage',
  title: 'Resources Page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', type: 'seo' }),
    defineField({
      name: 'featured',
      type: 'reference',
      to: [{ type: 'post' }]
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'posts',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'post' }]
        }
      ]
    })
  ]
})
