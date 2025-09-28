"use client"

import { useEffect, useState } from 'react'

const COOKIE_NAME = 'smartlead-consent'

type Preferences = {
  marketing: boolean
  analytics: boolean
  necessary: boolean
}

function readConsentCookie(): Preferences | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${COOKIE_NAME}=`))
  if (!cookie) return null
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1])) as Preferences
  } catch (error) {
    return null
  }
}

export function CookieConsent() {
  const [preferences, setPreferences] = useState<Preferences>({ marketing: true, analytics: true, necessary: true })
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const existing = readConsentCookie()
    if (!existing) {
      setVisible(true)
    }
  }, [])

  const savePreferences = async (next: Preferences) => {
    setSaving(true)
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'preferences', preferences: next })
      })
      setVisible(false)
    } finally {
      setSaving(false)
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-brand-navy">We value your privacy</h2>
        <p className="mt-2 text-sm text-brand-navy/70">
          We use cookies to personalize content, measure campaign performance, and improve the SmartLead experience.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-brand-navy/70">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={preferences.analytics}
              onChange={(event) => setPreferences((prev) => ({ ...prev, analytics: event.target.checked }))}
            />
            Analytics cookies
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-navy/70">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={preferences.marketing}
              onChange={(event) => setPreferences((prev) => ({ ...prev, marketing: event.target.checked }))}
            />
            Marketing cookies
          </label>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => savePreferences({ marketing: false, analytics: false, necessary: true })}
            disabled={saving}
          >
            Reject optional cookies
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => savePreferences(preferences)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Accept preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
