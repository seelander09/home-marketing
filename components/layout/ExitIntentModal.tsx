"use client"

import { useCallback, useEffect, useState } from 'react'
import { GuideDownloadForm } from '@/components/forms/GuideDownloadForm'

const STORAGE_KEY = 'smartlead-exit-intent-dismissed'

export function ExitIntentModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(STORAGE_KEY)) {
      return
    }

    const handleMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) {
        setVisible(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-brand-navy/20 bg-white p-6 shadow-card">
        <button
          className="absolute right-5 top-5 text-brand-navy/50 hover:text-brand-orange"
          onClick={close}
          aria-label="Close exit intent modal"
        >
          ?
        </button>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-navy/50">Don't leave without your guide</p>
        <h2 className="mt-3 text-2xl font-semibold text-brand-navy">Unlock the 2025 Seller Playbook</h2>
        <p className="mt-2 text-sm text-brand-navy/70">
          Discover the scripts, nurture flows, and territory heat maps top SmartLead brokers are using this quarter.
        </p>
        <div className="mt-4 rounded-2xl bg-brand-navy p-5 text-white">
          <GuideDownloadForm assetId="guide-2025-seller-playbook" />
        </div>
      </div>
    </div>
  )
}
