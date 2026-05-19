import { query } from '../config/database.js'
import { computeShopOpenStatus } from './umkmHours.service.js'

type ShopRow = {
  id: string
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
  is_manual_closed: boolean
}

function mapShop(row: ShopRow, userLat?: number, userLng?: number) {
  const open = computeShopOpenStatus(
    row.open_time,
    row.close_time,
    new Date(),
    row.is_manual_closed,
  )
  let distance_km: number | null = null
  if (userLat != null && userLng != null) {
    const R = 6371
    const dLat = ((row.latitude - userLat) * Math.PI) / 180
    const dLng = ((row.longitude - userLng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((row.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    distance_km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tagline: row.tagline,
    description: row.description,
    image_url: row.image_url,
    rating: Number(row.rating),
    open_time: row.open_time.slice(0, 5),
    close_time: row.close_time.slice(0, 5),
    is_open: open.is_open,
    open_status_label: open.label,
    latitude: row.latitude,
    longitude: row.longitude,
    whatsapp: row.whatsapp,
    distance_km,
  }
}

export async function listShops(
  housingComplexId: string,
  opts: {
    filter?: string
    sort?: string
    category?: string
    lat?: number
    lng?: number
  },
) {
  let sql = `SELECT id, name, category, tagline, description, image_url, rating::text,
                    open_time::text, close_time::text, latitude, longitude, whatsapp,
                    is_manual_closed
             FROM umkm_shops
             WHERE housing_complex_id = $1 AND status = 'approved'`
  const params: unknown[] = [housingComplexId]

  if (opts.category) {
    params.push(opts.category)
    sql += ` AND category = $${params.length}`
  }

  const { rows } = await query<ShopRow>(sql, params)
  let mapped = rows.map((r) => mapShop(r, opts.lat, opts.lng))

  if (opts.filter === 'terdekat' && opts.lat != null && opts.lng != null) {
    mapped = mapped
      .filter((s) => s.distance_km != null)
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
  } else if (opts.sort === 'rating') {
    mapped.sort((a, b) => b.rating - a.rating)
  }

  return mapped
}

export async function listProducts(housingComplexId: string, shopId: string) {
  const { rows } = await query<{
    id: string
    name: string
    description: string | null
    price: string
    image_url: string | null
  }>(
    `SELECT p.id, p.name, p.description, p.price::text, p.image_url
     FROM umkm_products p
     JOIN umkm_shops s ON s.id = p.shop_id
     WHERE s.housing_complex_id = $1 AND p.shop_id = $2 AND p.is_active = TRUE
     ORDER BY p.sort_order, p.name`,
    [housingComplexId, shopId],
  )

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image_url: p.image_url,
  }))
}
