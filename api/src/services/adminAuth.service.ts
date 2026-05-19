import bcrypt from 'bcrypt'
import { query } from '../config/database.js'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js'

export type AdminProfile = {
  id: string
  email: string
  full_name: string
  role: string
  housing_complex_id: string | null
  housing_name: string | null
  housing_kecamatan: string | null
  housing_kelurahan: string | null
  housing_kode_pos: string | null
  is_super_admin: boolean
}

export async function getAdminProfile(adminId: string): Promise<AdminProfile> {
  const { rows } = await query<{
    id: string
    email: string
    full_name: string
    role: string
    housing_complex_id: string | null
    housing_name: string | null
    housing_kecamatan: string | null
    housing_kelurahan: string | null
    housing_kode_pos: string | null
  }>(
    `SELECT a.id::text, a.email, a.full_name, a.role::text, a.housing_complex_id::text,
            h.name AS housing_name, h.kecamatan AS housing_kecamatan,
            h.kelurahan AS housing_kelurahan, h.kode_pos AS housing_kode_pos
     FROM admins a
     LEFT JOIN housing_complexes h ON h.id = a.housing_complex_id
     WHERE a.id = $1 AND a.status = 'active'`,
    [adminId],
  )
  const admin = rows[0]
  if (!admin) throw new NotFoundError('Akun admin tidak ditemukan')
  return {
    ...admin,
    is_super_admin: admin.role === 'super_admin',
  }
}

export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { rows } = await query<{ password_hash: string }>(
    `SELECT password_hash FROM admins WHERE id = $1 AND status = 'active'`,
    [adminId],
  )
  const row = rows[0]
  if (!row) throw new NotFoundError('Akun admin tidak ditemukan')

  const ok = await bcrypt.compare(currentPassword, row.password_hash)
  if (!ok) {
    throw new UnauthorizedError('Password saat ini salah')
  }

  if (currentPassword === newPassword) {
    throw new BadRequestError('Password baru harus berbeda dari password saat ini')
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await query(`UPDATE admins SET password_hash = $2, updated_at = NOW() WHERE id = $1`, [
    adminId,
    hash,
  ])
}
