import { query } from '../config/database.js'
import type { ResidentContext } from '../models/user.model.js'
import { assertShopCategory } from './adminUmkm.service.js'
import * as changeRequestService from './umkmChangeRequest.service.js'
import { computeShopOpenStatus } from './umkmHours.service.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js'

type OwnedShop = {
  id: string
  name: string
  category: string
  tagline: string | null
  description: string | null
  image_url: string | null
  open_time: string
  close_time: string
  whatsapp: string | null
  status: string
  is_manual_closed: boolean
}

async function getOwnedApprovedShop(resident: ResidentContext): Promise<OwnedShop> {
  const { rows } = await query<OwnedShop & { open_time: string; close_time: string }>(
    `SELECT id::text, name, category, tagline, description, image_url,
            open_time::text, close_time::text, whatsapp,
            status::text, is_manual_closed
     FROM umkm_shops
     WHERE owner_id = $1 AND housing_complex_id = $2 AND status = 'approved'`,
    [resident.id, resident.housing_complex_id],
  )
  if (!rows[0]) {
    throw new ForbiddenError(
      'Kelola toko hanya tersedia setelah toko Anda disetujui pengurus perumahan.',
    )
  }
  return {
    ...rows[0],
    open_time: rows[0].open_time.slice(0, 5),
    close_time: rows[0].close_time.slice(0, 5),
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

export async function getManageDashboard(resident: ResidentContext) {
  const shop = await getOwnedApprovedShop(resident)
  const hoursStatus = computeShopOpenStatus(shop.open_time, shop.close_time)
  const is_open = !shop.is_manual_closed && hoursStatus.is_open

  const { rows: products } = await query<{
    id: string
    name: string
    description: string | null
    price: string
    image_url: string | null
    is_active: boolean
    sort_order: number
  }>(
    `SELECT id::text, name, description, price::text, image_url, is_active, sort_order
     FROM umkm_products
     WHERE shop_id = $1
     ORDER BY sort_order, name`,
    [shop.id],
  )

  const pendingRequests = await changeRequestService.listChangeRequestsForShop(shop.id)
  const pendingProductIds = new Set(
    pendingRequests
      .filter((r) => r.status === 'pending' && r.product_id)
      .map((r) => r.product_id as string),
  )

  return {
    shop: {
      ...shop,
      is_open,
      open_status_label: shop.is_manual_closed
        ? 'Tutup sementara (manual)'
        : hoursStatus.label,
    },
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      image_url: p.image_url,
      is_active: p.is_active,
      sort_order: p.sort_order,
      has_pending_change: pendingProductIds.has(p.id),
    })),
    pending_requests: pendingRequests.filter((r) => r.status === 'pending'),
  }
}

export async function setManualClosed(resident: ResidentContext, isManualClosed: boolean) {
  const shop = await getOwnedApprovedShop(resident)
  await query(
    `UPDATE umkm_shops SET is_manual_closed = $2, updated_at = NOW() WHERE id = $1`,
    [shop.id, isManualClosed],
  )
  const dash = await getManageDashboard(resident)
  return { is_manual_closed: isManualClosed, shop: dash.shop }
}

export async function submitShopUpdate(
  resident: ResidentContext,
  input: {
    name: string
    category: string
    tagline?: string | null
    description?: string | null
    image_url?: string | null
    open_time: string
    close_time: string
    whatsapp?: string | null
  },
) {
  const shop = await getOwnedApprovedShop(resident)
  assertShopCategory(input.category)
  const wa = normalizeWhatsapp(input.whatsapp)

  const payload = {
    name: input.name.trim(),
    category: input.category,
    tagline: input.tagline?.trim() || null,
    description: input.description?.trim() || null,
    image_url: input.image_url?.trim() || null,
    open_time: input.open_time,
    close_time: input.close_time,
    whatsapp: wa,
  }

  const id = await changeRequestService.createChangeRequest({
    shopId: shop.id,
    residentId: resident.id,
    requestType: 'shop_update',
    payload,
  })

  return { request_id: id, message: 'Perubahan profil toko dikirim. Menunggu persetujuan pengurus.' }
}

export async function submitProductCreate(
  resident: ResidentContext,
  input: {
    name: string
    description?: string | null
    price: number
    image_url?: string | null
    sort_order?: number
  },
) {
  const shop = await getOwnedApprovedShop(resident)
  if (input.price < 0) throw new ValidationError('Harga tidak boleh negatif')
  if (!input.name.trim()) throw new ValidationError('Nama produk wajib diisi')

  const id = await changeRequestService.createChangeRequest({
    shopId: shop.id,
    residentId: resident.id,
    requestType: 'product_create',
    payload: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      image_url: input.image_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
    },
  })

  return { request_id: id, message: 'Produk baru dikirim. Menunggu persetujuan pengurus.' }
}

export async function submitProductUpdate(
  resident: ResidentContext,
  productId: string,
  input: {
    name?: string
    description?: string | null
    price?: number
    image_url?: string | null
    is_active?: boolean
    sort_order?: number
  },
) {
  const shop = await getOwnedApprovedShop(resident)
  const { rows } = await query<{ id: string }>(
    `SELECT id::text FROM umkm_products WHERE id = $1 AND shop_id = $2`,
    [productId, shop.id],
  )
  if (!rows[0]) throw new NotFoundError('Produk tidak ditemukan')
  if (input.price != null && input.price < 0) throw new ValidationError('Harga tidak boleh negatif')

  const id = await changeRequestService.createChangeRequest({
    shopId: shop.id,
    residentId: resident.id,
    requestType: 'product_update',
    productId,
    payload: {
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.price != null ? { price: input.price } : {}),
      ...(input.image_url !== undefined
        ? { image_url: input.image_url?.trim() || null }
        : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      ...(input.sort_order != null ? { sort_order: input.sort_order } : {}),
    },
  })

  return { request_id: id, message: 'Perubahan produk dikirim. Menunggu persetujuan pengurus.' }
}

export async function submitProductDelete(resident: ResidentContext, productId: string) {
  const shop = await getOwnedApprovedShop(resident)
  const { rows } = await query<{ id: string; name: string }>(
    `SELECT id::text, name FROM umkm_products WHERE id = $1 AND shop_id = $2 AND is_active = TRUE`,
    [productId, shop.id],
  )
  if (!rows[0]) throw new NotFoundError('Produk tidak ditemukan')

  const id = await changeRequestService.createChangeRequest({
    shopId: shop.id,
    residentId: resident.id,
    requestType: 'product_delete',
    productId,
    payload: { name: rows[0].name },
  })

  return { request_id: id, message: 'Penghapusan produk dikirim. Menunggu persetujuan pengurus.' }
}
