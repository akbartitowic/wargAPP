import { query } from '../config/database.js'
import { assertShopCategory } from './adminUmkm.service.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import { resolveHousingFilter } from '../utils/tenant.js'
import { BadRequestError, NotFoundError, ValidationError } from '../utils/errors.js'

export type ChangeRequestType =
  | 'shop_update'
  | 'product_create'
  | 'product_update'
  | 'product_delete'

type ChangeRow = {
  id: string
  shop_id: string
  shop_name: string
  housing_name: string
  owner_name: string | null
  request_type: ChangeRequestType
  product_id: string | null
  payload: Record<string, unknown>
  status: string
  reject_note: string | null
  created_at: Date
}

function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.length >= 9) return `62${digits}`
  throw new ValidationError('Nomor WhatsApp tidak valid')
}

export async function assertNoDuplicatePending(
  shopId: string,
  requestType: ChangeRequestType,
  productId?: string | null,
) {
  const params: unknown[] = [shopId, requestType]
  let sql = `SELECT id::text FROM umkm_change_requests
             WHERE shop_id = $1 AND request_type = $2::umkm_change_request_type
               AND status = 'pending'`
  if (productId) {
    params.push(productId)
    sql += ` AND product_id = $${params.length}`
  } else if (requestType === 'shop_update') {
    sql += ` AND product_id IS NULL`
  }
  const { rows } = await query<{ id: string }>(sql, params)
  if (rows[0]) {
    throw new BadRequestError(
      'Masih ada pengajuan serupa yang menunggu persetujuan. Tunggu ditinjau pengurus terlebih dahulu.',
    )
  }
}

export async function createChangeRequest(input: {
  shopId: string
  residentId: string
  requestType: ChangeRequestType
  productId?: string | null
  payload: Record<string, unknown>
}) {
  await assertNoDuplicatePending(input.shopId, input.requestType, input.productId ?? null)

  const { rows } = await query<{ id: string }>(
    `INSERT INTO umkm_change_requests (
       shop_id, resident_id, request_type, product_id, payload
     ) VALUES ($1, $2, $3::umkm_change_request_type, $4, $5::jsonb)
     RETURNING id::text`,
    [
      input.shopId,
      input.residentId,
      input.requestType,
      input.productId ?? null,
      JSON.stringify(input.payload),
    ],
  )
  return rows[0]!.id
}

async function getChangeRequestById(id: string): Promise<ChangeRow> {
  const { rows } = await query<ChangeRow>(
    `SELECT r.id::text, r.shop_id::text, s.name AS shop_name, h.name AS housing_name,
            ow.nama AS owner_name,
            r.request_type::text AS request_type,
            r.product_id::text, r.payload, r.status::text, r.reject_note, r.created_at
     FROM umkm_change_requests r
     JOIN umkm_shops s ON s.id = r.shop_id
     JOIN housing_complexes h ON h.id = s.housing_complex_id
     LEFT JOIN residents ow ON ow.id = s.owner_id
     WHERE r.id = $1`,
    [id],
  )
  if (!rows[0]) throw new NotFoundError('Pengajuan tidak ditemukan')
  return rows[0]
}

async function applyApprovedRequest(row: ChangeRow): Promise<void> {
  const p = row.payload

  if (row.request_type === 'shop_update') {
    const category = p.category as string | undefined
    if (category) assertShopCategory(category)
    const sets: string[] = ['updated_at = NOW()']
    const params: unknown[] = [row.shop_id]
    const add = (col: string, val: unknown, cast?: string) => {
      params.push(val)
      sets.push(`${col} = $${params.length}${cast ?? ''}`)
    }
    if (p.name != null) add('name', String(p.name).trim())
    if (category != null) add('category', category)
    if (p.tagline !== undefined) add('tagline', p.tagline ? String(p.tagline).trim() : null)
    if (p.description !== undefined) {
      add('description', p.description ? String(p.description).trim() : null)
    }
    if (p.image_url !== undefined) {
      add('image_url', p.image_url ? String(p.image_url).trim() : null)
    }
    if (p.open_time != null) add('open_time', String(p.open_time), '::time')
    if (p.close_time != null) add('close_time', String(p.close_time), '::time')
    if (p.whatsapp !== undefined) add('whatsapp', normalizeWhatsapp(p.whatsapp as string | null))
    await query(`UPDATE umkm_shops SET ${sets.join(', ')} WHERE id = $1`, params)
    return
  }

  if (row.request_type === 'product_create') {
    const price = Number(p.price)
    if (!Number.isFinite(price) || price < 0) throw new ValidationError('Harga tidak valid')
    await query(
      `INSERT INTO umkm_products (shop_id, name, description, price, image_url, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
      [
        row.shop_id,
        String(p.name).trim(),
        p.description ? String(p.description).trim() : null,
        price,
        p.image_url ? String(p.image_url).trim() : null,
        Number(p.sort_order) || 0,
      ],
    )
    return
  }

  if (row.request_type === 'product_update' && row.product_id) {
    const price = p.price != null ? Number(p.price) : undefined
    if (price != null && (Number.isNaN(price) || price < 0)) {
      throw new ValidationError('Harga tidak valid')
    }
    const sets: string[] = []
    const params: unknown[] = [row.product_id, row.shop_id]
    const add = (col: string, val: unknown) => {
      params.push(val)
      sets.push(`${col} = $${params.length}`)
    }
    if (p.name != null) add('name', String(p.name).trim())
    if (p.description !== undefined) {
      add('description', p.description ? String(p.description).trim() : null)
    }
    if (price != null) add('price', price)
    if (p.image_url !== undefined) add('image_url', p.image_url ? String(p.image_url).trim() : null)
    if (p.is_active !== undefined) add('is_active', Boolean(p.is_active))
    if (p.sort_order != null) add('sort_order', Number(p.sort_order))
    if (sets.length) {
      await query(
        `UPDATE umkm_products SET ${sets.join(', ')} WHERE id = $1 AND shop_id = $2`,
        params,
      )
    }
    return
  }

  if (row.request_type === 'product_delete' && row.product_id) {
    await query(`UPDATE umkm_products SET is_active = FALSE WHERE id = $1 AND shop_id = $2`, [
      row.product_id,
      row.shop_id,
    ])
  }
}

export async function listPendingChangeRequests(
  admin: AdminTenantContext,
  opts: { housing_complex_id?: string | null },
) {
  const housingId = resolveHousingFilter(admin, opts.housing_complex_id)
  const params: unknown[] = []
  let where = `WHERE r.status = 'pending'`
  if (housingId) {
    params.push(housingId)
    where += ` AND s.housing_complex_id = $${params.length}`
  }

  const { rows } = await query<ChangeRow>(
    `SELECT r.id::text, r.shop_id::text, s.name AS shop_name, h.name AS housing_name,
            ow.nama AS owner_name,
            r.request_type::text AS request_type,
            r.product_id::text, r.payload, r.status::text, r.reject_note, r.created_at
     FROM umkm_change_requests r
     JOIN umkm_shops s ON s.id = r.shop_id
     JOIN housing_complexes h ON h.id = s.housing_complex_id
     LEFT JOIN residents ow ON ow.id = s.owner_id
     ${where}
     ORDER BY r.created_at ASC`,
    params,
  )

  return rows.map((r) => ({
    id: r.id,
    shop_id: r.shop_id,
    shop_name: r.shop_name,
    housing_name: r.housing_name,
    owner_name: r.owner_name,
    request_type: r.request_type,
    product_id: r.product_id,
    payload: r.payload,
    status: r.status,
    reject_note: r.reject_note,
    created_at: r.created_at.toISOString(),
    summary: summarizeRequest(r),
  }))
}

function summarizeRequest(r: ChangeRow): string {
  const p = r.payload
  switch (r.request_type) {
    case 'shop_update':
      return `Ubah profil toko → ${String(p.name ?? r.shop_name)}`
    case 'product_create':
      return `Tambah produk: ${String(p.name ?? '—')} (${formatIdr(Number(p.price))})`
    case 'product_update':
      return `Ubah produk: ${String(p.name ?? '—')}`
    case 'product_delete':
      return `Nonaktifkan produk (ID ${r.product_id?.slice(0, 8) ?? '—'})`
    default:
      return r.request_type
  }
}

function formatIdr(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export async function approveChangeRequest(admin: AdminTenantContext, requestId: string) {
  const row = await getChangeRequestById(requestId)
  if (row.status !== 'pending') {
    throw new BadRequestError('Pengajuan sudah diproses')
  }

  await applyApprovedRequest(row)

  await query(
    `UPDATE umkm_change_requests
     SET status = 'approved', reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [requestId, admin.id],
  )

  return { id: requestId, status: 'approved' as const }
}

export async function rejectChangeRequest(
  admin: AdminTenantContext,
  requestId: string,
  rejectNote?: string | null,
) {
  const row = await getChangeRequestById(requestId)
  if (row.status !== 'pending') {
    throw new BadRequestError('Pengajuan sudah diproses')
  }

  await query(
    `UPDATE umkm_change_requests
     SET status = 'rejected', reject_note = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [requestId, rejectNote?.trim() || null, admin.id],
  )

  return { id: requestId, status: 'rejected' as const }
}

export async function listChangeRequestsForShop(shopId: string, limit = 20) {
  const { rows } = await query<{
    id: string
    request_type: ChangeRequestType
    product_id: string | null
    payload: Record<string, unknown>
    status: string
    reject_note: string | null
    created_at: Date
  }>(
    `SELECT id::text, request_type::text AS request_type, product_id::text,
            payload, status::text, reject_note, created_at
     FROM umkm_change_requests
     WHERE shop_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [shopId, limit],
  )
  return rows.map((r) => ({
    id: r.id,
    request_type: r.request_type,
    product_id: r.product_id,
    payload: r.payload,
    status: r.status,
    reject_note: r.reject_note,
    created_at: r.created_at.toISOString(),
    summary: summarizeRequest({
      ...r,
      shop_id: shopId,
      shop_name: '',
      housing_name: '',
      owner_name: null,
    }),
  }))
}
