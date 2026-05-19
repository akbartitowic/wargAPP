import { query } from '../config/database.js'
import type { ResidentContext } from '../models/user.model.js'
import { BadRequestError, NotFoundError, ValidationError } from '../utils/errors.js'
import { assertShopCategory } from './adminUmkm.service.js'

export type PartnerShopView = {
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
  status_label: string
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu persetujuan RT',
  approved: 'Disetujui — toko aktif',
  rejected: 'Ditolak',
  inactive: 'Nonaktif',
}

function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.length >= 9) return `62${digits}`
  throw new ValidationError('Nomor WhatsApp tidak valid')
}

function mapRow(r: {
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
  created_at: Date
}): PartnerShopView {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    tagline: r.tagline,
    description: r.description,
    image_url: r.image_url,
    open_time: r.open_time.slice(0, 5),
    close_time: r.close_time.slice(0, 5),
    whatsapp: r.whatsapp,
    status: r.status,
    status_label: STATUS_LABEL[r.status] ?? r.status,
    created_at: r.created_at.toISOString(),
  }
}

export async function getMyPartnerShop(resident: ResidentContext): Promise<PartnerShopView | null> {
  const { rows } = await query<{
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
    created_at: Date
  }>(
    `SELECT id::text, name, category, tagline, description, image_url,
            open_time::text, close_time::text, whatsapp, status::text, created_at
     FROM umkm_shops
     WHERE owner_id = $1 AND housing_complex_id = $2 AND status != 'inactive'
     ORDER BY created_at DESC
     LIMIT 1`,
    [resident.id, resident.housing_complex_id],
  )
  return rows[0] ? mapRow(rows[0]) : null
}

export async function applyPartnerShop(
  resident: ResidentContext,
  input: {
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
  },
) {
  assertShopCategory(input.category)
  const wa = normalizeWhatsapp(input.whatsapp)

  const existing = await getMyPartnerShop(resident)
  if (existing?.status === 'pending') {
    throw new BadRequestError('Pengajuan Anda masih menunggu persetujuan. Cek status di halaman ini.')
  }
  if (existing?.status === 'approved') {
    throw new BadRequestError('Anda sudah memiliki toko aktif. Hubungi pengurus jika perlu mengubah data.')
  }

  if (existing?.status === 'rejected') {
    await query(
      `UPDATE umkm_shops SET
         name = $2, category = $3, tagline = $4, description = $5, image_url = $6,
         open_time = $7::time, close_time = $8::time, latitude = $9, longitude = $10,
         whatsapp = $11, status = 'pending', updated_at = NOW()
       WHERE id = $1`,
      [
        existing.id,
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
      ],
    )
    return getMyPartnerShop(resident).then((s) => {
      if (!s) throw new NotFoundError('Toko tidak ditemukan')
      return s
    })
  }

  await query(
    `INSERT INTO umkm_shops (
       housing_complex_id, owner_id, name, category, tagline, description, image_url,
       open_time, close_time, latitude, longitude, whatsapp, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::time, $9::time, $10, $11, $12, 'pending')`,
    [
      resident.housing_complex_id,
      resident.id,
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
    ],
  )

  await query(`UPDATE residents SET can_manage_umkm = TRUE, updated_at = NOW() WHERE id = $1`, [
    resident.id,
  ])

  const shop = await getMyPartnerShop(resident)
  if (!shop) throw new NotFoundError('Toko tidak ditemukan')
  return shop
}
