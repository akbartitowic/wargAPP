import type { NextFunction, Request, Response } from 'express'
import { HOUSING_SCOPED_ADMIN_ROLES, type AdminRole } from '../models/admin.model.js'
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js'

/** Gatekeeper IPL — is_parent + can_view_billing, tanpa query billing jika ditolak */
export function requireBillingAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const r = req.resident
  if (!r) {
    next(new UnauthorizedError())
    return
  }
  if (!r.is_parent || !r.can_view_billing) {
    next(
      new ForbiddenError(
        'Hanya kepala keluarga (wali) dengan akses tagihan yang dapat mengakses fitur ini',
      ),
    )
    return
  }
  next()
}

export function requireAdminRoles(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const admin = req.admin
    if (!admin) {
      next(new UnauthorizedError())
      return
    }
    const allowed = new Set(roles)
    for (const r of HOUSING_SCOPED_ADMIN_ROLES) {
      if (allowed.has('housing_admin')) allowed.add(r)
    }
    if (admin.role === 'super_admin' || allowed.has(admin.role)) {
      next()
      return
    }
    next(new ForbiddenError('Peran admin tidak memiliki akses ke modul ini'))
  }
}
