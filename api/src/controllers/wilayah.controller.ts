import type { Request, Response } from 'express'
import { z } from 'zod'
import * as wilayahService from '../services/wilayah.service.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import { sendSuccess } from '../utils/response.js'

const searchSchema = z.object({
  parent: z.string().trim().max(13).optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
})

export async function search(req: Request, res: Response): Promise<void> {
  const parsed = searchSchema.safeParse(req.query)
  if (!parsed.success) {
    throw new BadRequestError('Parameter pencarian tidak valid')
  }

  const data = await wilayahService.searchWilayah({
    parent: parsed.data.parent ?? null,
    q: parsed.data.q,
    limit: parsed.data.limit ?? 10,
  })

  sendSuccess(res, data)
}

export async function getByKode(req: Request, res: Response): Promise<void> {
  const kode = String(req.params.kode)
  const row = await wilayahService.getWilayahByKode(kode)
  if (!row) throw new NotFoundError('Wilayah tidak ditemukan')
  sendSuccess(res, row)
}

export async function getChain(req: Request, res: Response): Promise<void> {
  const kode = String(req.params.kode)
  const chain = await wilayahService.getWilayahChain(kode)
  sendSuccess(res, chain)
}
