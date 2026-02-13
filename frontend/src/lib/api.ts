const API_BASE = '/api'

export async function fetchAttendanceDay(dayId: string) {
  const res = await fetch(`${API_BASE}/attendance-days/${dayId}?depth=1`)
  if (!res.ok) throw new Error('Journée introuvable')
  return res.json()
}

export async function fetchSessionsByDay(dayId: string) {
  const res = await fetch(`${API_BASE}/sessions?where[attendanceDay][equals]=${dayId}&depth=0`)
  if (!res.ok) throw new Error('Erreur chargement sessions')
  return res.json()
}

export async function createParticipant(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errors?.[0]?.message || 'Erreur création participant')
  }
  return res.json()
}

export async function uploadSignatureImage(blob: Blob) {
  const formData = new FormData()
  formData.append('file', blob, `signature-${Date.now()}.png`)
  const res = await fetch(`${API_BASE}/media`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Erreur upload signature')
  return res.json()
}

export async function createSignature(data: {
  participant: string
  session: string
  image: string
  rightToImage: boolean
}) {
  const res = await fetch(`${API_BASE}/signatures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errors?.[0]?.message || 'Erreur création signature')
  }
  return res.json()
}
