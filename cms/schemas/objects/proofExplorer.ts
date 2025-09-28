import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'proofExplorer',
  title: 'Proof Explorer',
  type: 'object',
  fields: [
    defineField({ name: 'headline', type: 'string' }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'cta', type: 'cta' }),
    defineField({ name: 'marketTypes', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'inventoryLevels', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'markets', type: 'array', of: [{ type: 'proofMarket' }] })
  ]
})
