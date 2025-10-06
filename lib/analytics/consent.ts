import { cookies } from 'next/headers'

export type ConsentState = {
  analytics: boolean
  marketing: boolean
  necessary: boolean
}

const COOKIE_NAME = 'smartlead-consent'

export function getConsentFromCookies(): ConsentState {
  const store = cookies()
  const cookie = store.get(COOKIE_NAME)
  if (!cookie?.value) {
    return { analytics: false, marketing: false, necessary: true }
  }
  try {
    const parsed = JSON.parse(cookie.value) as ConsentState
    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      necessary: true
    }
  } catch (error) {
    console.warn('Failed to parse consent from cookies', error)
    return { analytics: false, marketing: false, necessary: true }
  }
}
