import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'faq',
  title: 'FAQ Item',
  type: 'object',
  fields: [
    defineField({ name: 'question', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'answer', type: 'text', rows: 4, validation: (Rule) => Rule.required() })
  ]
})
