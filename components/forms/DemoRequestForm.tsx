"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { demoRequestSchema } from '@/lib/forms/schemas'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FormStepper } from '@/components/forms/FormStepper'
import { useRecaptcha } from '@/components/forms/useRecaptcha'
import type { TerritoryMatch } from '@/lib/forms/territory'

const formSchema = demoRequestSchema.omit({ recaptchaToken: true })
type FormValues = z.infer<typeof formSchema>

const steps = [
  { title: 'Contact', description: 'How can we reach you?' },
  { title: 'Business', description: 'Tell us about your team' },
  { title: 'Territory', description: 'Where do you want to grow?' }
]

const stepFields: string[][] = [
  ['firstName', 'lastName', 'email', 'phone'],
  ['role', 'brokerage', 'crm', 'transactionsPerYear'],
  ['territory.city', 'territory.state', 'territory.zip', 'message']
]

const STORAGE_KEY = 'smartlead-demo-request'

export function DemoRequestForm() {
  const { execute: executeRecaptcha, siteKey } = useRecaptcha()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [territoryMatches, setTerritoryMatches] = useState<TerritoryMatch[]>([])
  const [savedNotice, setSavedNotice] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      brokerage: '',
      crm: '',
      transactionsPerYear: '',
      message: '',
      marketingConsent: true,
      territory: {
        city: '',
        state: '',
        zip: ''
      }
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<FormValues>
        form.reset({ ...form.getValues(), ...parsed })
      } catch (error) {
        console.warn('Failed to parse stored demo form', error)
      }
    }
  }, [form])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const subscription = form.watch((values) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
      } catch (error) {
        console.warn('Unable to persist demo form', error)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const currentFields = useMemo(() => stepFields[step], [step])

  const handleNext = async () => {
    const valid = await form.trigger(currentFields as any)
    if (!valid) return
    setStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const handleTerritoryLookup = async () => {
    const { territory } = form.getValues()
    if (!territory.zip && !(territory.city && territory.state)) {
      return
    }

    try {
      const response = await fetch('/api/territory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: territory.zip,
          city: territory.city,
          state: territory.state
        })
      })
      const data = await response.json()
      setTerritoryMatches(data.matches || [])
    } catch (error) {
      console.warn('Territory lookup failed', error)
    }
  }

  const handleSaveForLater = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form.getValues()))
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }, [form])

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const token = siteKey ? (await executeRecaptcha?.('demo_request')) ?? '' : 'mock-token'
      if (siteKey && !token) {
        throw new Error('Verification failed')
      }

      const response = await fetch('/api/forms/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, recaptchaToken: token })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Request failed')
      }

      const data = await response.json()
      setTerritoryMatches(data.territoryMatches || [])
      setSubmitted(true)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-brand-navy/10 bg-surface-subtle p-8 text-brand-navy">
        <h3 className="text-2xl font-semibold">Thanks for reaching out!</h3>
        <p className="mt-3 text-brand-navy/70">
          A SmartLead strategist will contact you within one business day. We also emailed a copy of the 2025 Seller Playbook.
        </p>
        {territoryMatches.length ? (
          <div className="mt-6 rounded-2xl border border-brand-navy/10 bg-white p-4">
            <p className="text-sm font-semibold text-brand-navy">Top territory matches</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-navy/70">
              {territoryMatches.map((match) => (
                <li key={match.zip}>
                  {match.city}, {match.state} {match.zip} Ãƒâ€š-  Seller intent score {match.score}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-3xl border border-brand-navy/10 bg-white p-8 shadow-card">
      <FormStepper steps={steps} current={step} />

      <div className="mt-6 space-y-6">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-brand-navy">First name</label>
              <Input {...form.register('firstName')} />
              {form.formState.errors.firstName ? (
                <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.firstName.message}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Last name</label>
              <Input {...form.register('lastName')} />
              {form.formState.errors.lastName ? (
                <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.lastName.message}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Email</label>
              <Input type="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Phone</label>
              <Input {...form.register('phone')} />
              {form.formState.errors.phone ? (
                <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Role</label>
              <Input {...form.register('role')} />
              {form.formState.errors.role ? (
                <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.role.message}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Brokerage / Team</label>
              <Input {...form.register('brokerage')} />
              {form.formState.errors.brokerage ? (
                <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.brokerage.message}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Primary CRM</label>
              <Input placeholder="HubSpot, Salesforce, FUB..." {...form.register('crm')} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Transactions per year</label>
              <Input {...form.register('transactionsPerYear')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-brand-navy">City</label>
                <Input {...form.register('territory.city')} />
                {form.formState.errors.territory?.city ? (
                  <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.territory.city.message}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-navy">State</label>
                <Input maxLength={2} {...form.register('territory.state')} />
                {form.formState.errors.territory?.state ? (
                  <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.territory.state.message}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-navy">ZIP</label>
                <Input maxLength={5} {...form.register('territory.zip')} />
                {form.formState.errors.territory?.zip ? (
                  <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.territory.zip.message}</p>
                ) : null}
              </div>
            </div>
            <div>
              <Button type="button" variant="secondary" onClick={handleTerritoryLookup}>
                Check territory availability
              </Button>
              {territoryMatches.length ? (
                <ul className="mt-3 space-y-2 rounded-2xl bg-surface-subtle p-4 text-sm text-brand-navy/70">
                  {territoryMatches.map((match) => (
                    <li key={`${match.city}-${match.state}-${match.zip}`}>
                      {match.city}, {match.state} {match.zip} - Score {match.score}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy">Anything else we should know?</label>
              <Textarea rows={4} {...form.register('message')} />
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-navy/70">
              <input type="checkbox" className="h-4 w-4" {...form.register('marketingConsent')} />
              I agree to receive relevant marketing updates.
            </label>
          </div>
        )}
      </div>

      {submitError ? <p className="mt-4 text-sm text-brand-orange">{submitError}</p> : null}
      {savedNotice ? <p className="mt-2 text-xs text-brand-turquoise">Progress saved! You can finish later.</p> : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handlePrev} disabled={step === 0}>
            Back
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveForLater}>
            Save progress
          </Button>
        </div>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Request demo'}
          </Button>
        )}
      </div>
    </form>
  )
}



