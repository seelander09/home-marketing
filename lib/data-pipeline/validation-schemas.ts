import { z } from 'zod'

function isValidDate(value: string) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

export const TransactionEventSchema = z.object({
  propertyId: z.string().min(1),
  eventType: z.enum(['sale', 'refinance', 'listing-transfer', 'other']).default('sale'),
  closedDate: z
    .string()
    .refine(isValidDate, { message: 'closedDate must be a valid ISO date string' }),
  price: z.number().nonnegative().optional(),
  loanBalance: z.number().nullable().optional(),
  occupancyType: z.enum(['primary', 'investment', 'second-home']).optional()
})

export const ListingEventSchema = z.object({
  propertyId: z.string().min(1),
  listingId: z.string().min(1),
  listedDate: z
    .string()
    .refine(isValidDate, { message: 'listedDate must be a valid ISO date string' }),
  status: z.enum(['active', 'pending', 'coming-soon', 'sold', 'expired', 'withdrawn']),
  listPrice: z.number().nonnegative(),
  daysOnMarket: z.number().nullable().optional()
})

export const EngagementEventSchema = z.object({
  propertyId: z.string().min(1),
  channel: z.enum(['email', 'sms', 'web', 'call', 'app', 'social']),
  event: z.string().min(1),
  occurredAt: z
    .string()
    .refine(isValidDate, { message: 'occurredAt must be a valid ISO date string' }),
  campaign: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
})
