import { query } from '../config/database.js'
import { BadRequestError, NotFoundError, ValidationError } from '../utils/errors.js'
import { formatAlamatLengkap } from '../utils/address.js'

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
}

function normalizeAddress(parts: {
  nama_jalan: string
  blok_rumah: string
  rt: string
  rw: string
}) {
  return {
    nama_jalan: parts.nama_jalan.trim(),
    blok_rumah: parts.blok_rumah.trim(),
    rt: parts.rt.trim(),
    rw: parts.rw.trim(),
  }
}

export function formatUnitLabel(u: {
  nama_jalan: string
  blok_rumah: string
  rt: string
  rw: string
  kelurahan?: string
  kecamatan?: string
  kode_pos?: string
}) {
  return formatAlamatLengkap({
    nama_jalan: u.nama_jalan,
    blok_rumah: u.blok_rumah,
    rt: u.rt,
    rw: u.rw,
    kelurahan: u.kelurahan ?? '',
    kecamatan: u.kecamatan ?? '',
    kode_pos: u.kode_pos ?? '',
  })
}

export async function listHousingUnitsForAdmin(
  housingComplexId: string,
  search?: string,
) {
  const q = search?.trim().toLowerCase() ?? ''
  const params: unknown[] = [housingComplexId]
  let searchSql = ''
  if (q) {
    params.push(`%${q}%`)
    searchSql = ` AND (
      lower(u.blok_rumah) LIKE $2
      OR lower(u.nama_jalan) LIKE $2
      OR EXISTS (
        SELECT 1 FROM residents r2
        WHERE r2.housing_unit_id = u.id AND r2.deleted_at IS NULL
          AND lower(r2.nama) LIKE $2
      )
    )`
  }

  const { rows } = await query<{
    id: string
    housing_complex_id: string
    nama_jalan: string
    blok_rumah: string
    rt: string
    rw: string
    allows_multiple_kk: boolean
    kk_count: number
    wali_names: string | null
    kelurahan: string
    kecamatan: string
    kode_pos: string
  }>(
    `SELECT u.id::text, u.housing_complex_id::text,
            u.nama_jalan, u.blok_rumah, u.rt, u.rw, u.allows_multiple_kk,
            COUNT(DISTINCT r.no_kk) FILTER (WHERE r.deleted_at IS NULL)::int AS kk_count,
            (
              SELECT string_agg(x.nama, ', ' ORDER BY x.nama)
              FROM (
                SELECT DISTINCT r2.nama
                FROM residents r2
                WHERE r2.housing_unit_id = u.id
                  AND r2.is_parent
                  AND r2.status = 'active'
                  AND r2.deleted_at IS NULL
              ) x
            ) AS wali_names,
            h.kelurahan, h.kecamatan, h.kode_pos
     FROM housing_units u
     JOIN housing_complexes h ON h.id = u.housing_complex_id
     LEFT JOIN residents r ON r.housing_unit_id = u.id
     WHERE u.housing_complex_id = $1${searchSql}
     GROUP BY u.id, h.kelurahan, h.kecamatan, h.kode_pos
     ORDER BY u.blok_rumah, u.nama_jalan`,
    params,
  )

  return rows.map((u) => ({
    id: u.id,
    housing_complex_id: u.housing_complex_id,
    nama_jalan: u.nama_jalan,
    blok_rumah: u.blok_rumah,
    rt: u.rt,
    rw: u.rw,
    allows_multiple_kk: u.allows_multiple_kk,
    kk_count: u.kk_count,
    wali_names: u.wali_names ?? '—',
    alamat_lengkap: formatUnitLabel(u),
  }))
}

export async function getHousingUnitById(unitId: string) {
  const { rows } = await query<{
    id: string
    housing_complex_id: string
    nama_jalan: string
    blok_rumah: string
    rt: string
    rw: string
    allows_multiple_kk: boolean
  }>(
    `SELECT id::text, housing_complex_id::text, nama_jalan, blok_rumah, rt, rw, allows_multiple_kk
     FROM housing_units WHERE id = $1`,
    [unitId],
  )
  const u = rows[0]
  if (!u) throw new NotFoundError('Alamat tidak ditemukan')
  return u
}

export async function findOrCreateHousingUnit(
  housingComplexId: string,
  address: { nama_jalan: string; blok_rumah: string; rt: string; rw: string },
  allowsMultipleKk: boolean,
) {
  const a = normalizeAddress(address)
  const { rows: existing } = await query<{ id: string; allows_multiple_kk: boolean }>(
    `SELECT id::text, allows_multiple_kk FROM housing_units
     WHERE housing_complex_id = $1
       AND lower(trim(nama_jalan)) = lower($2)
       AND lower(trim(blok_rumah)) = lower($3)
       AND rt = $4 AND rw = $5`,
    [housingComplexId, a.nama_jalan, a.blok_rumah, a.rt, a.rw],
  )
  if (existing[0]) {
    if (allowsMultipleKk && !existing[0].allows_multiple_kk) {
      await query(
        `UPDATE housing_units SET allows_multiple_kk = TRUE, updated_at = NOW() WHERE id = $1`,
        [existing[0].id],
      )
    }
    return existing[0].id
  }

  const { rows } = await query<{ id: string }>(
    `INSERT INTO housing_units (
       housing_complex_id, nama_jalan, blok_rumah, rt, rw, allows_multiple_kk
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id::text`,
    [housingComplexId, a.nama_jalan, a.blok_rumah, a.rt, a.rw, allowsMultipleKk],
  )
  const id = rows[0]?.id
  if (!id) throw new BadRequestError('Gagal membuat alamat')
  return id
}

export async function assertCanRegisterKkAtUnit(
  housingUnitId: string,
  noKk: string,
) {
  const unit = await getHousingUnitById(housingUnitId)
  const { rows: kks } = await query<{ no_kk: string }>(
    `SELECT DISTINCT no_kk FROM residents
     WHERE housing_unit_id = $1 AND deleted_at IS NULL`,
    [housingUnitId],
  )
  const distinct = kks.map((k) => k.no_kk)
  if (distinct.includes(noKk)) return unit
  if (distinct.length >= 1 && !unit.allows_multiple_kk) {
    throw new ValidationError(
      'Alamat ini hanya untuk 1 KK. Centang "Alamat dapat lebih dari 1 KK" saat membuat alamat, atau tambahkan anggota ke KK yang sudah ada.',
    )
  }
  return unit
}

export async function listKkAtUnit(housingUnitId: string) {
  const { rows } = await query<{
    no_kk: string
    wali_name: string | null
    member_count: number
  }>(
    `SELECT r.no_kk,
            MAX(r.nama) FILTER (WHERE r.is_parent) AS wali_name,
            COUNT(*)::int AS member_count
     FROM residents r
     WHERE r.housing_unit_id = $1 AND r.deleted_at IS NULL
     GROUP BY r.no_kk
     ORDER BY wali_name NULLS LAST, r.no_kk`,
    [housingUnitId],
  )
  return rows.map((r) => ({
    no_kk: r.no_kk,
    wali_name: r.wali_name ?? 'Belum ada wali',
    member_count: r.member_count,
  }))
}
