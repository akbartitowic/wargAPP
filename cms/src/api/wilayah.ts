import { apiJson } from '@/api/client'

export type WilayahOption = {
  kode: string
  nama: string
  level: number
  parent_kode: string | null
  kodepos?: string | null
}

export type WilayahChain = {
  provinsi: WilayahOption | null
  kabupaten: WilayahOption | null
  kecamatan: WilayahOption | null
  kelurahan: WilayahOption | null
  kode_pos: string | null
}

export function searchWilayah(params: { parent?: string; q?: string; limit?: number }) {
  const qs = new URLSearchParams()
  if (params.parent) qs.set('parent', params.parent)
  if (params.q) qs.set('q', params.q)
  if (params.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return apiJson<WilayahOption[]>(`/admin/wilayah${query ? `?${query}` : ''}`)
}

export function getWilayahChain(kelurahanKode: string) {
  return apiJson<WilayahChain>(`/admin/wilayah/${encodeURIComponent(kelurahanKode)}/chain`)
}
