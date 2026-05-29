import type { Request, Response } from 'express'
import { z } from 'zod'
import * as complaintCategoryService from '../services/complaintCategory.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'

const createCategorySchema = z.object({
  housing_complex_id: z.string().uuid().optional(),
  key: z.string().min(2).max(40),
  label: z.string().min(2).max(80),
  sort_order: z.coerce.number().int().min(0).max(999).optional(),
})

const updateCategorySchema = z.object({
  label: z.string().min(2).max(80).optional(),
  sort_order: z.coerce.number().int().min(0).max(999).optional(),
  is_active: z.coerce.boolean().optional(),
})

export async function listCategories(req: Request, res: Response): Promise<void> {
  const includeInactive = req.query.include_inactive === '1'
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  sendSuccess(
    res,
    await complaintCategoryService.listCategories(req.admin!, housing, includeInactive),
  )
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const parsed = createCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data kategori tidak valid', parsed.error.flatten().fieldErrors)
  }
  sendSuccess(res, await complaintCategoryService.createCategory(req.admin!, parsed.data), 201)
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const parsed = updateCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data kategori tidak valid', parsed.error.flatten().fieldErrors)
  }
  sendSuccess(
    res,
    await complaintCategoryService.updateCategory(req.admin!, String(req.params.id), parsed.data),
  )
}
