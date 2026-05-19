import type { ApiUmkmProduct, ApiUmkmShop } from '@/config/api/endpoints'
import type { UmkmCategoryFilter, UmkmStore } from '@/data/umkm'
import { resolveMediaUrl } from '@/lib/mediaUrl'

const CATEGORY_MAP: Record<string, Exclude<UmkmCategoryFilter, 'Semua'>> = {
  Makanan: 'Makanan',
  Jasa: 'Jasa',
  Kebutuhan: 'Kebutuhan',
}

function normalizeCategory(category: string): Exclude<UmkmCategoryFilter, 'Semua'> {
  return CATEGORY_MAP[category] ?? 'Kebutuhan'
}

function whatsappHref(raw: string | null): string {
  if (!raw) return ''
  if (raw.startsWith('http')) return raw
  const digits = raw.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

export function mapApiShopToStore(s: ApiUmkmShop): UmkmStore {
  const filterCategory = normalizeCategory(s.category)
  const distanceLabel =
    s.distance_km != null ? `${s.distance_km} km` : s.open_status_label

  return {
    id: s.id,
    name: s.name,
    filterCategory,
    detailLine: `${distanceLabel} • ${s.category}`,
    distanceKm: s.distance_km ?? 99,
    imageSrc: resolveMediaUrl(s.image_url),
    tagline: s.tagline ?? '',
    rating: s.rating,
    openTime: s.open_time,
    closeTime: s.close_time,
    latitude: s.latitude,
    longitude: s.longitude,
    whatsappHref: whatsappHref(s.whatsapp),
    storeDescription: s.description ?? s.tagline ?? undefined,
  }
}

export type UmkmProductView = {
  id: string
  slug: string
  name: string
  price: number
  imageSrc: string
  description: string
}

export function mapApiProduct(p: ApiUmkmProduct): UmkmProductView {
  return {
    id: p.id,
    slug: p.id,
    name: p.name,
    price: p.price,
    imageSrc: resolveMediaUrl(p.image_url, 'https://picsum.photos/seed/warga-product/600/600'),
    description: p.description ?? '',
  }
}
