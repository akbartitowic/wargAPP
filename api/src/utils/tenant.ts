import type { AdminRole } from '../models/admin.model.js'
import { ForbiddenError, ValidationError } from './errors.js'

export type AdminTenantContext = {
  id: string
  role: AdminRole
  housing_complex_id: string | null
}

export function isSuperAdmin(admin: AdminTenantContext): boolean {
  return admin.role === 'super_admin'
}

/** Admin yang hanya mengelola satu perumahan (bukan super admin). */
export function isHousingAdmin(admin: AdminTenantContext): boolean {
  return admin.role !== 'super_admin'
}

/**
 * Tentukan perumahan target untuk operasi tulis.
 * Super admin wajib menyertakan housing_complex_id di body.
 */
export function resolveHousingComplexId(
  admin: AdminTenantContext,
  requestedId?: string | null,
): string {
  if (isSuperAdmin(admin)) {
    const id = requestedId?.trim()
    if (!id) {
      throw new ValidationError('Pilih perumahan tujuan untuk operasi ini')
    }
    return id
  }
  if (!admin.housing_complex_id) {
    throw new ForbiddenError('Akun admin tidak terikat ke perumahan')
  }
  if (requestedId && requestedId !== admin.housing_complex_id) {
    throw new ForbiddenError('Tidak dapat mengelola data perumahan lain')
  }
  return admin.housing_complex_id
}

/** Filter daftar: null = semua perumahan (super admin). */
export function resolveHousingFilter(
  admin: AdminTenantContext,
  requestedId?: string | null,
): string | null {
  if (isSuperAdmin(admin)) {
    return requestedId?.trim() || null
  }
  if (!admin.housing_complex_id) {
    throw new ForbiddenError('Akun admin tidak terikat ke perumahan')
  }
  if (requestedId && requestedId !== admin.housing_complex_id) {
    throw new ForbiddenError('Tidak dapat melihat data perumahan lain')
  }
  return admin.housing_complex_id
}

import { query } from '../config/database.js'

export async function assertHousingExists(housingId: string): Promise<void> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM housing_complexes WHERE id = $1 AND status = 'active'`,
    [housingId],
  )
  if (!rows[0]) {
    throw new ValidationError('Perumahan tidak ditemukan atau tidak aktif')
  }
}
