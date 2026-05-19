import type { Request, Response } from 'express'
import { z } from 'zod'
import * as adminManageService from '../services/adminManage.service.js'
import { writeAuditLog } from '../services/audit.service.js'
import { isSuperAdmin } from '../utils/tenant.js'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js'
import { sendSuccess } from '../utils/response.js'

const roleSchema = z.enum(['super_admin', 'housing_admin', 'finance_admin', 'content_admin'])

const createSchema = z.object({
  email: z.string().trim().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  full_name: z.string().trim().min(2).max(120),
  role: roleSchema,
  housing_complex_id: z.string().uuid().optional().nullable(),
})

const updateSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  role: roleSchema.optional(),
  housing_complex_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
  password: z.string().min(8).optional().or(z.literal('')),
})

function assertSuperAdmin(req: Request): void {
  if (!req.admin || !isSuperAdmin(req.admin)) {
    throw new ForbiddenError('Hanya super admin yang dapat mengelola akun administrator')
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  sendSuccess(res, await adminManageService.listAdmins())
}

export async function getById(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const row = await adminManageService.getAdminById(String(req.params.id))
  if (!row) throw new NotFoundError('Admin tidak ditemukan')
  sendSuccess(res, row)
}

export async function create(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data admin tidak valid', parsed.error.flatten().fieldErrors)
  }

  const data = await adminManageService.createAdmin({
    email: parsed.data.email,
    password: parsed.data.password,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
    housing_complex_id: parsed.data.housing_complex_id ?? null,
  })

  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.admin.create',
    entityType: 'admin',
    entityId: data.id,
    payload: { email: data.email, role: data.role },
    req,
  })

  sendSuccess(res, data, 201)
}

export async function update(req: Request, res: Response): Promise<void> {
  assertSuperAdmin(req)
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data admin tidak valid', parsed.error.flatten().fieldErrors)
  }

  const id = String(req.params.id)
  const password =
    parsed.data.password && parsed.data.password.length > 0 ? parsed.data.password : undefined

  const data = await adminManageService.updateAdmin(id, req.admin!.id, {
    ...parsed.data,
    password,
  })

  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.admin.update',
    entityType: 'admin',
    entityId: id,
    payload: { role: data.role, status: data.status },
    req,
  })

  sendSuccess(res, data)
}
