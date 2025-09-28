import { z } from 'zod'

export const demoRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .regex(/^[0-9()+\-\s]*$/, 'Only numbers and formatting characters allowed'),
  role: z.string().min(1, 'Role is required'),
  brokerage: z.string().min(1, 'Brokerage is required'),
  crm: z.string().optional(),
  transactionsPerYear: z.string().optional(),
  territory: z.object({
    city: z.string().min(1, 'City is required'),
    state: z.string().length(2, 'Use 2-letter state code'),
    zip: z.string().regex(/^[0-9]{5}$/, 'Use 5 digit ZIP'),
    territoryScore: z.number().optional()
  }),
  message: z.string().max(1000).optional(),
  marketingConsent: z.boolean().optional(),
  recaptchaToken: z.string().min(1, 'Verification failed'),
  assetId: z.string().optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional()
    })
    .optional()
})

export type DemoRequestPayload = z.infer<typeof demoRequestSchema>

export const downloadRequestSchema = z.object({
  email: z.string().email('Enter a valid email'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  assetId: z.string().min(1),
  recaptchaToken: z.string().min(1)
})

export type DownloadRequestPayload = z.infer<typeof downloadRequestSchema>

export const doNotSellSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  recaptchaToken: z.string().optional()
})

export type DoNotSellPayload = z.infer<typeof doNotSellSchema>

export const territoryLookupSchema = z
  .object({
    city: z.string().optional(),
    state: z.string().length(2, 'Use state code').optional(),
    zip: z.string().regex(/^[0-9]{5}$/, '5 digit ZIP').optional()
  })
  .superRefine((value, ctx) => {
    if (!value.zip && !(value.city && value.state)) {
      ctx.addIssue({
        path: ['zip'],
        code: z.ZodIssueCode.custom,
        message: 'Provide a ZIP or city + state'
      })
    }
  })

export type TerritoryLookupPayload = z.infer<typeof territoryLookupSchema>

export const consentPreferencesSchema = z.object({
  marketing: z.boolean().default(false),
  analytics: z.boolean().default(false),
  necessary: z.literal(true).default(true)
})

export type ConsentPreferencesPayload = z.infer<typeof consentPreferencesSchema>
