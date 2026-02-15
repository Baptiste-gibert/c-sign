import { getCsrfToken } from './security/csrf-client'

const API_BASE = '/api'

interface SecurityHeaders {
  fingerprint?: string
  captchaToken?: string
}

export async function fetchEventByToken(token: string) {
  const res = await fetch(`${API_BASE}/events?where[signingToken][equals]=${token}&depth=1&limit=1`)
  if (!res.ok) throw new Error('Evenement introuvable')
  const data = await res.json()
  if (!data.docs || data.docs.length === 0) throw new Error('Lien de signature invalide ou expire')
  return data.docs[0]
}

export async function fetchAttendanceDay(dayId: string) {
  const res = await fetch(`${API_BASE}/attendance-days/${dayId}?depth=0`)
  if (!res.ok) throw new Error('Journée introuvable')
  const day = await res.json()

  // depth doesn't populate event relationship reliably — fetch it separately
  if (day.event) {
    const eventId = typeof day.event === 'object' ? day.event.id : day.event
    const eventRes = await fetch(`${API_BASE}/events/${eventId}?depth=0`)
    if (eventRes.ok) {
      day.event = await eventRes.json()
    }
  }

  return day
}

export async function fetchSessionsByDay(dayId: string) {
  const res = await fetch(`${API_BASE}/sessions?where[attendanceDay][equals]=${dayId}&depth=0`)
  if (!res.ok) throw new Error('Erreur chargement sessions')
  return res.json()
}

export async function createParticipant(data: Record<string, unknown>, securityHeaders?: SecurityHeaders) {
  const csrfToken = getCsrfToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  if (securityHeaders?.fingerprint) headers['X-Device-Fingerprint'] = securityHeaders.fingerprint
  if (securityHeaders?.captchaToken) headers['X-Captcha-Token'] = securityHeaders.captchaToken

  const res = await fetch(`${API_BASE}/participants`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errors?.[0]?.message || 'Erreur création participant')
  }
  return res.json()
}

export async function uploadSignatureImage(blob: Blob, securityHeaders?: SecurityHeaders) {
  const csrfToken = getCsrfToken()
  const headers: Record<string, string> = {}
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  if (securityHeaders?.fingerprint) headers['X-Device-Fingerprint'] = securityHeaders.fingerprint
  if (securityHeaders?.captchaToken) headers['X-Captcha-Token'] = securityHeaders.captchaToken

  const formData = new FormData()
  formData.append('file', blob, `signature-${Date.now()}.png`)
  const res = await fetch(`${API_BASE}/media`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) throw new Error('Erreur upload signature')
  return res.json()
}

export async function createSignature(data: {
  participant: number | string
  session: number | string
  image: number | string
  rightToImage: boolean
}, securityHeaders?: SecurityHeaders) {
  const csrfToken = getCsrfToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  if (securityHeaders?.fingerprint) headers['X-Device-Fingerprint'] = securityHeaders.fingerprint
  if (securityHeaders?.captchaToken) headers['X-Captcha-Token'] = securityHeaders.captchaToken

  const res = await fetch(`${API_BASE}/signatures`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errors?.[0]?.message || 'Erreur création signature')
  }
  return res.json()
}
