"use client"

import { useState } from 'react'
import type { NewsletterBlock } from '@/lib/cms/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function NewsletterSignup({ block }: { block: NewsletterBlock }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email')
      return
    }
    setError(null)
    try {
      await fetch('/api/forms/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName: 'Friend', lastName: 'Marketer', assetId: 'newsletter', recaptchaToken: 'mock-token' })
      })
    } catch (err) {
      // marketing integration placeholder
    }
    setSubmitted(true)
  }

  return (
    <section className="section bg-brand-navy text-white">
      <div className="container grid gap-8 rounded-3xl bg-brand-midnight/40 p-10 shadow-card lg:grid-cols-[1.4fr,1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">{block.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold">{block.headline}</h2>
          <p className="mt-3 text-base text-white/75">{block.description}</p>
        </div>
        <div>
          {submitted ? (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">
              <p className="text-lg font-semibold text-white">You’re subscribed!</p>
              <p className="mt-2">Watch your inbox for next Wednesday’s Listing Intelligence Brief.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/70" htmlFor="newsletter-email">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="you@brokerage.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {error ? <p className="text-xs text-brand-orange">{error}</p> : null}
              <Button type="submit" className="w-full">
                {block.cta.label}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
