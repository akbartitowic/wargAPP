import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { query } from '../config/database.js'
import { signAdminToken } from '../config/jwt.js'
import * as adminAuthService from '../services/adminAuth.service.js'
import { writeAuditLog } from '../services/audit.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError, UnauthorizedError, ValidationError } from '../utils/errors.js'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) throw new BadRequestError('Payload tidak valid')

  const { rows } = await query<{
    id: string
    password_hash: string
    role: 'super_admin' | 'housing_admin' | 'finance_admin' | 'content_admin'
    housing_complex_id: string | null
    housing_name: string | null
  }>(
    `SELECT a.id, a.password_hash, a.role, a.housing_complex_id::text,
            h.name AS housing_name
     FROM admins a
     LEFT JOIN housing_complexes h ON h.id = a.housing_complex_id
     WHERE a.email = $1 AND a.status = 'active'`,
    [parsed.data.email],
  )

  const admin = rows[0]
  if (!admin || !(await bcrypt.compare(parsed.data.password, admin.password_hash))) {
    throw new UnauthorizedError('Email atau password salah')
  }

  if (admin.role !== 'super_admin' && !admin.housing_complex_id) {
    throw new UnauthorizedError('Akun admin tidak terikat ke perumahan')
  }

  const token = signAdminToken({
    sub: admin.id,
    role: admin.role,
    housing_complex_id: admin.housing_complex_id,
  })
  await writeAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'admin.login',
    req,
  })
  sendSuccess(res, {
    access_token: token,
    token_type: 'Bearer',
    role: admin.role,
    housing_complex_id: admin.housing_complex_id,
    housing_name: admin.housing_name,
    is_super_admin: admin.role === 'super_admin',
  })
}

export async function me(req: Request, res: Response): Promise<void> {
  const profile = await adminAuthService.getAdminProfile(req.admin!.id)
  sendSuccess(res, profile)
}

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Password saat ini wajib diisi'),
  new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
})

export async function changePassword(req: Request, res: Response): Promise<void> {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Data tidak valid', parsed.error.flatten().fieldErrors)
  }

  await adminAuthService.changeAdminPassword(
    req.admin!.id,
    parsed.data.current_password,
    parsed.data.new_password,
  )

  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.password.change',
    entityType: 'admin',
    entityId: req.admin!.id,
    req,
  })

  sendSuccess(res, { message: 'Password berhasil diperbarui' })
}
