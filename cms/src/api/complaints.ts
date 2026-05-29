import { apiJson } from '@/api/client'

export type ComplaintCategoryRow = {
  id: string
  housing_complex_id: string
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

export type ComplaintListRow = {
  id: string
  category_label: string
  resident_name: string
  description: string
  status: string
  status_label: string
  created_at: string
  updated_at: string
  progress: { percent: number; is_rejected: boolean; is_complete: boolean }
}

export type ComplaintDetail = ComplaintListRow & {
  category_key: string
  admin_note: string | null
  resident_phone: string
  description: string
  progress_steps: { status: string; label: string; status_label: string }[]
  attachments: { id: string; mime_type: string; file_url: string }[]
  status_history: {
    status: string
    status_label: string
    note: string | null
    created_at: string
  }[]
}

export function listComplaintCategories(housingId?: string, includeInactive = true) {
  const qs = new URLSearchParams()
  if (housingId) qs.set('housing_complex_id', housingId)
  if (includeInactive) qs.set('include_inactive', '1')
  const q = qs.toString()
  return apiJson<ComplaintCategoryRow[]>(
    `/admin/complaint-categories${q ? `?${q}` : ''}`,
  )
}

export function createComplaintCategory(body: {
  key: string
  label: string
  sort_order?: number
  housing_complex_id?: string
}) {
  return apiJson<ComplaintCategoryRow>('/admin/complaint-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateComplaintCategory(
  id: string,
  body: { label?: string; sort_order?: number; is_active?: boolean },
) {
  return apiJson<ComplaintCategoryRow>(`/admin/complaint-categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function listComplaints(opts?: { housingId?: string; status?: string }) {
  const qs = new URLSearchParams()
  if (opts?.housingId) qs.set('housing_complex_id', opts.housingId)
  if (opts?.status) qs.set('status', opts.status)
  const q = qs.toString()
  return apiJson<ComplaintListRow[]>(`/admin/complaints${q ? `?${q}` : ''}`)
}

export function getComplaint(id: string) {
  return apiJson<ComplaintDetail>(`/admin/complaints/${id}`)
}

export function updateComplaintStatus(
  id: string,
  body: { status: 'in_review' | 'in_progress' | 'closed' | 'rejected'; note?: string },
) {
  return apiJson<ComplaintDetail>(`/admin/complaints/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
