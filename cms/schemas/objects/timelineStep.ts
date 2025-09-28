import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'timelineStep',
  title: 'Timeline Step',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({
      name: 'icon',
      type: 'string',
      options: {
        list: [
          { title: 'Map', value: 'map' },
          { title: 'Megaphone', value: 'megaphone' },
          { title: 'Chart', value: 'chart' },
          { title: 'Compass', value: 'compass' },
          { title: 'Rocket', value: 'rocket' },
          { title: 'Lab', value: 'lab' }
        ]
      }
    })
  ]
})
