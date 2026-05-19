import type { Request, Response } from 'express'
import { z } from 'zod'
import * as housingService from '../services/housing.service.js'
import { writeAuditLog } from '../services/audit.service.js'
import { isSuperAdmin } from '../utils/tenant.js'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js'
import { sendSuccess } from '../utils/response.js'

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: huruf kecil, angka, tanda hubung')

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(64).optional(),
  address: z.string().trim().max(500).optional().nullable(),
  kelurahan_kode: z.string().trim().min(4).max(13),
})

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: slugSchema.optional(),
  address: z.string().trim().max(500).optional().nullable(),
  kelurahan_kode: z.string().trim().min(4).max(13).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

function assertSuperAdmin(req: Request): void {
  if (!req.admin || !isSuperAdmin(req.admin)) {
    throw new ForbiddenError('Hanya super admin yang dapat mengelola perumahan')
  }
}

/** Daftar perumahan aktif (dropdown). */
export async function listHousing(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const includeInactive = req.query.include_inactive === '1' || req.query.include_inactive === 'true'
  sendSuccess(res, await housingService.listHousingComplexes({ includeInactive }))
}

export async function getHousing(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const row = await housingService.getHousingById(String(req.params.id))
  if (!row) throw new NotFoundError('Perumahan tidak ditemukan')
  sendSuccess(res, row)
}

export async function createHousing(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data perumahan tidak valid', parsed.error.flatten().fieldErrors)
  }

  const slug = parsed.data.slug?.trim().toLowerCase() ?? housingService.slugifyName(parsed.data.name)
  const data = await housingService.createHousingComplex({
    slug,
    name: parsed.data.name,
    address: parsed.data.address ?? null,
    kelurahan_kode: parsed.data.kelurahan_kode,
  })

  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.housing.create',
    entityType: 'housing_complex',
    entityId: data.id,
    payload: { slug: data.slug, name: data.name },
    req,
  })

  sendSuccess(res, data, 201)
}

export async function updateHousing(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data perumahan tidak valid', parsed.error.flatten().fieldErrors)
  }

  const id = String(req.params.id)
  const data = await housingService.updateHousingComplex(id, parsed.data)

  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.housing.update',
    entityType: 'housing_complex',
    entityId: id,
    payload: parsed.data,
    req,
  })

  sendSuccess(res, data)
}

export async function deactivateHousing(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const id = String(req.params.id)
  const data = await housingService.deactivateHousingComplex(id)

  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.housing.deactivate',
    entityType: 'housing_complex',
    entityId: id,
    req,
  })

  sendSuccess(res, data)
}
