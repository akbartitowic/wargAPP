import type { Request, Response } from 'express'
import { z } from 'zod'
import { publicUploadUrl } from '../config/env.js'
import { facilityImageUpload, processFacilityImage } from '../middlewares/facilityUpload.js'
import * as adminFacilityService from '../services/adminFacility.service.js'
import { writeAuditLog } from '../services/audit.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError, ValidationError } from '../utils/errors.js'

/** Terima HH:mm atau HH:mm:ss dari input browser. */
function normalizeTimeInput(value: unknown): string | null {
  if (value == null || value === '') return null
  const s = String(value).trim()
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = m[1].padStart(2, '0')
  const min = m[2]
  return `${h}:${min}`
}

const facilitySchema = z.object({
  housing_complex_id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  facility_type: z.string().trim().min(1),
  description: z.string().trim().max(4000).nullable().optional(),
  image_url: z.string().trim().max(500).nullable().optional().or(z.literal('')),
  address: z.string().trim().max(500).nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  open_time: z.preprocess(normalizeTimeInput, z.string().nullable().optional()),
  close_time: z.preprocess(normalizeTimeInput, z.string().nullable().optional()),
  is_active: z.coerce.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
})

function parseBody(body: unknown, partial = false) {
  const schema = partial ? facilitySchema.partial() : facilitySchema
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError('Data fasilitas tidak valid', parsed.error.flatten().fieldErrors)
  }
  const d = parsed.data
  if (d.facility_type) adminFacilityService.assertFacilityType(d.facility_type)
  if (d.housing_complex_id === '') {
    throw new ValidationError('Pilih perumahan', { housing_complex_id: ['Wajib dipilih'] })
  }
  return {
    ...d,
    image_url: d.image_url || null,
    description: d.description ?? null,
    address: d.address ?? null,
    open_time: d.open_time ?? null,
    close_time: d.close_time ?? null,
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  const q = typeof req.query.q === 'string' ? req.query.q : undefined
  sendSuccess(res, await adminFacilityService.listFacilitiesForAdmin(req.admin!, housing, q))
}

export async function getById(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await adminFacilityService.getFacilityForAdmin(req.admin!, String(req.params.id)))
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = parseBody(req.body, false)
  const data = await adminFacilityService.createFacility(req.admin!, {
    housing_complex_id: body.housing_complex_id,
    name: body.name!,
    facility_type: body.facility_type!,
    description: body.description,
    image_url: body.image_url,
    address: body.address,
    latitude: body.latitude!,
    longitude: body.longitude!,
    open_time: body.open_time,
    close_time: body.close_time,
    is_active: body.is_active,
    sort_order: body.sort_order,
  })
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.facility.create',
    entityType: 'public_facility',
    entityId: data.id,
    payload: { name: data.name },
    req,
  })
  sendSuccess(res, data, 201)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = parseBody(req.body, true)
  const data = await adminFacilityService.updateFacility(req.admin!, String(req.params.id), body)
  sendSuccess(res, data)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await adminFacilityService.deleteFacility(req.admin!, String(req.params.id))
  sendSuccess(res, { deleted: true })
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (!req.file?.buffer) throw new BadRequestError('File gambar wajib (field: image)')
  const processed = await processFacilityImage(req.file.buffer)
  const url = publicUploadUrl(processed.relativePath)
  sendSuccess(res, { url, path: processed.relativePath }, 201)
}

export { facilityImageUpload }
