import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'hero', type: 'heroSection' }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faq' }] })
  ]
})
