import type { PoolClient } from 'pg'
import { pool, query } from '../config/database.js'
import type { HousingComplex } from '../models/housing.model.js'
import { seedDefaultCategories } from './newsCategory.service.js'
import { resolveKelurahanForHousing } from './wilayah.service.js'
import { BadRequestError, NotFoundError, ValidationError } from '../utils/errors.js'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const DEFAULT_MENU_ITEMS: { menu_key: string; label: string; icon: string; route_path: string; sort_order: number }[] = [
  { menu_key: 'ipl', label: 'Tagihan IPL', icon: 'receipt', route_path: '/ipl', sort_order: 1 },
  { menu_key: 'umkm', label: 'Toko Terdekat', icon: 'store', route_path: '/umkm', sort_order: 2 },
  { menu_key: 'fasilitas_umum', label: 'Fasilitas umum', icon: 'building-2', route_path: '/fasilitas', sort_order: 3 },
  { menu_key: 'retail', label: 'Retail', icon: 'shopping-bag', route_path: '/umkm', sort_order: 4 },
  { menu_key: 'lapor', label: 'Lapor', icon: 'alert-circle', route_path: '/lapor', sort_order: 5 },
  { menu_key: 'informasi', label: 'Informasi', icon: 'info', route_path: '/informasi', sort_order: 6 },
]

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seedDefaultMenus(housingId: string, client?: PoolClient) {
  const q = client?.query.bind(client) ?? pool.query.bind(pool)
  for (const item of DEFAULT_MENU_ITEMS) {
    await q(
      `INSERT INTO home_menu_items (housing_complex_id, menu_key, label, icon, route_path, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (housing_complex_id, menu_key) DO NOTHING`,
      [housingId, item.menu_key, item.label, item.icon, item.route_path, item.sort_order],
    )
  }
}

export type HousingListRow = HousingComplex & {
  resident_count: number
  admin_email: string | null
  created_at: string
}

export async function listHousingComplexes(opts?: { includeInactive?: boolean }): Promise<HousingListRow[]> {
  const statusFilter = opts?.includeInactive ? '' : `WHERE hc.status = 'active'`
  const { rows } = await query<HousingListRow>(
    `SELECT hc.id::text, hc.slug, hc.name, hc.address, hc.kecamatan, hc.kelurahan, hc.kode_pos,
            hc.kelurahan_kode, hc.status::text, hc.created_at::text,
            (SELECT COUNT(*)::int FROM residents r
             WHERE r.housing_complex_id = hc.id AND r.status = 'active' AND r.deleted_at IS NULL) AS resident_count,
            (SELECT a.email FROM admins a
             WHERE a.housing_complex_id = hc.id AND a.role = 'housing_admin' AND a.status = 'active'
             LIMIT 1) AS admin_email
     FROM housing_complexes hc
     ${statusFilter}
     ORDER BY hc.name ASC`,
  )
  return rows
}

export async function listActiveHousingComplexes(): Promise<HousingComplex[]> {
  const rows = await listHousingComplexes({ includeInactive: false })
  return rows.map(({ id, slug, name, address, kecamatan, kelurahan, kode_pos, kelurahan_kode, status }) => ({
    id,
    slug,
    name,
    address,
    kecamatan,
    kelurahan,
    kode_pos,
    kelurahan_kode,
    status,
  }))
}

export async function getHousingById(id: string): Promise<HousingListRow | null> {
  const { rows } = await query<HousingListRow>(
    `SELECT hc.id::text, hc.slug, hc.name, hc.address, hc.kecamatan, hc.kelurahan, hc.kode_pos,
            hc.kelurahan_kode, hc.status::text, hc.created_at::text,
            (SELECT COUNT(*)::int FROM residents r
             WHERE r.housing_complex_id = hc.id AND r.status = 'active' AND r.deleted_at IS NULL) AS resident_count,
            (SELECT a.email FROM admins a
             WHERE a.housing_complex_id = hc.id AND a.role = 'housing_admin' AND a.status = 'active'
             LIMIT 1) AS admin_email
     FROM housing_complexes hc
     WHERE hc.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function createHousingComplex(input: {
  slug: string
  name: string
  address?: string | null
  kelurahan_kode: string
}) {
  const slug = input.slug.trim().toLowerCase()
  const name = input.name.trim()
  if (!SLUG_REGEX.test(slug)) {
    throw new ValidationError('Slug hanya huruf kecil, angka, dan tanda hubung (contoh: griya-asri-2)')
  }
  if (name.length < 2) throw new ValidationError('Nama perumahan minimal 2 karakter')
  const wilayah = await resolveKelurahanForHousing(input.kelurahan_kode.trim())

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO housing_complexes (slug, name, address, kelurahan_kode, kecamatan, kelurahan, kode_pos)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        slug,
        name,
        input.address?.trim() || null,
        wilayah.kelurahan_kode,
        wilayah.kecamatan,
        wilayah.kelurahan,
        wilayah.kode_pos,
      ],
    )
    const id = rows[0]?.id
    if (!id) throw new BadRequestError('Gagal membuat perumahan')

    await seedDefaultMenus(id, client)
    await seedDefaultCategories(id)

    await client.query('COMMIT')
    const created = await getHousingById(id)
    if (!created) throw new BadRequestError('Gagal memuat perumahan baru')
    return created
  } catch (e: unknown) {
    await client.query('ROLLBACK')
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505') {
      throw new BadRequestError('Slug perumahan sudah digunakan')
    }
    throw e
  } finally {
    client.release()
  }
}

export async function updateHousingComplex(
  id: string,
  patch: {
    slug?: string
    name?: string
    address?: string | null
    kelurahan_kode?: string
    status?: 'active' | 'inactive'
  },
) {
  const existing = await getHousingById(id)
  if (!existing) throw new NotFoundError('Perumahan tidak ditemukan')

  const dbPatch: Record<string, unknown> = { ...patch }

  if (patch.kelurahan_kode !== undefined) {
    const wilayah = await resolveKelurahanForHousing(patch.kelurahan_kode.trim())
    dbPatch.kelurahan_kode = wilayah.kelurahan_kode
    dbPatch.kecamatan = wilayah.kecamatan
    dbPatch.kelurahan = wilayah.kelurahan
    dbPatch.kode_pos = wilayah.kode_pos
  }

  if (patch.slug !== undefined) {
    const slug = patch.slug.trim().toLowerCase()
    if (!SLUG_REGEX.test(slug)) {
      throw new ValidationError('Slug tidak valid')
    }
    dbPatch.slug = slug
  }
  if (patch.name !== undefined && patch.name.trim().length < 2) {
    throw new ValidationError('Nama minimal 2 karakter')
  }

  const fields: string[] = []
  const params: unknown[] = [id]
  let i = 2
  for (const [key, val] of Object.entries(dbPatch)) {
    if (val === undefined) continue
    fields.push(`${key} = $${i++}`)
    params.push(typeof val === 'string' ? val.trim() : val)
  }
  if (!fields.length) return existing

  fields.push('updated_at = NOW()')

  try {
    await query(`UPDATE housing_complexes SET ${fields.join(', ')} WHERE id = $1`, params)
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505') {
      throw new BadRequestError('Slug perumahan sudah digunakan')
    }
    throw e
  }

  const updated = await getHousingById(id)
  if (!updated) throw new NotFoundError('Perumahan tidak ditemukan')
  return updated
}

export async function deactivateHousingComplex(id: string) {
  const existing = await getHousingById(id)
  if (!existing) throw new NotFoundError('Perumahan tidak ditemukan')
  if (existing.status === 'inactive') {
    return existing
  }

  await query(
    `UPDATE housing_complexes SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
    [id],
  )
  const updated = await getHousingById(id)
  if (!updated) throw new NotFoundError('Perumahan tidak ditemukan')
  return updated
}
