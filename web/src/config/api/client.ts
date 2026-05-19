/**
 * Client API — base URL dari env (staging / production).
 */
import { useAuthStore } from '@/store/authStore'

const base = import.meta.env.VITE_API_BASE_URL ?? ''

export function getApiBaseUrl(): string {
  return base.replace(/\/$/, '')
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0
}

export class ApiError extends Error {
  status: number
  errors?: unknown
  constructor(message: string, status: number, errors?: unknown) {
    super(message)
    this.status = status
    this.errors = errors
    this.name = 'ApiError'
  }
}

type ApiEnvelope<T> = {
  status: 'success' | 'error'
  data?: T
  message?: string
  errors?: unknown
}

export async function apiFetch(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`
  const headers = new Headers(init?.headers)
  const token = init?.accessToken ?? useAuthStore.getState().access_token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  const res = await fetch(url, { ...init, headers })
  return res
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<T> {
  const res = await apiFetch(path, init)
  let body: ApiEnvelope<T> | null = null
  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch {
    /* non-json */
  }

  if (!res.ok || body?.status === 'error') {
    const message = body?.message ?? res.statusText ?? 'Permintaan gagal'
    throw new ApiError(message, res.status, body?.errors)
  }

  if (body?.status === 'success' && body.data !== undefined) {
    return body.data
  }

  throw new ApiError('Format respons tidak valid', res.status)
}
