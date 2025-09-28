const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET
const RECAPTCHA_THRESHOLD = Number(process.env.RECAPTCHA_THRESHOLD ?? '0.5')

export async function verifyRecaptcha(token: string, ip?: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) {
    return true
  }

  try {
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET,
      response: token
    })

    if (ip) {
      params.append('remoteip', ip)
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })

    const data = (await response.json()) as { success: boolean; score?: number }
    if (!data.success) {
      return false
    }

    if (typeof data.score === 'number' && data.score < RECAPTCHA_THRESHOLD) {
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to verify reCAPTCHA', error)
    return false
  }
}
