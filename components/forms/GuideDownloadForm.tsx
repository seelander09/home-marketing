"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { downloadRequestSchema } from '@/lib/forms/schemas'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRecaptcha } from '@/components/forms/useRecaptcha'

const formSchema = downloadRequestSchema.omit({ recaptchaToken: true })

type FormValues = {
  firstName: string
  lastName: string
  email: string
  assetId: string
}

export function GuideDownloadForm({ assetId }: { assetId: string }) {
  const { execute, siteKey } = useRecaptcha()
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      assetId
    }
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      const token = siteKey ? (await execute?.('guide_download')) ?? '' : 'mock-token'
      if (siteKey && !token) {
        throw new Error('Verification failed')
      }

      const response = await fetch('/api/forms/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, recaptchaToken: token })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || 'Unable to unlock guide')
      }

      const data = await response.json()
      setDownloadUrl(data.downloadUrl)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (downloadUrl) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/80">
        <p className="font-semibold text-white">Guide unlocked</p>
        <p className="mt-2">Your download is ready.</p>
        <a href={downloadUrl} className="btn btn-primary mt-4 inline-flex" download>
          Download the PDF
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/70">First name</label>
          <Input {...form.register('firstName')} />
          {form.formState.errors.firstName ? (
            <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.firstName.message}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/70">Last name</label>
          <Input {...form.register('lastName')} />
          {form.formState.errors.lastName ? (
            <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.lastName.message}</p>
          ) : null}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-white/70">Email</label>
        <Input type="email" {...form.register('email')} />
        {form.formState.errors.email ? (
          <p className="mt-1 text-xs text-brand-orange">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      {error ? <p className="text-xs text-brand-orange">{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Unlocking...' : 'Get the guide'}
      </Button>
    </form>
  )
}
