"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { doNotSellSchema } from '@/lib/forms/schemas'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRecaptcha } from '@/components/forms/useRecaptcha'

const formSchema = doNotSellSchema.omit({ recaptchaToken: true })

type FormValues = {
  fullName: string
  email: string
  phone?: string
  message?: string
}

export function DoNotSellForm() {
  const { execute, siteKey } = useRecaptcha()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      message: ''
    }
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      const token = siteKey ? (await execute?.('do_not_sell')) ?? '' : undefined
      if (siteKey && !token) {
        throw new Error('Verification failed')
      }

      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'do-not-sell', payload: { ...values, recaptchaToken: token } })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || 'Unable to process request')
      }

      setSubmitted(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-brand-navy/10 bg-white p-6 text-brand-navy">
        <h3 className="text-xl font-semibold">Request received</h3>
        <p className="mt-3 text-sm text-brand-navy/70">
          We have logged your Do Not Sell request. Our compliance team will confirm via email within 7 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-brand-navy">Full name</label>
        <Input {...form.register('fullName')} />
        {form.formState.errors.fullName ? (
          <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.fullName.message}</p>
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
        <label className="block text-sm font-semibold text-brand-navy">Phone (optional)</label>
        <Input {...form.register('phone')} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-navy">Details</label>
        <Textarea rows={4} {...form.register('message')} />
      </div>
      {error ? <p className="text-xs text-brand-orange">{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit request'}
      </Button>
    </form>
  )
}
