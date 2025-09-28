import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 5, validation: (Rule) => Rule.required() }),
    defineField({ name: 'author', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'role', type: 'string' }),
    defineField({ name: 'avatar', type: 'image' }),
    defineField({ name: 'companyLogo', type: 'image' })
  ]
})
