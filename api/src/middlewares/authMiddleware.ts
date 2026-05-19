import type { NextFunction, Request, Response } from 'express'
import { query } from '../config/database.js'
import { verifyAdminToken, verifyResidentToken } from '../config/jwt.js'
import type { AdminRole } from '../models/admin.model.js'
import { UnauthorizedError } from '../utils/errors.js'
import { userRepository } from '../repositories/user.repository.js'

function extractBearer(req: Request): string {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError()
  }
  return header.slice(7)
}

/** Validasi JWT token warga */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearer(req)
    const payload = verifyResidentToken(token)
    const { rows } = await userRepository.findActiveById(payload.sub)
    if (!rows[0]) throw new UnauthorizedError()
    req.resident = rows[0]
    next()
  } catch {
    next(new UnauthorizedError())
  }
}

/** Validasi JWT token admin CMS */
export async function adminAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearer(req)
    const payload = verifyAdminToken(token)
    const { rows } = await query<{
      id: string
      email: string
      role: AdminRole
      housing_complex_id: string | null
    }>(
      `SELECT id, email, role, housing_complex_id::text
       FROM admins WHERE id = $1 AND status = 'active'`,
      [payload.sub],
    )
    if (!rows[0]) throw new UnauthorizedError()
    req.admin = rows[0]
    next()
  } catch {
    next(new UnauthorizedError())
  }
}
