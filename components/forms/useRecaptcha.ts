"use client"

import { useCallback, useEffect, useState } from 'react'

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

export function useRecaptcha() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!siteKey) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (window.grecaptcha) {
      setReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.onload = () => {
      setReady(true)
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const execute = useCallback(async (action: string) => {
    if (!siteKey) {
      return null
    }
    if (!ready || typeof window === 'undefined' || !window.grecaptcha) {
      return null
    }
    return window.grecaptcha.execute(siteKey, { action })
  }, [ready])

  return { execute, ready, siteKey }
}

declare global {
  interface Window {
    grecaptcha: {
      ready(callback: () => void): void
      execute(siteKey: string, options: { action: string }): Promise<string>
    }
  }
}
