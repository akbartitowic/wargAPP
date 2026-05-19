import { query } from '../config/database.js'
import { ForbiddenError, NotFoundError } from '../utils/errors.js'
import type { AdminRole } from '../models/admin.model.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import { assertHousingExists, resolveHousingComplexId, resolveHousingFilter } from '../utils/tenant.js'
import { resolveCategoryForPublish } from './newsCategory.service.js'

export async function listNewsForAdmin(
  admin: AdminTenantContext,
  housingFilter?: string | null,
  limit = 50,
  offset = 0,
) {
  const housingId = resolveHousingFilter(admin, housingFilter)
  const params: unknown[] = [limit, offset]
  let housingSql = ''
  if (housingId) {
    housingSql = ` AND na.housing_complex_id = $3`
    params.push(housingId)
  }

  const { rows } = await query<{
    id: string
    slug: string
    title: string
    excerpt: string
    category: string
    category_key: string
    category_id: string
    is_priority: boolean
    status: string
    published_at: Date | null
    housing_name: string
    created_at: Date
  }>(
    `SELECT na.id::text, na.slug, na.title, na.excerpt,
            COALESCE(nc.label, na.category) AS category,
            COALESCE(nc.key, '') AS category_key,
            na.category_id::text,
            na.is_priority, na.status::text, na.published_at,
            h.name AS housing_name, na.created_at
     FROM news_articles na
     JOIN housing_complexes h ON h.id = na.housing_complex_id
     LEFT JOIN news_categories nc ON nc.id = na.category_id
     WHERE 1=1${housingSql}
     ORDER BY na.created_at DESC
     LIMIT $1 OFFSET $2`,
    params,
  )

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    category_key: r.category_key,
    category_id: r.category_id,
    is_priority: r.is_priority,
    status: r.status,
    published_at: r.published_at?.toISOString() ?? null,
    housing_name: r.housing_name,
    created_at: r.created_at.toISOString(),
  }))
}

export async function getNewsForAdmin(admin: AdminTenantContext, id: string) {
  const { rows } = await query<{
    id: string
    housing_complex_id: string
    slug: string
    title: string
    excerpt: string
    body_html: string
    image_url: string | null
    category: string
    category_id: string | null
    category_key: string
    is_priority: boolean
    status: string
    published_at: Date | null
    housing_name: string
  }>(
    `SELECT na.id::text, na.housing_complex_id::text, na.slug, na.title, na.excerpt,
            na.body_html, na.image_url,
            COALESCE(nc.label, na.category) AS category,
            na.category_id::text,
            COALESCE(nc.key, '') AS category_key,
            na.is_priority, na.status::text, na.published_at,
            h.name AS housing_name
     FROM news_articles na
     JOIN housing_complexes h ON h.id = na.housing_complex_id
     LEFT JOIN news_categories nc ON nc.id = na.category_id
     WHERE na.id = $1`,
    [id],
  )
  const r = rows[0]
  if (!r) throw new NotFoundError('Berita tidak ditemukan')
  resolveHousingComplexId(admin, r.housing_complex_id)

  return {
    id: r.id,
    housing_complex_id: r.housing_complex_id,
    housing_name: r.housing_name,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body_html: r.body_html,
    image_url: r.image_url,
    category: r.category,
    category_id: r.category_id,
    category_key: r.category_key,
    is_priority: r.is_priority,
    status: r.status,
    published_at: r.published_at?.toISOString() ?? null,
  }
}

export async function publishNewsArticle(
  adminCtx: AdminTenantContext,
  adminId: string,
  input: {
    housing_complex_id?: string
    title: string
    slug: string
    excerpt: string
    body_html: string
    category_id?: string
    category_key?: string
    is_priority: boolean
    image_url?: string
    published_at?: string
    author_name?: string
    author_role?: string
  },
  actorRole: AdminRole,
) {
  if (actorRole === 'finance_admin') {
    throw new ForbiddenError('Admin keuangan tidak dapat mempublikasikan berita')
  }

  const housingId = resolveHousingComplexId(adminCtx, input.housing_complex_id)
  await assertHousingExists(housingId)

  const cat = await resolveCategoryForPublish(housingId, input.category_id, input.category_key)

  const { rows } = await query<{ id: string }>(
    `INSERT INTO news_articles (
       housing_complex_id, slug, title, excerpt, body_html, image_url,
       category, category_id, is_priority,
       status, published_at, created_by, author_name, author_role
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published',COALESCE($10::timestamptz, NOW()),$11,$12,$13)
     RETURNING id`,
    [
      housingId,
      input.slug,
      input.title,
      input.excerpt,
      input.body_html,
      input.image_url ?? null,
      cat.label,
      cat.id,
      input.is_priority,
      input.published_at ?? null,
      adminId,
      input.author_name ?? null,
      input.author_role ?? null,
    ],
  )

  return { id: rows[0]?.id, slug: input.slug }
}

export async function updateNewsArticle(
  adminCtx: AdminTenantContext,
  id: string,
  patch: {
    title?: string
    slug?: string
    excerpt?: string
    body_html?: string
    category_id?: string
    is_priority?: boolean
    image_url?: string | null
    status?: 'draft' | 'published' | 'archived'
    published_at?: string | null
  },
) {
  const existing = await getNewsForAdmin(adminCtx, id)
  const housingId = existing.housing_complex_id

  let categoryLabel = existing.category
  let categoryId = existing.category_id

  if (patch.category_id) {
    const cat = await resolveCategoryForPublish(housingId, patch.category_id)
    categoryLabel = cat.label
    categoryId = cat.id
  }

  const fields: string[] = []
  const params: unknown[] = [id]
  let i = 2

  const scalar: Record<string, unknown> = {
    title: patch.title,
    slug: patch.slug,
    excerpt: patch.excerpt,
    body_html: patch.body_html,
    is_priority: patch.is_priority,
    image_url: patch.image_url,
    status: patch.status,
    published_at: patch.published_at,
  }

  for (const [key, val] of Object.entries(scalar)) {
    if (val === undefined) continue
    if (key === 'status') {
      fields.push(`status = $${i++}::news_status`)
    } else if (key === 'published_at') {
      fields.push(`published_at = $${i++}::timestamptz`)
    } else {
      fields.push(`${key} = $${i++}`)
    }
    params.push(val)
  }

  if (patch.category_id) {
    fields.push(`category = $${i++}`, `category_id = $${i++}`)
    params.push(categoryLabel, categoryId)
  }

  if (fields.length) {
    fields.push('updated_at = NOW()')
    await query(`UPDATE news_articles SET ${fields.join(', ')} WHERE id = $1`, params)
  }

  return getNewsForAdmin(adminCtx, id)
}
