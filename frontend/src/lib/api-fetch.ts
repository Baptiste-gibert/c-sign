export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    throw new ApiError(`${res.status} ${res.statusText}`, res.status)
  }
  return res
}
