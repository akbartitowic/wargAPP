import { query } from '../config/database.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import { assertHousingExists, resolveHousingComplexId, resolveHousingFilter } from '../utils/tenant.js'

export type NewsCategoryRow = {
  id: string
  housing_complex_id: string
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

const DEFAULT_CATEGORIES: { key: string; label: string; sort_order: number }[] = [
  { key: 'pengumuman', label: 'Pengumuman', sort_order: 1 },
  { key: 'keamanan', label: 'Keamanan', sort_order: 2 },
  { key: 'kegiatan', label: 'Kegiatan', sort_order: 3 },
  { key: 'umkm-info', label: 'UMKM Info', sort_order: 4 },
]

export async function seedDefaultCategories(housingComplexId: string) {
  for (const c of DEFAULT_CATEGORIES) {
    await query(
      `INSERT INTO news_categories (housing_complex_id, key, label, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (housing_complex_id, key) DO NOTHING`,
      [housingComplexId, c.key, c.label, c.sort_order],
    )
  }
}

export async function listCategories(
  admin: AdminTenantContext,
  housingFilter?: string | null,
  includeInactive = false,
) {
  const housingId = resolveHousingFilter(admin, housingFilter)
  let sql = `
    SELECT id::text, housing_complex_id::text, key, label, sort_order, is_active
    FROM news_categories
    WHERE 1=1`
  const params: unknown[] = []

  if (housingId) {
    params.push(housingId)
    sql += ` AND housing_complex_id = $${params.length}`
  }

  if (!includeInactive) {
    sql += ` AND is_active = TRUE`
  }

  sql += ` ORDER BY sort_order, label`

  let { rows } = await query<NewsCategoryRow>(sql, params)

  if (housingId && rows.length === 0) {
    await seedDefaultCategories(housingId)
    const again = await query<NewsCategoryRow>(sql, params)
    rows = again.rows
  }

  return rows.map((r) => ({
    id: r.id,
    housing_complex_id: r.housing_complex_id,
    key: r.key,
    label: r.label,
    sort_order: r.sort_order,
    is_active: r.is_active,
  }))
}

export async function listCategoriesForResident(housingComplexId: string) {
  const { rows } = await query<NewsCategoryRow>(
    `SELECT id::text, housing_complex_id::text, key, label, sort_order, is_active
     FROM news_categories
     WHERE housing_complex_id = $1 AND is_active = TRUE
     ORDER BY sort_order, label`,
    [housingComplexId],
  )
  return rows.map((r) => ({
    key: r.key,
    label: r.label,
    sort_order: r.sort_order,
  }))
}

export async function createCategory(
  admin: AdminTenantContext,
  input: {
    housing_complex_id?: string
    key: string
    label: string
    sort_order?: number
  },
) {
  const housingId = resolveHousingComplexId(admin, input.housing_complex_id)
  await assertHousingExists(housingId)

  const key = input.key.trim().toLowerCase().replace(/\s+/g, '-')
  if (!/^[a-z0-9-]{2,40}$/.test(key)) {
    throw new BadRequestError('Key kategori hanya huruf kecil, angka, dan strip (2–40 karakter)')
  }

  const { rows } = await query<{ id: string }>(
    `INSERT INTO news_categories (housing_complex_id, key, label, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id::text`,
    [housingId, key, input.label.trim(), input.sort_order ?? 99],
  )
  return getCategoryById(admin, rows[0]!.id)
}

export async function updateCategory(
  admin: AdminTenantContext,
  id: string,
  patch: { label?: string; sort_order?: number; is_active?: boolean },
) {
  await getCategoryById(admin, id)
  const fields: string[] = []
  const params: unknown[] = [id]
  let i = 2

  if (patch.label !== undefined) {
    fields.push(`label = $${i++}`)
    params.push(patch.label.trim())
  }
  if (patch.sort_order !== undefined) {
    fields.push(`sort_order = $${i++}`)
    params.push(patch.sort_order)
  }
  if (patch.is_active !== undefined) {
    fields.push(`is_active = $${i++}`)
    params.push(patch.is_active)
  }

  if (fields.length) {
    fields.push('updated_at = NOW()')
    await query(`UPDATE news_categories SET ${fields.join(', ')} WHERE id = $1`, params)

    if (patch.label) {
      await query(
        `UPDATE news_articles SET category = $2, updated_at = NOW() WHERE category_id = $1`,
        [id, patch.label.trim()],
      )
    }
  }

  return getCategoryById(admin, id)
}

async function getCategoryById(admin: AdminTenantContext, id: string) {
  const { rows } = await query<NewsCategoryRow>(
    `SELECT id::text, housing_complex_id::text, key, label, sort_order, is_active
     FROM news_categories WHERE id = $1`,
    [id],
  )
  const r = rows[0]
  if (!r) throw new NotFoundError('Kategori berita tidak ditemukan')
  resolveHousingComplexId(admin, r.housing_complex_id)
  return {
    id: r.id,
    housing_complex_id: r.housing_complex_id,
    key: r.key,
    label: r.label,
    sort_order: r.sort_order,
    is_active: r.is_active,
  }
}

export async function resolveCategoryForPublish(
  housingId: string,
  categoryId?: string,
  categoryKey?: string,
): Promise<{ id: string; label: string }> {
  if (categoryId) {
    const { rows } = await query<{ id: string; label: string }>(
      `SELECT id::text, label FROM news_categories
       WHERE id = $1 AND housing_complex_id = $2 AND is_active = TRUE`,
      [categoryId, housingId],
    )
    if (!rows[0]) throw new BadRequestError('Kategori berita tidak valid')
    return rows[0]
  }

  if (categoryKey) {
    const key = categoryKey.trim().toLowerCase()
    const { rows } = await query<{ id: string; label: string }>(
      `SELECT id::text, label FROM news_categories
       WHERE housing_complex_id = $1 AND key = $2 AND is_active = TRUE`,
      [housingId, key],
    )
    if (!rows[0]) throw new BadRequestError('Kategori berita tidak valid')
    return rows[0]
  }

  const { rows } = await query<{ id: string; label: string }>(
    `SELECT id::text, label FROM news_categories
     WHERE housing_complex_id = $1 AND key = 'pengumuman' LIMIT 1`,
    [housingId],
  )
  if (!rows[0]) throw new BadRequestError('Kategori default belum dikonfigurasi')
  return rows[0]
}
