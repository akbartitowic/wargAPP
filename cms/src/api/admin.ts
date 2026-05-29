import { apiFetch, apiJson } from '@/api/client'

export type HousingWilayah = {
  kecamatan: string
  kelurahan: string
  kode_pos: string
}

export type HousingComplex = HousingWilayah & {
  id: string
  slug: string
  name: string
  address: string | null
  kelurahan_kode: string | null
  status?: 'active' | 'inactive'
}

export type HousingComplexRow = HousingComplex & {
  status: 'active' | 'inactive'
  resident_count: number
  admin_email: string | null
  created_at: string
}

export type AdminRole =
  | 'super_admin'
  | 'housing_admin'
  | 'finance_admin'
  | 'content_admin'

export type AdminAccountRow = {
  id: string
  email: string
  full_name: string
  role: AdminRole
  status: 'active' | 'inactive'
  housing_complex_id: string | null
  housing_name: string | null
  last_login_at: string | null
  created_at: string
}

export function listAdminAccounts() {
  return apiJson<AdminAccountRow[]>('/admin/admins')
}

export function getAdminAccount(id: string) {
  return apiJson<AdminAccountRow>(`/admin/admins/${id}`)
}

export function createAdminAccount(body: {
  email: string
  password: string
  full_name: string
  role: AdminRole
  housing_complex_id?: string | null
}) {
  return apiJson<AdminAccountRow>('/admin/admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateAdminAccount(
  id: string,
  body: Partial<{
    full_name: string
    role: AdminRole
    housing_complex_id: string | null
    status: 'active' | 'inactive'
    password: string
  }>,
) {
  return apiJson<AdminAccountRow>(`/admin/admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export type AdminProfile = {
  id: string
  email: string
  full_name: string
  role: string
  housing_complex_id: string | null
  housing_name: string | null
  housing_kecamatan: string | null
  housing_kelurahan: string | null
  housing_kode_pos: string | null
  is_super_admin: boolean
}

export function getAdminMe() {
  return apiJson<AdminProfile>('/admin/me')
}

export function changeAdminPassword(currentPassword: string, newPassword: string) {
  return apiJson<{ message: string }>('/admin/me/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })
}

export function adminLogin(email: string, password: string) {
  return apiJson<{
    access_token: string
    role: string
    housing_complex_id: string | null
    housing_name: string | null
    is_super_admin: boolean
  }>('/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

/** Daftar perumahan aktif (dropdown super admin). */
export function listHousingComplexes() {
  return apiJson<HousingComplexRow[]>('/admin/housing-complexes')
}

export function listHousingComplexesManage(includeInactive = false) {
  const qs = includeInactive ? '?include_inactive=1' : ''
  return apiJson<HousingComplexRow[]>(`/admin/housing-complexes${qs}`)
}

export function getHousingComplex(id: string) {
  return apiJson<HousingComplexRow>(`/admin/housing-complexes/${id}`)
}

export function createHousingComplex(body: {
  name: string
  slug?: string
  address?: string | null
  kelurahan_kode: string
}) {
  return apiJson<HousingComplexRow>('/admin/housing-complexes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateHousingComplex(
  id: string,
  body: Partial<{
    name: string
    slug: string
    address: string | null
    kelurahan_kode: string
    status: 'active' | 'inactive'
  }>,
) {
  return apiJson<HousingComplexRow>(`/admin/housing-complexes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deactivateHousingComplex(id: string) {
  return apiJson<HousingComplexRow>(`/admin/housing-complexes/${id}`, {
    method: 'DELETE',
  })
}

export type ResidentRow = {
  id: string
  no_kk: string
  nama: string
  nik_masked: string
  no_kk_masked: string
  no_hp: string
  foto_profil_url: string | null
  blok_rumah: string
  agama: string
  is_parent: boolean
  status: string
  housing_name: string
  housing_complex_id?: string
  nama_jalan: string
  rt: string
  rw: string
  kecamatan: string
  kelurahan: string
  kode_pos: string
  alamat_lengkap: string
  occupancy_type: 'pemilik' | 'kontrak'
  residence_start_date: string
  residence_end_date: string | null
  owner_resident_id: string | null
  owner_name: string | null
  housing_unit_id: string | null
  allows_multiple_kk: boolean
}

export type ResidentDetail = ResidentRow & {
  housing_complex_id: string
  can_login?: boolean
}

export function listResidents(housingComplexId?: string) {
  const qs = housingComplexId ? `?housing_complex_id=${encodeURIComponent(housingComplexId)}` : ''
  return apiJson<ResidentRow[]>(`/admin/users${qs}`)
}

export type CreateResidentBody = {
  housing_complex_id?: string
  nik: string
  no_kk: string
  nama: string
  no_hp: string
  nama_jalan: string
  blok_rumah: string
  rt: string
  rw: string
  agama: string
  password: string
  is_parent: boolean
  occupancy_type?: 'pemilik' | 'kontrak'
  residence_start_date?: string
  residence_end_date?: string | null
  owner_resident_id?: string | null
  housing_unit_id?: string
  allows_multiple_kk?: boolean
}

export type HousingUnitRow = {
  id: string
  housing_complex_id: string
  nama_jalan: string
  blok_rumah: string
  rt: string
  rw: string
  allows_multiple_kk: boolean
  kk_count: number
  wali_names: string
  alamat_lengkap: string
}

export type UnitKkRow = {
  no_kk: string
  wali_name: string
  member_count: number
}

export function listHousingUnits(housingComplexId: string, q?: string) {
  const params = new URLSearchParams({ housing_complex_id: housingComplexId })
  if (q?.trim()) params.set('q', q.trim())
  return apiJson<HousingUnitRow[]>(`/admin/housing-units?${params}`)
}

export function listUnitKk(unitId: string) {
  return apiJson<UnitKkRow[]>(`/admin/housing-units/${unitId}/kk`)
}

export function getResident(id: string) {
  return apiJson<ResidentDetail>(`/admin/users/${id}`)
}

export function createResident(body: CreateResidentBody) {
  return apiJson<{ id: string }>('/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateResident(
  id: string,
  body: Partial<{
    nama: string
    no_hp: string
    nama_jalan: string
    blok_rumah: string
    rt: string
    rw: string
    agama: string
    is_parent: boolean
    status: 'active' | 'inactive'
    password: string
    occupancy_type: 'pemilik' | 'kontrak'
    residence_start_date: string
    residence_end_date: string | null
  owner_resident_id: string | null
  housing_unit_id: string | null
  allows_multiple_kk: boolean
}>,
) {
  return apiJson<ResidentDetail>(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function resetResidentPassword(id: string, password: string) {
  return apiJson<ResidentDetail>(`/admin/users/${id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export function setResidentAccountStatus(id: string, status: 'active' | 'inactive') {
  return apiJson<ResidentDetail>(`/admin/users/${id}/account-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export function deactivateResident(id: string) {
  return apiJson<{ id: string; status: string }>(`/admin/users/${id}`, {
    method: 'DELETE',
  })
}

export type PendingPaymentProof = {
  proof_id: string
  billing_id: string
  resident_name: string
  no_kk?: string
  amount: number
  file_path?: string
  file_url: string
  mime_type: string
  submitted_at: string
}

export function listPendingProofs() {
  return apiJson<PendingPaymentProof[]>('/admin/billing/approval')
}

export function approveProof(proofId: string) {
  return apiJson<{ billing_id: string; status: string }>(
    `/admin/billing/approve/${proofId}`,
    { method: 'PUT' },
  )
}

export type BillingLineItem = { item_name: string; amount: number }

export type BillingDashboard = {
  housing_complex_id: string
  year: number
  month: number
  period: {
    period_id: string | null
    label: string
    due_date: string | null
    line_template: BillingLineItem[]
    total_kk: number
    billable_kk: number
    paid_kk: number
    unpaid_kk: number
    pending_kk: number
    collected_amount: number
    outstanding_amount: number
    expected_amount: number
  }
  income_by_month: { month: number; label: string; collected: number; bill_count: number }[]
  expense_by_month: { month: number; total: number }[]
  expenses_current_month: {
    id: string
    title: string
    amount: number
    category: string
    notes: string | null
    spent_at: string
  }[]
  expenses_current_month_total: number
}

export type UnpaidBillingRow = {
  billing_id: string
  no_kk: string
  blok_rumah: string
  resident_name: string
  total_amount: number
  status: string
}

export function fetchBillingDashboard(params: {
  housing_complex_id?: string
  year?: number
  month?: number
}) {
  const q = new URLSearchParams()
  if (params.housing_complex_id) q.set('housing_complex_id', params.housing_complex_id)
  if (params.year) q.set('year', String(params.year))
  if (params.month) q.set('month', String(params.month))
  const qs = q.toString()
  return apiJson<BillingDashboard>(`/admin/billing/dashboard${qs ? `?${qs}` : ''}`)
}

export function fetchUnpaidBillings(periodId: string) {
  return apiJson<UnpaidBillingRow[]>(
    `/admin/billing/unpaid?period_id=${encodeURIComponent(periodId)}`,
  )
}

export function generateBills(body: {
  year: number
  month: number
  housing_complex_id?: string
  due_date?: string
  line_items: BillingLineItem[]
}) {
  return apiJson<{
    period_id: string
    bills_created: number
    bills_updated: number
    bills_skipped: number
    billable_kk: number
    total_per_kk: number
    line_items: BillingLineItem[]
  }>('/admin/billing/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function createIplExpense(body: {
  housing_complex_id?: string
  period_year: number
  period_month: number
  title: string
  amount: number
  category?: string
  notes?: string
  spent_at?: string
}) {
  return apiJson<{ id: string }>('/admin/billing/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteIplExpense(id: string) {
  return apiJson<{ id: string }>(`/admin/billing/expenses/${id}`, { method: 'DELETE' })
}

export async function uploadNewsHero(file: File) {
  const form = new FormData()
  form.append('image', file)
  const res = await apiFetch('/admin/news/upload-hero', { method: 'POST', body: form })
  const body = await res.json()
  if (!res.ok || body.status === 'error') {
    throw new Error(body.message ?? 'Upload gagal')
  }
  return body.data as { url: string }
}

export type NewsCategoryRow = {
  id: string
  housing_complex_id: string
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

export type NewsArticleRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  category_key: string
  category_id: string | null
  is_priority: boolean
  status: string
  published_at: string | null
  housing_name: string
  created_at: string
}

export type NewsArticleDetail = NewsArticleRow & {
  housing_complex_id: string
  body_html: string
  image_url: string | null
}

export function listNewsCategories(housingComplexId?: string, includeInactive = false) {
  const q = new URLSearchParams()
  if (housingComplexId) q.set('housing_complex_id', housingComplexId)
  if (includeInactive) q.set('include_inactive', '1')
  const qs = q.toString()
  return apiJson<NewsCategoryRow[]>(`/admin/news-categories${qs ? `?${qs}` : ''}`)
}

export function createNewsCategory(body: {
  housing_complex_id?: string
  key: string
  label: string
  sort_order?: number
}) {
  return apiJson<NewsCategoryRow>('/admin/news-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateNewsCategory(
  id: string,
  body: Partial<{ label: string; sort_order: number; is_active: boolean }>,
) {
  return apiJson<NewsCategoryRow>(`/admin/news-categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function listNewsArticles(housingComplexId?: string) {
  const qs = housingComplexId ? `?housing_complex_id=${encodeURIComponent(housingComplexId)}` : ''
  return apiJson<NewsArticleRow[]>(`/admin/news${qs}`)
}

export function getNewsArticle(id: string) {
  return apiJson<NewsArticleDetail>(`/admin/news/${id}`)
}

export function publishNews(body: {
  housing_complex_id?: string
  title: string
  slug: string
  excerpt: string
  body_html: string
  category_id: string
  is_priority: boolean
  image_url?: string
  author_name?: string
  author_role?: string
}) {
  return apiJson<{ id: string; slug: string }>('/admin/news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateNewsArticle(
  id: string,
  body: Partial<{
    title: string
    slug: string
    excerpt: string
    body_html: string
    category_id: string
    is_priority: boolean
    image_url: string | null
    status: 'draft' | 'published' | 'archived'
  }>,
) {
  return apiJson<NewsArticleDetail>(`/admin/news/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function listAuditLogs() {
  return apiJson<
    {
      id: string
      action: string
      actor_type: string
      actor_id: string
      entity_type: string | null
      created_at: string
    }[]
  >('/admin/audit-logs')
}
