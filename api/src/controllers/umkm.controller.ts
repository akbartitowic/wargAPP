import type { Request, Response } from 'express'
import { z } from 'zod'
import { publicUploadUrl } from '../config/env.js'
import { umkmImageUpload, processUmkmImage } from '../middlewares/umkmUpload.js'
import * as umkmPartnerService from '../services/umkmPartner.service.js'
import * as umkmService from '../services/umkm.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError, ValidationError } from '../utils/errors.js'

const applySchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(1),
  tagline: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  image_url: z.string().trim().max(500).nullable().optional(),
  open_time: z.string().regex(/^\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  whatsapp: z.string().trim().max(32).nullable().optional(),
})

export async function listShops(req: Request, res: Response): Promise<void> {
  const lat = req.query.lat ? Number(req.query.lat) : undefined
  const lng = req.query.lng ? Number(req.query.lng) : undefined
  const data = await umkmService.listShops(req.resident!.housing_complex_id, {
    filter: req.query.filter as string | undefined,
    sort: req.query.sort as string | undefined,
    category: req.query.category as string | undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  })
  sendSuccess(res, data)
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await umkmService.listProducts(
    req.resident!.housing_complex_id,
    String(req.params.id),
  ))
}

export async function getMyPartnerShop(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await umkmPartnerService.getMyPartnerShop(req.resident!))
}

export async function applyPartnerShop(req: Request, res: Response): Promise<void> {
  const parsed = applySchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Data pengajuan tidak valid', parsed.error.flatten().fieldErrors)
  }
  const d = parsed.data
  const data = await umkmPartnerService.applyPartnerShop(req.resident!, {
    name: d.name,
    category: d.category,
    tagline: d.tagline ?? null,
    description: d.description ?? null,
    image_url: d.image_url ?? null,
    open_time: d.open_time,
    close_time: d.close_time,
    latitude: d.latitude ?? -6.2088,
    longitude: d.longitude ?? 106.8456,
    whatsapp: d.whatsapp ?? null,
  })
  sendSuccess(res, data, 201)
}

export async function uploadPartnerImage(req: Request, res: Response): Promise<void> {
  if (!req.file?.buffer) throw new BadRequestError('File gambar wajib (field: image)')
  const variant = req.query.variant === 'product' ? 'product' : 'shop'
  const processed = await processUmkmImage(req.file.buffer, variant)
  const url = publicUploadUrl(processed.relativePath)
  sendSuccess(res, { url, path: processed.relativePath }, 201)
}

export { umkmImageUpload }
