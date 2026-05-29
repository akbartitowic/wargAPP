import { query } from '../config/database.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import { assertHousingExists, resolveHousingComplexId, resolveHousingFilter } from '../utils/tenant.js'

export type ComplaintCategoryRow = {
  id: string
  housing_complex_id: string
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

const DEFAULT_CATEGORIES: { key: string; label: string; sort_order: number }[] = [
  { key: 'keamanan', label: 'Keamanan', sort_order: 1 },
  { key: 'kebersihan', label: 'Kebersihan', sort_order: 2 },
  { key: 'infrastruktur', label: 'Infrastruktur', sort_order: 3 },
  { key: 'fasilitas', label: 'Fasilitas umum', sort_order: 4 },
  { key: 'lainnya', label: 'Lainnya', sort_order: 5 },
]

export async function seedDefaultComplaintCategories(housingComplexId: string) {
  for (const c of DEFAULT_CATEGORIES) {
    await query(
      `INSERT INTO complaint_categories (housing_complex_id, key, label, sort_order)
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
    FROM complaint_categories
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

  let { rows } = await query<ComplaintCategoryRow>(sql, params)

  if (housingId && rows.length === 0) {
    await seedDefaultComplaintCategories(housingId)
    const again = await query<ComplaintCategoryRow>(sql, params)
    rows = again.rows
  }

  return rows
}

export async function listCategoriesForResident(housingComplexId: string) {
  let { rows } = await query<ComplaintCategoryRow>(
    `SELECT id::text, housing_complex_id::text, key, label, sort_order, is_active
     FROM complaint_categories
     WHERE housing_complex_id = $1 AND is_active = TRUE
     ORDER BY sort_order, label`,
    [housingComplexId],
  )

  if (rows.length === 0) {
    await seedDefaultComplaintCategories(housingComplexId)
    const again = await query<ComplaintCategoryRow>(
      `SELECT id::text, housing_complex_id::text, key, label, sort_order, is_active
       FROM complaint_categories
       WHERE housing_complex_id = $1 AND is_active = TRUE
       ORDER BY sort_order, label`,
      [housingComplexId],
    )
    rows = again.rows
  }

  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    sort_order: r.sort_order,
  }))
}

async function getCategoryById(admin: AdminTenantContext, id: string) {
  const { rows } = await query<ComplaintCategoryRow>(
    `SELECT id::text, housing_complex_id::text, key, label, sort_order, is_active
     FROM complaint_categories WHERE id = $1`,
    [id],
  )
  if (!rows[0]) throw new NotFoundError('Kategori komplain tidak ditemukan')
  resolveHousingComplexId(admin, rows[0].housing_complex_id)
  return rows[0]
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
    `INSERT INTO complaint_categories (housing_complex_id, key, label, sort_order)
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
  if (patch.label !== undefined) {
    params.push(patch.label.trim())
    fields.push(`label = $${params.length}`)
  }
  if (patch.sort_order !== undefined) {
    params.push(patch.sort_order)
    fields.push(`sort_order = $${params.length}`)
  }
  if (patch.is_active !== undefined) {
    params.push(patch.is_active)
    fields.push(`is_active = $${params.length}`)
  }
  if (fields.length) {
    fields.push('updated_at = NOW()')
    await query(`UPDATE complaint_categories SET ${fields.join(', ')} WHERE id = $1`, params)
  }
  return getCategoryById(admin, id)
}
