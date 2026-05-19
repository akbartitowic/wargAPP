export type AdminRole = 'super_admin' | 'housing_admin' | 'finance_admin' | 'content_admin'

export const ADMIN_ROLES: AdminRole[] = [
  'super_admin',
  'housing_admin',
  'finance_admin',
  'content_admin',
]

/** Peran dengan akses penuh satu perumahan (legacy finance/content diperlakukan sama). */
export const HOUSING_SCOPED_ADMIN_ROLES: AdminRole[] = [
  'housing_admin',
  'finance_admin',
  'content_admin',
]
