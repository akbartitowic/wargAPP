import type { AdminRole } from './roles.js'

export type ResidentTokenPayload = {
  sub: string
  type: 'resident'
  nik: string
  no_kk: string
}

export type AdminTokenPayload = {
  sub: string
  type: 'admin'
  role: AdminRole
  housing_complex_id?: string | null
}

export type ResidentContext = {
  id: string
  nik: string
  no_kk: string
  housing_complex_id: string
  housing_unit_id: string | null
  is_parent: boolean
  can_view_billing: boolean
  can_manage_umkm: boolean
}

declare global {
  namespace Express {
    interface Request {
      resident?: ResidentContext
      admin?: {
        id: string
        role: AdminRole
        email: string
        housing_complex_id: string | null
      }
    }
  }
}

export {}
