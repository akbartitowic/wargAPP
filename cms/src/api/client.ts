import { getCmsSession } from '@/lib/cmsSession'

const base = import.meta.env.VITE_API_BASE_URL ?? ''

export function getApiBaseUrl(): string {
  return base.replace(/\/$/, '')
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

type Envelope<T> = {
  status: 'success' | 'error'
  data?: T
  message?: string
  errors?: Record<string, string[] | string | undefined>
}

function formatApiError(body: Envelope<unknown>, status: number): string {
  if (body.errors && typeof body.errors === 'object') {
    const parts: string[] = []
    for (const [key, val] of Object.entries(body.errors)) {
      if (Array.isArray(val)) {
        parts.push(`${key}: ${val.join(', ')}`)
      } else if (val) {
        parts.push(`${key}: ${val}`)
      }
    }
    if (parts.length > 0) {
      return `${body.message ?? 'Validasi gagal'} — ${parts.join(' · ')}`
    }
  }
  return body.message ?? `Permintaan gagal (${status})`
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`
  const headers = new Headers(init?.headers)
  const token = getCmsSession().access_token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  return fetch(url, { ...init, headers })
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  const body = (await res.json()) as Envelope<T>
  if (!res.ok || body.status === 'error') {
    throw new ApiError(formatApiError(body, res.status), res.status)
  }
  return body.data as T
}
