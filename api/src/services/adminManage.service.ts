import bcrypt from 'bcrypt'
import { query } from '../config/database.js'
import type { AdminRole } from '../models/admin.model.js'
import { BadRequestError, NotFoundError, ValidationError } from '../utils/errors.js'

export type AdminListRow = {
  id: string
  email: string
  full_name: string
  role: AdminRole
  status: 'active' | 'inactive'
  housing_complex_id: string | null
  housing_name: string | null
  last_login_at: string | null
  created_at: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeRoleHousing(role: AdminRole, housingComplexId?: string | null): string | null {
  if (role === 'super_admin') {
    if (housingComplexId) {
      throw new ValidationError('Super admin tidak terikat ke perumahan')
    }
    return null
  }
  if (!housingComplexId) {
    throw new ValidationError('Pilih perumahan untuk peran ini')
  }
  return housingComplexId
}

export async function listAdmins(): Promise<AdminListRow[]> {
  const { rows } = await query<AdminListRow>(
    `SELECT a.id::text, a.email, a.full_name, a.role::text AS role, a.status::text AS status,
            a.housing_complex_id::text, h.name AS housing_name,
            a.last_login_at::text, a.created_at::text
     FROM admins a
     LEFT JOIN housing_complexes h ON h.id = a.housing_complex_id
     ORDER BY a.status = 'active' DESC, a.full_name ASC`,
  )
  return rows
}

export async function getAdminById(id: string): Promise<AdminListRow | null> {
  const { rows } = await query<AdminListRow>(
    `SELECT a.id::text, a.email, a.full_name, a.role::text AS role, a.status::text AS status,
            a.housing_complex_id::text, h.name AS housing_name,
            a.last_login_at::text, a.created_at::text
     FROM admins a
     LEFT JOIN housing_complexes h ON h.id = a.housing_complex_id
     WHERE a.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function createAdmin(input: {
  email: string
  password: string
  full_name: string
  role: AdminRole
  housing_complex_id?: string | null
}): Promise<AdminListRow> {
  const email = input.email.trim().toLowerCase()
  const fullName = input.full_name.trim()
  const password = input.password

  if (!EMAIL_REGEX.test(email)) throw new ValidationError('Format email tidak valid')
  if (fullName.length < 2) throw new ValidationError('Nama minimal 2 karakter')
  if (password.length < 8) throw new ValidationError('Password minimal 8 karakter')

  const housingId = normalizeRoleHousing(input.role, input.housing_complex_id ?? null)
  const hash = await bcrypt.hash(password, 10)

  try {
    const { rows } = await query<{ id: string }>(
      `INSERT INTO admins (email, password_hash, full_name, role, housing_complex_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id::text`,
      [email, hash, fullName, input.role, housingId],
    )
    const id = rows[0]?.id
    if (!id) throw new BadRequestError('Gagal membuat admin')
    const created = await getAdminById(id)
    if (!created) throw new BadRequestError('Gagal memuat admin baru')
    return created
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e) {
      const code = (e as { code: string }).code
      if (code === '23505') {
        const msg = String((e as { detail?: string }).detail ?? '')
        if (msg.includes('housing_complex_id')) {
          throw new BadRequestError('Perumahan ini sudah memiliki admin perumahan aktif')
        }
        throw new BadRequestError('Email sudah terdaftar')
      }
    }
    throw e
  }
}

export async function updateAdmin(
  id: string,
  actorId: string,
  patch: {
    full_name?: string
    role?: AdminRole
    housing_complex_id?: string | null
    status?: 'active' | 'inactive'
    password?: string
  },
): Promise<AdminListRow> {
  const existing = await getAdminById(id)
  if (!existing) throw new NotFoundError('Admin tidak ditemukan')

  const role = patch.role ?? existing.role
  const housingId =
    patch.role !== undefined || patch.housing_complex_id !== undefined
      ? normalizeRoleHousing(role, patch.housing_complex_id ?? existing.housing_complex_id)
      : existing.housing_complex_id

  if (patch.status === 'inactive' && id === actorId) {
    throw new BadRequestError('Tidak dapat menonaktifkan akun Anda sendiri')
  }

  if (patch.password !== undefined && patch.password.length > 0 && patch.password.length < 8) {
    throw new ValidationError('Password baru minimal 8 karakter')
  }

  if (patch.full_name !== undefined && patch.full_name.trim().length < 2) {
    throw new ValidationError('Nama minimal 2 karakter')
  }

  const fields: string[] = []
  const params: unknown[] = [id]
  let i = 2

  if (patch.full_name !== undefined) {
    fields.push(`full_name = $${i++}`)
    params.push(patch.full_name.trim())
  }
  if (patch.role !== undefined || patch.housing_complex_id !== undefined) {
    fields.push(`role = $${i++}`)
    params.push(role)
    fields.push(`housing_complex_id = $${i++}`)
    params.push(housingId)
  }
  if (patch.status !== undefined) {
    fields.push(`status = $${i++}`)
    params.push(patch.status)
  }
  if (patch.password && patch.password.length >= 8) {
    const hash = await bcrypt.hash(patch.password, 10)
    fields.push(`password_hash = $${i++}`)
    params.push(hash)
  }

  if (!fields.length) return existing

  fields.push('updated_at = NOW()')

  try {
    await query(`UPDATE admins SET ${fields.join(', ')} WHERE id = $1`, params)
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505') {
      throw new BadRequestError('Perumahan ini sudah memiliki admin perumahan aktif')
    }
    throw e
  }

  const updated = await getAdminById(id)
  if (!updated) throw new NotFoundError('Admin tidak ditemukan')
  return updated
}
