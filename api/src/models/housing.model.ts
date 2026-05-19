export type HousingComplex = {
  id: string
  slug: string
  name: string
  address: string | null
  kecamatan: string
  kelurahan: string
  kode_pos: string
  kelurahan_kode: string | null
  status: 'active' | 'inactive'
}
