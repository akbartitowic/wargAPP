import type { Request, Response } from 'express'
import { z } from 'zod'
import * as umkmPartnerManageService from '../services/umkmPartnerManage.service.js'
import { sendSuccess } from '../utils/response.js'
import { ValidationError } from '../utils/errors.js'

const shopUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(1),
  tagline: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  image_url: z.string().trim().max(500).nullable().optional(),
  open_time: z.string().regex(/^\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}$/),
  whatsapp: z.string().trim().max(32).nullable().optional(),
})

const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.coerce.number().min(0),
  image_url: z.string().trim().max(500).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
})

const productUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.coerce.number().min(0).optional(),
  image_url: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
})

export async function getManageDashboard(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await umkmPartnerManageService.getManageDashboard(req.resident!))
}

export async function setManualClosed(req: Request, res: Response): Promise<void> {
  const parsed = z.object({ is_manual_closed: z.boolean() }).safeParse(req.body)
  if (!parsed.success) throw new ValidationError('is_manual_closed wajib boolean')
  sendSuccess(
    res,
    await umkmPartnerManageService.setManualClosed(
      req.resident!,
      parsed.data.is_manual_closed,
    ),
  )
}

export async function submitShopUpdate(req: Request, res: Response): Promise<void> {
  const parsed = shopUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Data toko tidak valid', parsed.error.flatten().fieldErrors)
  }
  const d = parsed.data
  sendSuccess(
    res,
    await umkmPartnerManageService.submitShopUpdate(req.resident!, {
      name: d.name,
      category: d.category,
      tagline: d.tagline ?? null,
      description: d.description ?? null,
      image_url: d.image_url ?? null,
      open_time: d.open_time,
      close_time: d.close_time,
      whatsapp: d.whatsapp ?? null,
    }),
    201,
  )
}

export async function submitProductCreate(req: Request, res: Response): Promise<void> {
  const parsed = productCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Data produk tidak valid', parsed.error.flatten().fieldErrors)
  }
  const d = parsed.data
  sendSuccess(
    res,
    await umkmPartnerManageService.submitProductCreate(req.resident!, {
      name: d.name,
      description: d.description ?? null,
      price: d.price,
      image_url: d.image_url ?? null,
      sort_order: d.sort_order,
    }),
    201,
  )
}

export async function submitProductUpdate(req: Request, res: Response): Promise<void> {
  const parsed = productUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Data produk tidak valid', parsed.error.flatten().fieldErrors)
  }
  sendSuccess(
    res,
    await umkmPartnerManageService.submitProductUpdate(
      req.resident!,
      String(req.params.productId),
      parsed.data,
    ),
    201,
  )
}

export async function submitProductDelete(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await umkmPartnerManageService.submitProductDelete(
      req.resident!,
      String(req.params.productId),
    ),
    201,
  )
}
