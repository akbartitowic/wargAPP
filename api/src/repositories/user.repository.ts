import { query } from '../config/database.js'
import type { ResidentContext, ResidentRecord } from '../models/user.model.js'

export const userRepository = {
  findByIdentifier(identifier: string) {
    return query<
      Pick<
        ResidentRecord,
        | 'id'
        | 'nik'
        | 'no_kk'
        | 'housing_complex_id'
        | 'password_hash'
        | 'is_parent'
        | 'can_view_billing'
        | 'can_manage_umkm'
      >
    >(
      `SELECT id, nik, no_kk, housing_complex_id::text, password_hash,
              is_parent, can_view_billing, can_manage_umkm
       FROM residents
       WHERE (nik = $1 OR no_hp = $1) AND status = 'active' AND deleted_at IS NULL
       LIMIT 1`,
      [identifier.replace(/\s/g, '')],
    )
  },

  findActiveById(id: string) {
    return query<ResidentContext>(
      `SELECT id, nik, no_kk, housing_complex_id::text, housing_unit_id::text,
              is_parent, can_view_billing, can_manage_umkm
       FROM residents WHERE id = $1 AND status = 'active' AND deleted_at IS NULL`,
      [id],
    )
  },

  findProfileById(id: string) {
    return query<{
      nik: string
      nama: string
      no_kk: string
      no_hp: string
      blok_rumah: string
      nama_jalan: string
      rt: string
      rw: string
      agama: string
      occupancy_type: string
      residence_start_date: Date
      residence_end_date: Date | null
      foto_profil_url: string | null
      is_parent: boolean
      can_view_billing: boolean
      can_manage_umkm: boolean
      housing_name: string
      kelurahan: string
      kecamatan: string
      kode_pos: string
    }>(
      `SELECT r.nik, r.nama, r.no_kk, r.no_hp, r.blok_rumah, r.nama_jalan, r.rt, r.rw,
              r.agama::text, r.occupancy_type::text,
              r.residence_start_date, r.residence_end_date,
              r.foto_profil_url,
              r.is_parent, r.can_view_billing, r.can_manage_umkm,
              h.name AS housing_name, h.kelurahan, h.kecamatan, h.kode_pos
       FROM residents r
       JOIN housing_complexes h ON h.id = r.housing_complex_id
       WHERE r.id = $1 AND r.status = 'active' AND r.deleted_at IS NULL`,
      [id],
    )
  },

  updateProfile(
    id: string,
    patch: { no_hp?: string; foto_profil_url?: string | null },
  ) {
    const sets: string[] = []
    const params: unknown[] = [id]
    let i = 2
    if (patch.no_hp) {
      sets.push(`no_hp = $${i++}`)
      params.push(patch.no_hp)
    }
    if (patch.foto_profil_url !== undefined) {
      sets.push(`foto_profil_url = $${i++}`)
      params.push(patch.foto_profil_url)
    }
    if (!sets.length) return Promise.resolve()
    sets.push('updated_at = NOW()')
    return query(`UPDATE residents SET ${sets.join(', ')} WHERE id = $1 AND status = 'active'`, params)
  },

  listForAdmin(housingComplexId: string | null, limit: number, offset: number) {
    const params: unknown[] = [limit, offset]
    let housingSql = ''
    if (housingComplexId) {
      housingSql = ' AND housing_complex_id = $3'
      params.push(housingComplexId)
    }
    return query<{
      id: string
      nik: string
      no_kk: string
      nama: string
      no_hp: string
      blok_rumah: string
      agama: string
      is_parent: boolean
      status: string
      housing_complex_id: string
      housing_name: string
      nama_jalan: string
      rt: string
      rw: string
      kelurahan: string
      kecamatan: string
      kode_pos: string
      occupancy_type: string
      residence_start_date: Date
      residence_end_date: Date | null
      housing_unit_id: string
      allows_multiple_kk: boolean
      owner_resident_id: string | null
      owner_name: string | null
      foto_profil_url: string | null
      created_at: Date
    }>(
      `SELECT r.id::text, r.nik, r.no_kk, r.nama, r.no_hp, r.blok_rumah, r.nama_jalan, r.rt, r.rw,
              r.agama::text, r.is_parent, r.status::text, r.housing_complex_id::text,
              r.housing_unit_id::text, u.allows_multiple_kk,
              r.occupancy_type::text, r.residence_start_date, r.residence_end_date,
              r.owner_resident_id::text, o.nama AS owner_name,
              r.foto_profil_url,
              h.name AS housing_name, h.kelurahan, h.kecamatan, h.kode_pos, r.created_at
       FROM residents r
       JOIN housing_complexes h ON h.id = r.housing_complex_id
       LEFT JOIN housing_units u ON u.id = r.housing_unit_id
       LEFT JOIN residents o ON o.id = r.owner_resident_id
       WHERE r.deleted_at IS NULL${housingSql.replace(/housing_complex_id/g, 'r.housing_complex_id')}
       ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      params,
    )
  },
}
