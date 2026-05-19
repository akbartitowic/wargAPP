import { query } from '../config/database.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import {
  assertHousingExists,
  resolveHousingComplexId,
  resolveHousingFilter,
} from '../utils/tenant.js'

export const FACILITY_TYPES = [
  'Masjid',
  'Mushola',
  'Kantor RT',
  'Pos keamanan',
  'Taman',
  'Lapangan',
  'Kolam renang',
  'Fasilitas olahraga',
  'Lainnya',
] as const

export function assertFacilityType(t: string) {
  if (!FACILITY_TYPES.includes(t as (typeof FACILITY_TYPES)[number])) {
    throw new ValidationError(`Jenis fasilitas harus: ${FACILITY_TYPES.join(', ')}`)
  }
}

export async function listFacilitiesForAdmin(
  admin: AdminTenantContext,
  housingFilter?: string | null,
  q?: string,
) {
  const housingId = resolveHousingFilter(admin, housingFilter)
  const params: unknown[] = []
  let where = 'WHERE 1=1'
  if (housingId) {
    params.push(housingId)
    where += ` AND f.housing_complex_id = $${params.length}`
  }
  if (q?.trim()) {
    params.push(`%${q.trim()}%`)
    where += ` AND (f.name ILIKE $${params.length} OR f.facility_type ILIKE $${params.length})`
  }

  const { rows } = await query<{
    id: string
    housing_complex_id: string
    housing_name: string
    name: string
    facility_type: string
    description: string | null
    image_url: string | null
    address: string | null
    latitude: number
    longitude: number
    open_time: string | null
    close_time: string | null
    is_active: boolean
    sort_order: number
    updated_at: Date
  }>(
    `SELECT f.id::text, f.housing_complex_id::text, h.name AS housing_name,
            f.name, f.facility_type, f.description, f.image_url, f.address,
            f.latitude, f.longitude,
            to_char(f.open_time, 'HH24:MI') AS open_time,
            to_char(f.close_time, 'HH24:MI') AS close_time,
            f.is_active, f.sort_order, f.updated_at
     FROM public_facilities f
     JOIN housing_complexes h ON h.id = f.housing_complex_id
     ${where}
     ORDER BY f.sort_order, f.name`,
    params,
  )

  return rows.map((r) => ({
    id: r.id,
    housing_complex_id: r.housing_complex_id,
    housing_name: r.housing_name,
    name: r.name,
    facility_type: r.facility_type,
    description: r.description,
    image_url: r.image_url,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    open_time: r.open_time,
    close_time: r.close_time,
    is_active: r.is_active,
    sort_order: r.sort_order,
    updated_at: r.updated_at.toISOString(),
  }))
}

export async function getFacilityForAdmin(admin: AdminTenantContext, id: string) {
  const rows = await listFacilitiesForAdmin(admin, null)
  const row = rows.find((r) => r.id === id)
  if (!row) throw new NotFoundError('Fasilitas tidak ditemukan')
  if (admin.role !== 'super_admin' && admin.housing_complex_id !== row.housing_complex_id) {
    throw new ForbiddenError('Tidak dapat mengelola fasilitas perumahan lain')
  }
  return row
}

export async function createFacility(
  admin: AdminTenantContext,
  input: {
    housing_complex_id?: string
    name: string
    facility_type: string
    description?: string | null
    image_url?: string | null
    address?: string | null
    latitude: number
    longitude: number
    open_time?: string | null
    close_time?: string | null
    is_active?: boolean
    sort_order?: number
  },
) {
  assertFacilityType(input.facility_type)
  const housingId = resolveHousingComplexId(admin, input.housing_complex_id)
  await assertHousingExists(housingId)

  const { rows } = await query<{ id: string }>(
    `INSERT INTO public_facilities (
       housing_complex_id, name, facility_type, description, image_url, address,
       latitude, longitude, open_time, close_time, is_active, sort_order
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::time, $10::time, $11, $12)
     RETURNING id::text`,
    [
      housingId,
      input.name.trim(),
      input.facility_type,
      input.description?.trim() || null,
      input.image_url?.trim() || null,
      input.address?.trim() || null,
      input.latitude,
      input.longitude,
      input.open_time || null,
      input.close_time || null,
      input.is_active ?? true,
      input.sort_order ?? 0,
    ],
  )
  return getFacilityForAdmin(admin, rows[0]!.id)
}

export async function updateFacility(
  admin: AdminTenantContext,
  id: string,
  input: Partial<{
    name: string
    facility_type: string
    description: string | null
    image_url: string | null
    address: string | null
    latitude: number
    longitude: number
    open_time: string | null
    close_time: string | null
    is_active: boolean
    sort_order: number
  }>,
) {
  await getFacilityForAdmin(admin, id)
  if (input.facility_type) assertFacilityType(input.facility_type)

  const sets: string[] = ['updated_at = NOW()']
  const params: unknown[] = [id]
  const add = (col: string, val: unknown, cast?: string) => {
    params.push(val)
    sets.push(`${col} = $${params.length}${cast ?? ''}`)
  }

  if (input.name !== undefined) add('name', input.name.trim())
  if (input.facility_type !== undefined) add('facility_type', input.facility_type)
  if (input.description !== undefined) add('description', input.description?.trim() || null)
  if (input.image_url !== undefined) add('image_url', input.image_url?.trim() || null)
  if (input.address !== undefined) add('address', input.address?.trim() || null)
  if (input.latitude !== undefined) add('latitude', input.latitude)
  if (input.longitude !== undefined) add('longitude', input.longitude)
  if (input.open_time !== undefined) add('open_time', input.open_time, '::time')
  if (input.close_time !== undefined) add('close_time', input.close_time, '::time')
  if (input.is_active !== undefined) add('is_active', input.is_active)
  if (input.sort_order !== undefined) add('sort_order', input.sort_order)

  if (sets.length > 1) {
    await query(`UPDATE public_facilities SET ${sets.join(', ')} WHERE id = $1`, params)
  }
  return getFacilityForAdmin(admin, id)
}

export async function deleteFacility(admin: AdminTenantContext, id: string) {
  await getFacilityForAdmin(admin, id)
  await query(`UPDATE public_facilities SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [id])
}
