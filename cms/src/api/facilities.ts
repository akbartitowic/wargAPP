import { apiFetch, apiJson, getApiBaseUrl } from '@/api/client'

export type FacilityRow = {
  id: string
  housing_complex_id: string
  housing_name: string
  name: string
  facility_type: string
  description: string | null
  image_url: string | null
  address: string | null
  latitude: number
  longitude: number
  open_time: string | null
  close_time: string | null
  is_active: boolean
  sort_order: number
  updated_at: string
}

export type FacilityPayload = {
  housing_complex_id?: string
  name: string
  facility_type: string
  description?: string | null
  image_url?: string | null
  address?: string | null
  latitude: number
  longitude: number
  open_time?: string | null
  close_time?: string | null
  is_active?: boolean
  sort_order?: number
}

export const FACILITY_TYPES = [
  'Masjid',
  'Mushola',
  'Kantor RT',
  'Pos keamanan',
  'Taman',
  'Lapangan',
  'Kolam renang',
  'Fasilitas olahraga',
  'Lainnya',
] as const

export function listFacilities(params?: { housing_complex_id?: string; q?: string }) {
  const qs = new URLSearchParams()
  if (params?.housing_complex_id) qs.set('housing_complex_id', params.housing_complex_id)
  if (params?.q) qs.set('q', params.q)
  const suffix = qs.toString() ? `?${qs}` : ''
  return apiJson<FacilityRow[]>(`/admin/facilities${suffix}`)
}

export function getFacility(id: string) {
  return apiJson<FacilityRow>(`/admin/facilities/${id}`)
}

export function createFacility(body: FacilityPayload) {
  return apiJson<FacilityRow>('/admin/facilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateFacility(id: string, body: Partial<FacilityPayload>) {
  return apiJson<FacilityRow>(`/admin/facilities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteFacility(id: string) {
  return apiJson<{ deleted: boolean }>(`/admin/facilities/${id}`, { method: 'DELETE' })
}

export async function uploadFacilityImage(file: File) {
  const form = new FormData()
  form.append('image', file)
  const res = await apiFetch('/admin/facilities/upload-image', { method: 'POST', body: form })
  const body = (await res.json()) as { status: string; data?: { url: string }; message?: string }
  if (!res.ok || body.status === 'error') {
    throw new Error(body.message ?? 'Gagal mengunggah gambar')
  }
  const url = body.data?.url ?? ''
  if (url.startsWith('http')) return { url }
  return { url: `${getApiBaseUrl()}${url.startsWith('/') ? url : `/${url}`}` }
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (path.startsWith('http')) return path
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
