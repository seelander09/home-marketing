import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'featureCard',
  title: 'Feature Card',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 4 }),
    defineField({
      name: 'icon',
      type: 'string',
      options: {
        list: [
          { title: 'Target', value: 'target' },
          { title: 'Spark', value: 'spark' },
          { title: 'Workflow', value: 'workflow' },
          { title: 'Map', value: 'map' },
          { title: 'Megaphone', value: 'megaphone' },
          { title: 'Chart', value: 'chart' },
          { title: 'People', value: 'people' },
          { title: 'Shield', value: 'shield' }
        ]
      }
    }),
    defineField({ name: 'bullets', type: 'array', of: [{ type: 'string' }] })
  ]
})
