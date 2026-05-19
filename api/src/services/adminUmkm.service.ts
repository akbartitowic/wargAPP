import { query } from '../config/database.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import {
  assertHousingExists,
  resolveHousingComplexId,
  resolveHousingFilter,
} from '../utils/tenant.js'

export type UmkmShopStatus = 'pending' | 'approved' | 'rejected' | 'inactive'

const SHOP_CATEGORIES = ['Makanan', 'Jasa', 'Kebutuhan'] as const

export function assertShopCategory(category: string) {
  if (!SHOP_CATEGORIES.includes(category as (typeof SHOP_CATEGORIES)[number])) {
    throw new ValidationError(`Kategori harus: ${SHOP_CATEGORIES.join(', ')}`)
  }
}

function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.length >= 9) return `62${digits}`
  throw new ValidationError('Nomor WhatsApp tidak valid')
}

export async function listShopsForAdmin(
  admin: AdminTenantContext,
  opts: { housingFilter?: string | null; status?: string | null; category?: string | null; q?: string },
) {
  const housingId = resolveHousingFilter(admin, opts.housingFilter)
  const params: unknown[] = []
  let where = 'WHERE 1=1'

  if (housingId) {
    params.push(housingId)
    where += ` AND s.housing_complex_id = $${params.length}`
  }
  if (opts.status) {
    params.push(opts.status)
    where += ` AND s.status = $${params.length}::umkm_shop_status`
  }
  if (opts.category) {
    params.push(opts.category)
    where += ` AND s.category = $${params.length}`
  }
  if (opts.q?.trim()) {
    params.push(`%${opts.q.trim()}%`)
    where += ` AND (s.name ILIKE $${params.length} OR s.tagline ILIKE $${params.length})`
  }

  const { rows } = await query<{
    id: string
    housing_complex_id: string
    housing_name: string
    owner_id: string | null
    owner_name: string | null
    name: string
    category: string
    tagline: string | null
    description: string | null
    image_url: string | null
    rating: string
    open_time: string
    close_time: string
    latitude: number
    longitude: number
    whatsapp: string | null
    status: UmkmShopStatus
    product_count: number
    active_product_count: number
    created_at: Date
    updated_at: Date
  }>(
    `SELECT s.id::text, s.housing_complex_id::text, h.name AS housing_name,
            s.owner_id::text, r.nama AS owner_name,
            s.name, s.category, s.tagline, s.description, s.image_url,
            s.rating::text,
            to_char(s.open_time, 'HH24:MI') AS open_time,
            to_char(s.close_time, 'HH24:MI') AS close_time,
            s.latitude, s.longitude, s.whatsapp,
            s.status::text AS status,
            (SELECT COUNT(*)::int FROM umkm_products p WHERE p.shop_id = s.id) AS product_count,
            (SELECT COUNT(*)::int FROM umkm_products p WHERE p.shop_id = s.id AND p.is_active = TRUE) AS active_product_count,
            s.created_at, s.updated_at
     FROM umkm_shops s
     JOIN housing_complexes h ON h.id = s.housing_complex_id
     LEFT JOIN residents r ON r.id = s.owner_id
     ${where}
     ORDER BY
       CASE s.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       s.updated_at DESC`,
    params,
  )

  return rows.map((r) => ({
    id: r.id,
    housing_complex_id: r.housing_complex_id,
    housing_name: r.housing_name,
    owner_id: r.owner_id,
    owner_name: r.owner_name,
    name: r.name,
    category: r.category,
    tagline: r.tagline,
    description: r.description,
    image_url: r.image_url,
    rating: Number(r.rating),
    open_time: r.open_time,
    close_time: r.close_time,
    latitude: r.latitude,
    longitude: r.longitude,
    whatsapp: r.whatsapp,
    status: r.status,
    product_count: r.product_count,
    active_product_count: r.active_product_count,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }))
}

export async function getShopForAdmin(admin: AdminTenantContext, shopId: string) {
  const shops = await listShopsForAdmin(admin, { housingFilter: null })
  const shop = shops.find((s) => s.id === shopId)
  if (!shop) throw new NotFoundError('Toko tidak ditemukan')
  if (admin.role !== 'super_admin' && admin.housing_complex_id !== shop.housing_complex_id) {
    throw new ForbiddenError('Tidak dapat mengelola toko perumahan lain')
  }
  return shop
}

export async function createShop(
  admin: AdminTenantContext,
  input: {
    housing_complex_id?: string
    owner_id?: string | null
    name: string
    category: string
    tagline?: string | null
    description?: string | null
    image_url?: string | null
    open_time: string
    close_time: string
    latitude: number
    longitude: number
    whatsapp?: string | null
    status?: UmkmShopStatus
  },
) {
  assertShopCategory(input.category)
  const housingId = resolveHousingComplexId(admin, input.housing_complex_id)
  await assertHousingExists(housingId)

  if (input.owner_id) {
    const { rows } = await query<{ id: string }>(
      `SELECT id::text FROM residents
       WHERE id = $1 AND housing_complex_id = $2 AND status = 'active' AND deleted_at IS NULL`,
      [input.owner_id, housingId],
    )
    if (!rows[0]) throw new ValidationError('Pemilik toko tidak ditemukan di perumahan ini')
  }

  const status = input.status ?? 'pending'
  const wa = normalizeWhatsapp(input.whatsapp)

  const { rows } = await query<{ id: string }>(
    `INSERT INTO umkm_shops (
       housing_complex_id, owner_id, name, category, tagline, description, image_url,
       open_time, close_time, latitude, longitude, whatsapp, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::time, $9::time, $10, $11, $12, $13::umkm_shop_status)
     RETURNING id::text`,
    [
      housingId,
      input.owner_id ?? null,
      input.name.trim(),
      input.category,
      input.tagline?.trim() || null,
      input.description?.trim() || null,
      input.image_url?.trim() || null,
      input.open_time,
      input.close_time,
      input.latitude,
      input.longitude,
      wa,
      status,
    ],
  )
  return getShopForAdmin(admin, rows[0]!.id)
}

export async function updateShop(
  admin: AdminTenantContext,
  shopId: string,
  input: Partial<{
    owner_id: string | null
    name: string
    category: string
    tagline: string | null
    description: string | null
    image_url: string | null
    rating: number
    open_time: string
    close_time: string
    latitude: number
    longitude: number
    whatsapp: string | null
    status: UmkmShopStatus
  }>,
) {
  const existing = await getShopForAdmin(admin, shopId)
  if (input.category) assertShopCategory(input.category)

  if (input.owner_id) {
    const { rows } = await query<{ id: string }>(
      `SELECT id::text FROM residents
       WHERE id = $1 AND housing_complex_id = $2 AND status = 'active' AND deleted_at IS NULL`,
      [input.owner_id, existing.housing_complex_id],
    )
    if (!rows[0]) throw new ValidationError('Pemilik toko tidak ditemukan di perumahan ini')
  }

  const sets: string[] = ['updated_at = NOW()']
  const params: unknown[] = [shopId]
  const add = (col: string, val: unknown, cast?: string) => {
    params.push(val)
    sets.push(`${col} = $${params.length}${cast ?? ''}`)
  }

  if (input.owner_id !== undefined) add('owner_id', input.owner_id)
  if (input.name !== undefined) add('name', input.name.trim())
  if (input.category !== undefined) add('category', input.category)
  if (input.tagline !== undefined) add('tagline', input.tagline?.trim() || null)
  if (input.description !== undefined) add('description', input.description?.trim() || null)
  if (input.image_url !== undefined) add('image_url', input.image_url?.trim() || null)
  if (input.rating !== undefined) add('rating', input.rating)
  if (input.open_time !== undefined) add('open_time', input.open_time, '::time')
  if (input.close_time !== undefined) add('close_time', input.close_time, '::time')
  if (input.latitude !== undefined) add('latitude', input.latitude)
  if (input.longitude !== undefined) add('longitude', input.longitude)
  if (input.whatsapp !== undefined) add('whatsapp', normalizeWhatsapp(input.whatsapp))
  if (input.status !== undefined) add('status', input.status, '::umkm_shop_status')

  if (sets.length === 1) return existing

  await query(`UPDATE umkm_shops SET ${sets.join(', ')} WHERE id = $1`, params)

  return getShopForAdmin(admin, shopId)
}

export async function listProductsForAdmin(admin: AdminTenantContext, shopId: string) {
  await getShopForAdmin(admin, shopId)
  const { rows } = await query<{
    id: string
    name: string
    description: string | null
    price: string
    image_url: string | null
    is_active: boolean
    sort_order: number
    created_at: Date
  }>(
    `SELECT id::text, name, description, price::text, image_url, is_active, sort_order, created_at
     FROM umkm_products
     WHERE shop_id = $1
     ORDER BY sort_order, name`,
    [shopId],
  )
  return rows.map((p) => ({
    id: p.id,
    shop_id: shopId,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image_url: p.image_url,
    is_active: p.is_active,
    sort_order: p.sort_order,
    created_at: p.created_at.toISOString(),
  }))
}

export async function createProduct(
  admin: AdminTenantContext,
  shopId: string,
  input: {
    name: string
    description?: string | null
    price: number
    image_url?: string | null
    is_active?: boolean
    sort_order?: number
  },
) {
  await getShopForAdmin(admin, shopId)
  if (input.price < 0) throw new ValidationError('Harga tidak boleh negatif')

  const { rows } = await query<{ id: string }>(
    `INSERT INTO umkm_products (shop_id, name, description, price, image_url, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id::text`,
    [
      shopId,
      input.name.trim(),
      input.description?.trim() || null,
      input.price,
      input.image_url?.trim() || null,
      input.is_active ?? true,
      input.sort_order ?? 0,
    ],
  )
  const products = await listProductsForAdmin(admin, shopId)
  return products.find((p) => p.id === rows[0]!.id)!
}

export async function updateProduct(
  admin: AdminTenantContext,
  shopId: string,
  productId: string,
  input: Partial<{
    name: string
    description: string | null
    price: number
    image_url: string | null
    is_active: boolean
    sort_order: number
  }>,
) {
  await getShopForAdmin(admin, shopId)
  if (input.price != null && input.price < 0) throw new ValidationError('Harga tidak boleh negatif')

  const sets: string[] = []
  const params: unknown[] = [productId, shopId]
  const add = (col: string, val: unknown) => {
    params.push(val)
    sets.push(`${col} = $${params.length}`)
  }
  if (input.name !== undefined) add('name', input.name.trim())
  if (input.description !== undefined) add('description', input.description?.trim() || null)
  if (input.price !== undefined) add('price', input.price)
  if (input.image_url !== undefined) add('image_url', input.image_url?.trim() || null)
  if (input.is_active !== undefined) add('is_active', input.is_active)
  if (input.sort_order !== undefined) add('sort_order', input.sort_order)
  if (sets.length === 0) {
    const products = await listProductsForAdmin(admin, shopId)
    const p = products.find((x) => x.id === productId)
    if (!p) throw new NotFoundError('Produk tidak ditemukan')
    return p
  }

  const { rowCount } = await query(
    `UPDATE umkm_products SET ${sets.join(', ')} WHERE id = $1 AND shop_id = $2`,
    params,
  )
  if (!rowCount) throw new NotFoundError('Produk tidak ditemukan')
  const products = await listProductsForAdmin(admin, shopId)
  return products.find((p) => p.id === productId)!
}

export async function deleteProduct(admin: AdminTenantContext, shopId: string, productId: string) {
  await getShopForAdmin(admin, shopId)
  const { rowCount } = await query(`DELETE FROM umkm_products WHERE id = $1 AND shop_id = $2`, [
    productId,
    shopId,
  ])
  if (!rowCount) throw new NotFoundError('Produk tidak ditemukan')
}

export { SHOP_CATEGORIES }
