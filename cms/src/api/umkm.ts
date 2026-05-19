import { apiFetch, apiJson, getApiBaseUrl } from '@/api/client'

export type UmkmShopStatus = 'pending' | 'approved' | 'rejected' | 'inactive'

export type UmkmShopRow = {
  id: string
  housing_complex_id: string
  housing_name: string
  owner_id: string | null
  owner_name: string | null
  name: string
  category: string
  tagline: string | null
  description: string | null
  image_url: string | null
  rating: number
  open_time: string
  close_time: string
  latitude: number
  longitude: number
  whatsapp: string | null
  status: UmkmShopStatus
  product_count: number
  active_product_count: number
  created_at: string
  updated_at: string
}

export type UmkmProductRow = {
  id: string
  shop_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export type ShopPayload = {
  housing_complex_id?: string
  owner_id?: string | null
  name: string
  category: string
  tagline?: string | null
  description?: string | null
  image_url?: string | null
  open_time: string
  close_time: string
  latitude: number
  longitude: number
  whatsapp?: string | null
  status?: UmkmShopStatus
  rating?: number
}

export type ProductPayload = {
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_active?: boolean
  sort_order?: number
}

export function listUmkmShops(params?: {
  housing_complex_id?: string
  status?: string
  category?: string
  q?: string
}) {
  const qs = new URLSearchParams()
  if (params?.housing_complex_id) qs.set('housing_complex_id', params.housing_complex_id)
  if (params?.status) qs.set('status', params.status)
  if (params?.category) qs.set('category', params.category)
  if (params?.q) qs.set('q', params.q)
  const suffix = qs.toString() ? `?${qs}` : ''
  return apiJson<UmkmShopRow[]>(`/admin/umkm/shops${suffix}`)
}

export function getUmkmShop(shopId: string) {
  return apiJson<UmkmShopRow>(`/admin/umkm/shops/${shopId}`)
}

export function createUmkmShop(body: ShopPayload) {
  return apiJson<UmkmShopRow>('/admin/umkm/shops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateUmkmShop(shopId: string, body: Partial<ShopPayload>) {
  return apiJson<UmkmShopRow>(`/admin/umkm/shops/${shopId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function setUmkmShopStatus(shopId: string, status: UmkmShopStatus) {
  return apiJson<UmkmShopRow>(`/admin/umkm/shops/${shopId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export function listUmkmProducts(shopId: string) {
  return apiJson<UmkmProductRow[]>(`/admin/umkm/shops/${shopId}/products`)
}

export function createUmkmProduct(shopId: string, body: ProductPayload) {
  return apiJson<UmkmProductRow>(`/admin/umkm/shops/${shopId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateUmkmProduct(shopId: string, productId: string, body: Partial<ProductPayload>) {
  return apiJson<UmkmProductRow>(`/admin/umkm/shops/${shopId}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteUmkmProduct(shopId: string, productId: string) {
  return apiJson<{ deleted: boolean }>(`/admin/umkm/shops/${shopId}/products/${productId}`, {
    method: 'DELETE',
  })
}

export async function uploadUmkmImage(
  file: File,
  variant: 'shop' | 'product',
): Promise<{ url: string }> {
  const form = new FormData()
  form.append('image', file)
  const res = await apiFetch(`/admin/umkm/upload-image?variant=${variant}`, {
    method: 'POST',
    body: form,
  })
  const body = (await res.json()) as { status: string; data?: { url: string }; message?: string }
  if (!res.ok || body.status === 'error') {
    throw new Error(body.message ?? 'Gagal mengunggah gambar')
  }
  const url = body.data?.url ?? ''
  if (url.startsWith('http')) return { url }
  return { url: `${getApiBaseUrl()}${url.startsWith('/') ? url : `/${url}`}` }
}

export type UmkmChangeRequestRow = {
  id: string
  shop_id: string
  shop_name: string
  housing_name: string
  owner_name: string | null
  request_type: string
  product_id: string | null
  payload: Record<string, unknown>
  status: string
  reject_note: string | null
  created_at: string
  summary: string
}

export function listUmkmChangeRequests(housing_complex_id?: string) {
  const qs = housing_complex_id
    ? `?housing_complex_id=${encodeURIComponent(housing_complex_id)}`
    : ''
  return apiJson<UmkmChangeRequestRow[]>(`/admin/umkm/change-requests${qs}`)
}

export function approveUmkmChangeRequest(requestId: string) {
  return apiJson<{ id: string; status: string }>(
    `/admin/umkm/change-requests/${requestId}/approve`,
    { method: 'POST' },
  )
}

export function rejectUmkmChangeRequest(requestId: string, reject_note?: string) {
  return apiJson<{ id: string; status: string }>(
    `/admin/umkm/change-requests/${requestId}/reject`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reject_note: reject_note ?? null }),
    },
  )
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (path.startsWith('http')) return path
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
