import type { AdminRole } from '@/api/admin'

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  housing_admin: 'Admin perumahan',
  finance_admin: 'Admin keuangan',
  content_admin: 'Admin konten',
}

export const ADMIN_ROLE_OPTIONS: { value: AdminRole; label: string }[] = (
  Object.entries(ADMIN_ROLE_LABELS) as [AdminRole, string][]
).map(([value, label]) => ({ value, label }))
