import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Resource / Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title', maxLength: 96 } }),
    defineField({ name: 'category', type: 'string', options: { list: ['Blog', 'Download', 'Webinar', 'News'] } }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'image', type: 'image' }),
    defineField({ name: 'publishDate', type: 'date' }),
    defineField({ name: 'readingTime', type: 'string' }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block' }] })
  ]
})
