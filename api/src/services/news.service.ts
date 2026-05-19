import { query } from '../config/database.js'
import { NotFoundError } from '../utils/errors.js'
import { listCategoriesForResident } from './newsCategory.service.js'

export async function listNewsCategories(housingComplexId: string) {
  return listCategoriesForResident(housingComplexId)
}

export async function listNews(housingComplexId: string) {
  const { rows } = await query<{
    slug: string
    title: string
    excerpt: string
    image_url: string | null
    category: string
    category_key: string
    is_priority: boolean
    published_at: Date
    author_name: string | null
    author_role: string | null
  }>(
    `SELECT n.slug, n.title, n.excerpt, n.image_url,
            COALESCE(nc.label, n.category) AS category,
            COALESCE(nc.key, '') AS category_key,
            n.is_priority, n.published_at, n.author_name, n.author_role
     FROM news_articles n
     LEFT JOIN news_categories nc ON nc.id = n.category_id
     WHERE n.housing_complex_id = $1 AND n.status = 'published' AND n.published_at <= NOW()
     ORDER BY n.is_priority DESC, n.published_at DESC`,
    [housingComplexId],
  )

  return rows.map((n) => ({
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    image_url: n.image_url,
    category: n.category,
    category_key: n.category_key,
    is_priority: n.is_priority,
    published_at: n.published_at.toISOString(),
    author_name: n.author_name,
    author_role: n.author_role,
  }))
}

export async function getNewsBySlug(housingComplexId: string, slug: string) {
  const { rows } = await query<{
    slug: string
    title: string
    excerpt: string
    body_html: string
    image_url: string | null
    category: string
    category_key: string
    is_priority: boolean
    published_at: Date
    author_name: string | null
    author_role: string | null
  }>(
    `SELECT n.slug, n.title, n.excerpt, n.body_html, n.image_url,
            COALESCE(nc.label, n.category) AS category,
            COALESCE(nc.key, '') AS category_key,
            n.is_priority, n.published_at, n.author_name, n.author_role
     FROM news_articles n
     LEFT JOIN news_categories nc ON nc.id = n.category_id
     WHERE n.housing_complex_id = $1 AND n.slug = $2
       AND n.status = 'published' AND n.published_at <= NOW()`,
    [housingComplexId, slug],
  )

  const n = rows[0]
  if (!n) {
    throw new NotFoundError('Berita tidak ditemukan')
  }

  return {
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    body_html: n.body_html,
    image_url: n.image_url,
    category: n.category,
    category_key: n.category_key,
    is_priority: n.is_priority,
    published_at: n.published_at.toISOString(),
    author_name: n.author_name,
    author_role: n.author_role,
  }
}
