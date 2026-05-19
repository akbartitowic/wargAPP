export type BillingStatus = 'unpaid' | 'pending' | 'paid'

export type ResidentRecord = {
  id: string
  nik: string
  no_kk: string
  housing_complex_id: string
  password_hash: string
  nama: string
  no_hp: string
  blok_rumah: string
  agama: string
  is_parent: boolean
  can_view_billing: boolean
  can_manage_umkm: boolean
  status: string
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
