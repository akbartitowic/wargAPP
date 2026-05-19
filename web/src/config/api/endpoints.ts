import { apiJson, apiFetch } from '@/config/api/client'
import { normalizeQuickMenuOrder } from '@/lib/quickMenu'
import type { BillingStatus, QuickMenuKey, Religion } from '@/store/sessionStore'

export type LoginResponse = {
  access_token: string
  token_type: string
  expires_in: string
}

export type ProfileResponse = {
  nik: string
  nama: string
  no_kk: string
  no_hp: string
  blok_rumah: string
  agama: Religion
  housing_name: string
  alamat_lengkap: string
  occupancy_type: 'pemilik' | 'kontrak'
  residence_start_date: string
  residence_end_date: string | null
  foto_profil_url: string | null
  access_control: {
    is_parent: boolean
    can_view_billing: boolean
    can_manage_umkm: boolean
  }
}

export type HomeConfigResponse = {
  server_time_iso: string
  quick_menu: { key: string; label: string; icon: string; route: string }[]
}

export type BillingCurrentResponse = {
  period: { label: string; year: number; month: number; due_date: string }
  billing_id?: string
  status: BillingStatus
  total_amount: number
  line_items: { name: string; amount: number }[]
  message?: string
}

export type BillingHistoryItem = {
  billing_id: string
  label: string
  year: number
  month: number
  total_amount: number
  status: BillingStatus
}

export type ApiNewsCategory = {
  key: string
  label: string
  sort_order: number
}

export type ApiNewsItem = {
  slug: string
  title: string
  excerpt: string
  image_url: string | null
  category: string
  category_key: string
  is_priority: boolean
  published_at: string
  author_name: string | null
  author_role: string | null
}

export type ApiNewsDetail = ApiNewsItem & {
  body_html: string
}

export type ApiUmkmShop = {
  id: string
  name: string
  category: string
  tagline: string | null
  description: string | null
  image_url: string | null
  rating: number
  open_time: string
  close_time: string
  is_open: boolean
  open_status_label: string
  latitude: number
  longitude: number
  whatsapp: string | null
  distance_km: number | null
}

export type ApiUmkmProduct = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

export function login(identifier: string, password: string) {
  return apiJson<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
}

export function fetchProfile() {
  return apiJson<ProfileResponse>('/profile')
}

export type FamilyMemberRow = {
  id: string
  nama: string
  is_parent: boolean
  role_label: string
  blok_rumah: string
  agama: string
  foto_profil_url: string | null
  is_self: boolean
}

export type SupportInfoResponse = {
  housing_name: string
  housing_address: string | null
  wilayah: string
  channels: {
    key: string
    label: string
    description: string
    route: string
  }[]
  faq: { q: string; a: string }[]
}

export function fetchFamilyMembers() {
  return apiJson<FamilyMemberRow[]>('/profile/family')
}

export function fetchSupportInfo() {
  return apiJson<SupportInfoResponse>('/profile/support')
}

export function updateProfile(body: { no_hp?: string }) {
  return apiJson<ProfileResponse>('/profile/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function uploadProfilePhoto(file: File) {
  const form = new FormData()
  form.append('photo', file)
  return apiJson<ProfileResponse>('/profile/upload-photo', {
    method: 'POST',
    body: form,
  })
}

export function fetchHomeConfig() {
  return apiJson<HomeConfigResponse>('/home/config')
}

export function fetchBillingCurrent() {
  return apiJson<BillingCurrentResponse>('/billing/current')
}

export function fetchBillingHistory() {
  return apiJson<BillingHistoryItem[]>('/billing/history')
}

export async function uploadPaymentProof(billingId: string, file: File) {
  const form = new FormData()
  form.append('billing_id', billingId)
  form.append('proof', file)
  const res = await apiFetch('/billing/upload-proof', { method: 'POST', body: form })
  const body = await res.json()
  if (!res.ok || body.status === 'error') {
    throw new Error(body.message ?? 'Upload gagal')
  }
  return body.data as { proof_id: string; status: string }
}

export function fetchNewsCategories() {
  return apiJson<ApiNewsCategory[]>('/news/categories')
}

export function fetchNewsList() {
  return apiJson<ApiNewsItem[]>('/news')
}

export function fetchNewsDetail(slug: string) {
  return apiJson<ApiNewsDetail>(`/news/${encodeURIComponent(slug)}`)
}

export function fetchUmkmShops(params?: { category?: string; lat?: number; lng?: number }) {
  const q = new URLSearchParams()
  if (params?.category) q.set('category', params.category)
  if (params?.lat != null) q.set('lat', String(params.lat))
  if (params?.lng != null) q.set('lng', String(params.lng))
  const qs = q.toString()
  return apiJson<ApiUmkmShop[]>(`/umkm/shops${qs ? `?${qs}` : ''}`)
}

export function fetchUmkmProducts(shopId: string) {
  return apiJson<ApiUmkmProduct[]>(`/umkm/shops/${shopId}/products`)
}

export type PartnerShopResponse = {
  id: string
  name: string
  category: string
  tagline: string | null
  description: string | null
  image_url: string | null
  open_time: string
  close_time: string
  whatsapp: string | null
  status: 'pending' | 'approved' | 'rejected' | 'inactive'
  status_label: string
  created_at: string
}

export function fetchMyPartnerShop() {
  return apiJson<PartnerShopResponse | null>('/umkm/partner/my-shop')
}

export function applyPartnerShop(body: {
  name: string
  category: string
  tagline?: string | null
  description?: string | null
  image_url?: string | null
  open_time: string
  close_time: string
  latitude?: number
  longitude?: number
  whatsapp?: string | null
}) {
  return apiJson<PartnerShopResponse>('/umkm/partner/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function uploadPartnerShopImage(file: File, variant: 'shop' | 'product' = 'shop') {
  const form = new FormData()
  form.append('image', file)
  const res = await apiFetch(`/umkm/partner/upload-image?variant=${variant}`, {
    method: 'POST',
    body: form,
  })
  const body = await res.json()
  if (!res.ok || body.status === 'error') {
    throw new Error(body.message ?? 'Gagal mengunggah foto')
  }
  return body.data as { url: string }
}

export type PartnerManageProduct = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  sort_order: number
  has_pending_change: boolean
}

export type PartnerChangeRequest = {
  id: string
  request_type: string
  product_id: string | null
  payload: Record<string, unknown>
  status: string
  reject_note: string | null
  created_at: string
  summary: string
}

export type PartnerManageDashboard = {
  shop: PartnerShopResponse & {
    is_manual_closed: boolean
    is_open: boolean
    open_status_label: string
  }
  products: PartnerManageProduct[]
  pending_requests: PartnerChangeRequest[]
}

export function fetchPartnerManageDashboard() {
  return apiJson<PartnerManageDashboard>('/umkm/partner/manage')
}

export function setPartnerOpenStatus(is_manual_closed: boolean) {
  return apiJson<{ is_manual_closed: boolean }>('/umkm/partner/manage/open-status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_manual_closed }),
  })
}

export function submitPartnerShopUpdate(body: {
  name: string
  category: string
  tagline?: string | null
  description?: string | null
  image_url?: string | null
  open_time: string
  close_time: string
  whatsapp?: string | null
}) {
  return apiJson<{ request_id: string; message: string }>('/umkm/partner/manage/shop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function submitPartnerProductCreate(body: {
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  sort_order?: number
}) {
  return apiJson<{ request_id: string; message: string }>('/umkm/partner/manage/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function submitPartnerProductUpdate(
  productId: string,
  body: {
    name?: string
    description?: string | null
    price?: number
    image_url?: string | null
    is_active?: boolean
    sort_order?: number
  },
) {
  return apiJson<{ request_id: string; message: string }>(
    `/umkm/partner/manage/products/${productId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export function submitPartnerProductDelete(productId: string) {
  return apiJson<{ request_id: string; message: string }>(
    `/umkm/partner/manage/products/${productId}`,
    { method: 'DELETE' },
  )
}

export type ApiFacility = {
  id: string
  name: string
  facility_type: string
  description: string | null
  image_url: string | null
  address: string | null
  latitude: number
  longitude: number
  open_time: string | null
  close_time: string | null
  is_open: boolean
  open_status_label: string
  maps_url: string
  directions_url: string
}

export function fetchFacilities() {
  return apiJson<ApiFacility[]>('/facilities')
}

export function fetchFacilityById(id: string) {
  return apiJson<ApiFacility>(`/facilities/${id}`)
}

export function fetchWorshipSchedule(type?: string) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : ''
  return apiJson<
    {
      id: string
      type: string
      label: string
      time: string
      day_of_week: number | null
      place_name: string
      address: string | null
      latitude: number
      longitude: number
    }[]
  >(`/religious/schedule${qs}`)
}

export function fetchWorshipPlaces() {
  return apiJson<
    {
      id: string
      name: string
      type: string
      address: string | null
      latitude: number
      longitude: number
      maps_url: string
    }[]
  >('/religious/places')
}

export function mapQuickMenuKeys(
  items: HomeConfigResponse['quick_menu'],
): QuickMenuKey[] {
  return normalizeQuickMenuOrder(items.map((i) => i.key))
}
