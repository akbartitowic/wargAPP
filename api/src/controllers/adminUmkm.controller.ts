import type { Request, Response } from 'express'
import { z } from 'zod'
import { publicUploadUrl } from '../config/env.js'
import { umkmImageUpload, processUmkmImage } from '../middlewares/umkmUpload.js'
import * as adminUmkmService from '../services/adminUmkm.service.js'
import * as umkmChangeRequestService from '../services/umkmChangeRequest.service.js'
import { writeAuditLog } from '../services/audit.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError, ValidationError } from '../utils/errors.js'

const timeRegex = /^\d{2}:\d{2}$/

const shopBodySchema = z.object({
  housing_complex_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2, 'Nama toko minimal 2 karakter').max(120),
  category: z.string().trim().min(1),
  tagline: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  image_url: z.string().trim().max(500).nullable().optional().or(z.literal('')),
  open_time: z.string().regex(timeRegex, 'Format jam: HH:mm'),
  close_time: z.string().regex(timeRegex, 'Format jam: HH:mm'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  whatsapp: z.string().trim().max(32).nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'inactive']).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
})

const productBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.coerce.number().min(0),
  image_url: z.string().trim().max(500).nullable().optional().or(z.literal('')),
  is_active: z.coerce.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
})

function parseShopBody(body: unknown, partial = false) {
  const schema = partial ? shopBodySchema.partial() : shopBodySchema
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError('Data toko tidak valid', parsed.error.flatten().fieldErrors)
  }
  const d = parsed.data
  if (d.category) adminUmkmService.assertShopCategory(d.category)
  return {
    ...d,
    image_url: d.image_url || null,
    tagline: d.tagline ?? null,
    description: d.description ?? null,
    whatsapp: d.whatsapp ?? null,
  }
}

function parseProductBody(body: unknown, partial = false) {
  const schema = partial ? productBodySchema.partial() : productBodySchema
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError('Data produk tidak valid', parsed.error.flatten().fieldErrors)
  }
  const d = parsed.data
  return {
    ...d,
    image_url: d.image_url || null,
    description: d.description ?? null,
  }
}

export async function listShops(req: Request, res: Response): Promise<void> {
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  const status = typeof req.query.status === 'string' ? req.query.status : null
  const category = typeof req.query.category === 'string' ? req.query.category : null
  const q = typeof req.query.q === 'string' ? req.query.q : undefined
  sendSuccess(
    res,
    await adminUmkmService.listShopsForAdmin(req.admin!, {
      housingFilter: housing,
      status,
      category,
      q,
    }),
  )
}

export async function getShop(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await adminUmkmService.getShopForAdmin(req.admin!, String(req.params.shopId)))
}

export async function createShop(req: Request, res: Response): Promise<void> {
  const body = parseShopBody(req.body, false)
  const data = await adminUmkmService.createShop(req.admin!, {
    housing_complex_id: body.housing_complex_id,
    owner_id: body.owner_id,
    name: body.name!,
    category: body.category!,
    tagline: body.tagline,
    description: body.description,
    image_url: body.image_url,
    open_time: body.open_time!,
    close_time: body.close_time!,
    latitude: body.latitude!,
    longitude: body.longitude!,
    whatsapp: body.whatsapp,
    status: body.status,
  })
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.umkm.shop.create',
    entityType: 'umkm_shop',
    entityId: data.id,
    payload: { name: data.name },
    req,
  })
  sendSuccess(res, data, 201)
}

export async function updateShop(req: Request, res: Response): Promise<void> {
  const body = parseShopBody(req.body, true)
  const data = await adminUmkmService.updateShop(req.admin!, String(req.params.shopId), body)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.umkm.shop.update',
    entityType: 'umkm_shop',
    entityId: data.id,
    req,
  })
  sendSuccess(res, data)
}

export async function setShopStatus(req: Request, res: Response): Promise<void> {
  const status = z.enum(['pending', 'approved', 'rejected', 'inactive']).parse(req.body.status)
  const data = await adminUmkmService.updateShop(req.admin!, String(req.params.shopId), { status })
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: `admin.umkm.shop.${status}`,
    entityType: 'umkm_shop',
    entityId: data.id,
    req,
  })
  sendSuccess(res, data)
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await adminUmkmService.listProductsForAdmin(req.admin!, String(req.params.shopId)),
  )
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const body = parseProductBody(req.body, false)
  const data = await adminUmkmService.createProduct(
    req.admin!,
    String(req.params.shopId),
    {
      name: body.name!,
      description: body.description,
      price: body.price!,
      image_url: body.image_url,
      is_active: body.is_active,
      sort_order: body.sort_order,
    },
  )
  sendSuccess(res, data, 201)
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const body = parseProductBody(req.body, true)
  const data = await adminUmkmService.updateProduct(
    req.admin!,
    String(req.params.shopId),
    String(req.params.productId),
    body,
  )
  sendSuccess(res, data)
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  await adminUmkmService.deleteProduct(
    req.admin!,
    String(req.params.shopId),
    String(req.params.productId),
  )
  sendSuccess(res, { deleted: true })
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (!req.file?.buffer) throw new BadRequestError('File gambar wajib (field: image)')
  const variant =
    req.query.variant === 'product' ? ('product' as const) : ('shop' as const)
  const processed = await processUmkmImage(req.file.buffer, variant)
  const url = publicUploadUrl(processed.relativePath)
  sendSuccess(res, { url, path: processed.relativePath }, 201)
}

export async function listChangeRequests(req: Request, res: Response): Promise<void> {
  const housing = req.query.housing_complex_id as string | undefined
  sendSuccess(
    res,
    await umkmChangeRequestService.listPendingChangeRequests(req.admin!, {
      housing_complex_id: housing ?? null,
    }),
  )
}

export async function approveChangeRequest(req: Request, res: Response): Promise<void> {
  const data = await umkmChangeRequestService.approveChangeRequest(
    req.admin!,
    String(req.params.requestId),
  )
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.umkm.change_request.approve',
    entityType: 'umkm_change_request',
    entityId: data.id,
    req,
  })
  sendSuccess(res, data)
}

export async function rejectChangeRequest(req: Request, res: Response): Promise<void> {
  const note = (req.body as { reject_note?: string })?.reject_note
  const data = await umkmChangeRequestService.rejectChangeRequest(
    req.admin!,
    String(req.params.requestId),
    note,
  )
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.umkm.change_request.reject',
    entityType: 'umkm_change_request',
    entityId: data.id,
    req,
  })
  sendSuccess(res, data)
}

export { umkmImageUpload }
