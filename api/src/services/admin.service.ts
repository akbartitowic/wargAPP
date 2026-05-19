import bcrypt from 'bcrypt'
import { query, pool } from '../config/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js'
import { userRepository } from '../repositories/user.repository.js'
import { maskSensitiveId } from '../utils/masking.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import { formatAlamatLengkap } from '../utils/address.js'
import { resolvePhotoUrl } from '../utils/media.js'
import { assertHousingExists, resolveHousingComplexId, resolveHousingFilter } from '../utils/tenant.js'
import * as housingUnitService from './housingUnit.service.js'

const NIK_REGEX = /^\d{16}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

type OccupancyType = 'pemilik' | 'kontrak'

function toDateString(d: Date | string | null | undefined): string | null {
  if (d == null) return null
  if (typeof d === 'string') return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function assertOccupancyDates(
  occupancyType: OccupancyType,
  start: string,
  end?: string | null,
) {
  if (!ISO_DATE.test(start)) {
    throw new ValidationError('Tanggal mulai tinggal tidak valid (YYYY-MM-DD)')
  }
  if (occupancyType === 'kontrak') {
    if (!end || !ISO_DATE.test(end)) {
      throw new ValidationError('Tanggal akhir tinggal wajib untuk warga kontrak')
    }
    if (end < start) {
      throw new ValidationError('Tanggal akhir tidak boleh sebelum tanggal mulai')
    }
  } else if (end && ISO_DATE.test(end) && end < start) {
    throw new ValidationError('Tanggal akhir tidak boleh sebelum tanggal mulai')
  }
}

async function resolveKontrakOwner(
  housingId: string,
  occupancyType: OccupancyType,
  ownerResidentId: string | null | undefined,
  residentId?: string,
): Promise<string | null> {
  if (occupancyType === 'pemilik') {
    if (ownerResidentId) {
      throw new ValidationError('Warga pemilik tidak memiliki parent pemilik')
    }
    return null
  }
  if (!ownerResidentId) {
    throw new ValidationError('Warga kontrak wajib memilih pemilik (parent)')
  }
  if (residentId && ownerResidentId === residentId) {
    throw new ValidationError('Pemilik tidak boleh merujuk ke diri sendiri')
  }
  const { rows } = await query<{
    occupancy_type: string
    status: string
    housing_complex_id: string
  }>(
    `SELECT occupancy_type::text, status::text, housing_complex_id::text
     FROM residents WHERE id = $1 AND deleted_at IS NULL`,
    [ownerResidentId],
  )
  const owner = rows[0]
  if (!owner) throw new ValidationError('Pemilik yang dipilih tidak ditemukan')
  if (owner.housing_complex_id !== housingId) {
    throw new ValidationError('Pemilik harus berada di perumahan yang sama')
  }
  if (owner.status !== 'active') {
    throw new ValidationError('Pemilik harus berstatus aktif')
  }
  if (owner.occupancy_type !== 'pemilik') {
    throw new ValidationError('Parent warga kontrak harus berstatus Pemilik')
  }
  return ownerResidentId
}

export async function listResidents(
  admin: AdminTenantContext,
  limit = 50,
  offset = 0,
  housingFilter?: string | null,
) {
  const scope = resolveHousingFilter(admin, housingFilter)
  const { rows } = await userRepository.listForAdmin(scope, limit, offset)

  return rows.map((r) => ({
    id: r.id,
    /** Kunci pengelompokan KK (hanya untuk CMS admin). */
    no_kk: r.no_kk,
    nik_masked: maskSensitiveId(r.nik),
    no_kk_masked: maskSensitiveId(r.no_kk),
    nama: r.nama,
    no_hp: r.no_hp,
    blok_rumah: r.blok_rumah,
    agama: r.agama,
    is_parent: r.is_parent,
    status: r.status,
    housing_name: r.housing_name,
    housing_complex_id: r.housing_complex_id,
    nama_jalan: r.nama_jalan,
    rt: r.rt,
    rw: r.rw,
    kecamatan: r.kecamatan,
    kelurahan: r.kelurahan,
    kode_pos: r.kode_pos,
    alamat_lengkap: formatAlamatLengkap({
      nama_jalan: r.nama_jalan,
      blok_rumah: r.blok_rumah,
      rt: r.rt,
      rw: r.rw,
      kelurahan: r.kelurahan,
      kecamatan: r.kecamatan,
      kode_pos: r.kode_pos,
    }),
    foto_profil_url: resolvePhotoUrl(r.foto_profil_url),
    occupancy_type: r.occupancy_type,
    residence_start_date: toDateString(r.residence_start_date)!,
    residence_end_date: toDateString(r.residence_end_date),
    owner_resident_id: r.owner_resident_id,
    owner_name: r.owner_name,
    housing_unit_id: r.housing_unit_id,
    allows_multiple_kk: r.allows_multiple_kk ?? false,
    created_at: r.created_at.toISOString(),
  }))
}

export async function createResident(
  admin: AdminTenantContext,
  input: {
    housing_complex_id?: string
    nik: string
    no_kk: string
    nama: string
    no_hp: string
    nama_jalan: string
    blok_rumah: string
    rt: string
    rw: string
    agama: string
    password: string
    is_parent: boolean
    occupancy_type?: OccupancyType
    residence_start_date?: string
    residence_end_date?: string | null
    owner_resident_id?: string | null
    housing_unit_id?: string
    allows_multiple_kk?: boolean
  },
) {
  const housingId = resolveHousingComplexId(admin, input.housing_complex_id)
  await assertHousingExists(housingId)
  if (!NIK_REGEX.test(input.nik)) {
    throw new ValidationError('NIK harus 16 digit angka')
  }
  if (!NIK_REGEX.test(input.no_kk)) {
    throw new ValidationError('No KK harus 16 digit angka')
  }

  const occupancyType: OccupancyType = input.occupancy_type ?? 'pemilik'
  const residenceStart = input.residence_start_date ?? new Date().toISOString().slice(0, 10)
  const residenceEnd =
    occupancyType === 'kontrak' ? (input.residence_end_date ?? null) : null
  assertOccupancyDates(occupancyType, residenceStart, residenceEnd)

  if (occupancyType === 'kontrak' && input.is_parent) {
    throw new ValidationError('Warga kontrak tidak dapat menjadi kepala keluarga (wali)')
  }

  const ownerId = await resolveKontrakOwner(
    housingId,
    occupancyType,
    input.owner_resident_id,
  )

  let housingUnitId: string
  let addr = {
    nama_jalan: input.nama_jalan,
    blok_rumah: input.blok_rumah,
    rt: input.rt,
    rw: input.rw,
  }

  if (input.housing_unit_id) {
    const unit = await housingUnitService.getHousingUnitById(input.housing_unit_id)
    if (unit.housing_complex_id !== housingId) {
      throw new ValidationError('Alamat tidak berada di perumahan yang dipilih')
    }
    await housingUnitService.assertCanRegisterKkAtUnit(input.housing_unit_id, input.no_kk)
    housingUnitId = input.housing_unit_id
    addr = {
      nama_jalan: unit.nama_jalan,
      blok_rumah: unit.blok_rumah,
      rt: unit.rt,
      rw: unit.rw,
    }
  } else {
    housingUnitId = await housingUnitService.findOrCreateHousingUnit(
      housingId,
      addr,
      input.allows_multiple_kk ?? false,
    )
    await housingUnitService.assertCanRegisterKkAtUnit(housingUnitId, input.no_kk)
  }

  const hash = await bcrypt.hash(input.password, 10)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (input.is_parent) {
      await client.query(
        `UPDATE residents SET is_parent = FALSE, can_view_billing = FALSE, updated_at = NOW()
         WHERE housing_complex_id = $1 AND no_kk = $2 AND is_parent = TRUE AND status = 'active'`,
        [housingId, input.no_kk],
      )
    }

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO residents (
         housing_complex_id, housing_unit_id, nik, no_kk, password_hash, nama, no_hp,
         nama_jalan, blok_rumah, rt, rw, agama,
         is_parent, can_view_billing, can_manage_umkm,
         occupancy_type, residence_start_date, residence_end_date, owner_resident_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::religion_type,$13,$13,FALSE,
         $14::resident_occupancy_type,$15::date,$16::date,$17)
       RETURNING id`,
      [
        housingId,
        housingUnitId,
        input.nik,
        input.no_kk,
        hash,
        input.nama,
        input.no_hp,
        addr.nama_jalan,
        addr.blok_rumah,
        addr.rt,
        addr.rw,
        input.agama,
        input.is_parent,
        occupancyType,
        residenceStart,
        residenceEnd,
        ownerId,
      ],
    )

    await client.query('COMMIT')
    return { id: rows[0]?.id }
  } catch (e: unknown) {
    await client.query('ROLLBACK')
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505') {
      throw new BadRequestError('NIK sudah terdaftar di perumahan ini')
    }
    throw e
  } finally {
    client.release()
  }
}

export async function getResidentForAdmin(admin: AdminTenantContext, id: string) {
  const { rows } = await query<{
    id: string
    nik: string
    no_kk: string
    nama: string
    no_hp: string
    blok_rumah: string
    nama_jalan: string
    rt: string
    rw: string
    agama: string
    is_parent: boolean
    status: string
    housing_complex_id: string
    housing_name: string
    kelurahan: string
    kecamatan: string
    kode_pos: string
    occupancy_type: string
    residence_start_date: Date
    residence_end_date: Date | null
    owner_resident_id: string | null
    owner_name: string | null
    housing_unit_id: string
    allows_multiple_kk: boolean
    foto_profil_url: string | null
  }>(
    `SELECT r.id::text, r.nik, r.no_kk, r.nama, r.no_hp, r.blok_rumah, r.nama_jalan, r.rt, r.rw,
            r.agama::text, r.is_parent, r.status::text, r.housing_complex_id::text,
            r.housing_unit_id::text, u.allows_multiple_kk,
            r.occupancy_type::text, r.residence_start_date, r.residence_end_date,
            r.owner_resident_id::text, o.nama AS owner_name,
            r.foto_profil_url,
            h.name AS housing_name, h.kelurahan, h.kecamatan, h.kode_pos
     FROM residents r
     JOIN housing_complexes h ON h.id = r.housing_complex_id
     LEFT JOIN housing_units u ON u.id = r.housing_unit_id
     LEFT JOIN residents o ON o.id = r.owner_resident_id
     WHERE r.id = $1`,
    [id],
  )
  const r = rows[0]
  if (!r) throw new NotFoundError('Warga tidak ditemukan')
  resolveHousingComplexId(admin, r.housing_complex_id)

  return {
    id: r.id,
    can_login: r.status === 'active',
    no_kk: r.no_kk,
    nik_masked: maskSensitiveId(r.nik),
    no_kk_masked: maskSensitiveId(r.no_kk),
    nama: r.nama,
    no_hp: r.no_hp,
    blok_rumah: r.blok_rumah,
    nama_jalan: r.nama_jalan,
    rt: r.rt,
    rw: r.rw,
    agama: r.agama,
    is_parent: r.is_parent,
    status: r.status,
    housing_complex_id: r.housing_complex_id,
    housing_name: r.housing_name,
    kecamatan: r.kecamatan,
    kelurahan: r.kelurahan,
    kode_pos: r.kode_pos,
    alamat_lengkap: formatAlamatLengkap({
      nama_jalan: r.nama_jalan,
      blok_rumah: r.blok_rumah,
      rt: r.rt,
      rw: r.rw,
      kelurahan: r.kelurahan,
      kecamatan: r.kecamatan,
      kode_pos: r.kode_pos,
    }),
    foto_profil_url: resolvePhotoUrl(r.foto_profil_url),
    occupancy_type: r.occupancy_type,
    residence_start_date: toDateString(r.residence_start_date)!,
    residence_end_date: toDateString(r.residence_end_date),
    owner_resident_id: r.owner_resident_id,
    owner_name: r.owner_name,
    housing_unit_id: r.housing_unit_id,
    allows_multiple_kk: r.allows_multiple_kk ?? false,
  }
}

export async function updateResident(
  admin: AdminTenantContext,
  id: string,
  patch: Partial<{
    nama: string
    no_hp: string
    nama_jalan: string
    blok_rumah: string
    rt: string
    rw: string
    agama: string
    is_parent: boolean
    status: 'active' | 'inactive'
    password: string
    occupancy_type: OccupancyType
    residence_start_date: string
    residence_end_date: string | null
    owner_resident_id: string | null
  }>,
) {
  const { rows: existing } = await query<{
    no_kk: string
    housing_complex_id: string
    status: string
    occupancy_type: string
    is_parent: boolean
    owner_resident_id: string | null
  }>(
    `SELECT no_kk, housing_complex_id::text, status::text, occupancy_type::text,
            is_parent, owner_resident_id::text
     FROM residents WHERE id = $1`,
    [id],
  )
  if (!existing[0]) throw new NotFoundError('Warga tidak ditemukan')
  resolveHousingComplexId(admin, existing[0].housing_complex_id)

  if (patch.status === 'inactive' && existing[0].status === 'active') {
    return setResidentAccountStatus(admin, id, 'inactive')
  }
  if (patch.status === 'active' && existing[0].status === 'inactive') {
    await query(
      `UPDATE residents SET status = 'active', deleted_at = NULL, updated_at = NOW() WHERE id = $1`,
      [id],
    )
    delete patch.status
  }

  if (patch.no_hp && !/^08\d{8,11}$/.test(patch.no_hp.replace(/\s/g, ''))) {
    throw new ValidationError('No. HP format Indonesia (contoh: 081234567890)')
  }

  const nextIsParent =
    patch.is_parent !== undefined ? patch.is_parent : existing[0].is_parent
  const nextOccupancyEarly =
    patch.occupancy_type !== undefined
      ? patch.occupancy_type
      : (existing[0].occupancy_type as OccupancyType)
  if (nextOccupancyEarly === 'kontrak' && nextIsParent) {
    throw new ValidationError('Warga kontrak tidak dapat menjadi kepala keluarga (wali)')
  }

  if (patch.is_parent === true) {
    await query(
      `UPDATE residents SET is_parent = FALSE, can_view_billing = FALSE, updated_at = NOW()
       WHERE housing_complex_id = $1 AND no_kk = $2 AND id <> $3 AND is_parent = TRUE`,
      [existing[0].housing_complex_id, existing[0].no_kk, id],
    )
    await query(
      `UPDATE residents SET is_parent = TRUE, can_view_billing = TRUE, updated_at = NOW()
       WHERE id = $1`,
      [id],
    )
  }

  const fields: string[] = []
  const params: unknown[] = [id]
  let i = 2

  if (
    patch.occupancy_type !== undefined ||
    patch.residence_start_date !== undefined ||
    patch.residence_end_date !== undefined ||
    patch.owner_resident_id !== undefined
  ) {
    const nextType = (patch.occupancy_type ?? existing[0].occupancy_type) as OccupancyType
    const { rows: cur } = await query<{
      residence_start_date: Date
      residence_end_date: Date | null
    }>(
      `SELECT residence_start_date, residence_end_date FROM residents WHERE id = $1`,
      [id],
    )
    const row = cur[0]
    if (!row) throw new NotFoundError('Warga tidak ditemukan')
    const nextStart = patch.residence_start_date ?? toDateString(row.residence_start_date)!
    let nextEnd: string | null
    if (nextType === 'pemilik') {
      nextEnd = null
    } else if (patch.residence_end_date !== undefined) {
      nextEnd = patch.residence_end_date
    } else {
      nextEnd = toDateString(row.residence_end_date)
    }
    assertOccupancyDates(nextType, nextStart, nextEnd)

    const ownerInput =
      patch.owner_resident_id !== undefined
        ? patch.owner_resident_id
        : nextType === 'kontrak'
          ? existing[0].owner_resident_id
          : null
    const nextOwner = await resolveKontrakOwner(
      existing[0].housing_complex_id,
      nextType,
      ownerInput,
      id,
    )

    fields.push(`occupancy_type = $${i++}::resident_occupancy_type`)
    params.push(nextType)
    fields.push(`residence_start_date = $${i++}::date`)
    params.push(nextStart)
    fields.push(`residence_end_date = $${i++}::date`)
    params.push(nextEnd)
    fields.push(`owner_resident_id = $${i++}`)
    params.push(nextOwner)
    delete patch.occupancy_type
    delete patch.residence_start_date
    delete patch.residence_end_date
    delete patch.owner_resident_id
  }

  const scalarPatch: Record<string, unknown> = { ...patch }
  delete scalarPatch.is_parent
  delete scalarPatch.password

  for (const [key, val] of Object.entries(scalarPatch)) {
    if (val === undefined) continue
    if (key === 'agama') {
      fields.push(`agama = $${i++}::religion_type`)
    } else if (key === 'no_hp') {
      fields.push(`no_hp = $${i++}`)
      params.push(String(val).replace(/\s/g, ''))
      continue
    } else {
      fields.push(`${key} = $${i++}`)
    }
    params.push(typeof val === 'string' ? val.trim() : val)
  }

  if (patch.password && patch.password.length >= 8) {
    const hash = await bcrypt.hash(patch.password, 10)
    fields.push(`password_hash = $${i++}`)
    params.push(hash)
  } else if (patch.password !== undefined && patch.password.length > 0 && patch.password.length < 8) {
    throw new ValidationError('Password baru minimal 8 karakter')
  }

  if (fields.length) {
    fields.push('updated_at = NOW()')
    await query(`UPDATE residents SET ${fields.join(', ')} WHERE id = $1`, params)
  }

  return getResidentForAdmin(admin, id)
}

export async function resetResidentPassword(
  admin: AdminTenantContext,
  id: string,
  newPassword: string,
) {
  if (newPassword.length < 8) {
    throw new ValidationError('Password minimal 8 karakter')
  }
  const { rows } = await query<{ housing_complex_id: string }>(
    `SELECT housing_complex_id::text FROM residents WHERE id = $1`,
    [id],
  )
  if (!rows[0]) throw new NotFoundError('Warga tidak ditemukan')
  resolveHousingComplexId(admin, rows[0].housing_complex_id)

  const hash = await bcrypt.hash(newPassword, 10)
  await query(
    `UPDATE residents SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [id, hash],
  )
  return getResidentForAdmin(admin, id)
}

export async function setResidentAccountStatus(
  admin: AdminTenantContext,
  id: string,
  status: 'active' | 'inactive',
) {
  const { rows } = await query<{
    is_parent: boolean
    housing_complex_id: string
    status: string
    occupancy_type: string
  }>(
    `SELECT is_parent, housing_complex_id::text, status::text, occupancy_type::text
     FROM residents WHERE id = $1`,
    [id],
  )
  if (!rows[0]) throw new NotFoundError('Warga tidak ditemukan')
  resolveHousingComplexId(admin, rows[0].housing_complex_id)

  if (status === 'inactive') {
    if (rows[0].is_parent) {
      throw new ForbiddenError(
        'Tidak dapat menonaktifkan kepala keluarga. Tunjuk wali baru terlebih dahulu.',
      )
    }
    if (rows[0].occupancy_type === 'pemilik') {
      const { rows: kontrakDeps } = await query<{ n: number }>(
        `SELECT 1 AS n FROM residents
         WHERE owner_resident_id = $1 AND status = 'active' AND deleted_at IS NULL
         LIMIT 1`,
        [id],
      )
      if (kontrakDeps.length) {
        throw new BadRequestError(
          'Pemilik masih memiliki warga kontrak aktif. Pindahkan atau nonaktifkan warga kontrak terlebih dahulu.',
        )
      }
    }
    await query(
      `UPDATE residents SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
      [id],
    )
  } else {
    await query(
      `UPDATE residents SET status = 'active', deleted_at = NULL, updated_at = NOW() WHERE id = $1`,
      [id],
    )
  }

  return getResidentForAdmin(admin, id)
}

export async function softDeleteResident(admin: AdminTenantContext, id: string) {
  const { rows } = await query<{ is_parent: boolean; no_kk: string; housing_complex_id: string }>(
    `SELECT is_parent, no_kk, housing_complex_id::text FROM residents WHERE id = $1 AND status = 'active'`,
    [id],
  )
  if (!rows[0]) throw new NotFoundError('Warga tidak ditemukan')
  resolveHousingComplexId(admin, rows[0].housing_complex_id)
  if (rows[0].is_parent) {
    throw new ForbiddenError(
      'Tidak dapat menonaktifkan kepala keluarga. Tunjuk wali baru terlebih dahulu.',
    )
  }

  await query(
    `UPDATE residents SET status = 'inactive', deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [id],
  )
  return { id, status: 'inactive' }
}

export async function generateMonthlyBills(
  admin: AdminTenantContext,
  periodYear: number,
  periodMonth: number,
  housingFilter?: string | null,
) {
  const housingId = resolveHousingComplexId(admin, housingFilter ?? admin.housing_complex_id)
  await assertHousingExists(housingId)
  const label = `TAGIHAN ${new Date(periodYear, periodMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}`
  const dueDate = new Date(periodYear, periodMonth, 10)

  const { rows: period } = await query<{ id: string }>(
    `INSERT INTO billing_periods (housing_complex_id, period_year, period_month, label, due_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (housing_complex_id, period_year, period_month) DO UPDATE SET label = EXCLUDED.label
     RETURNING id`,
    [housingId, periodYear, periodMonth, label, dueDate.toISOString().slice(0, 10)],
  )

  const periodId = period[0]?.id
  if (!periodId) throw new BadRequestError('Gagal membuat periode')

  const { rows: families } = await query<{ no_kk: string }>(
    `SELECT DISTINCT no_kk FROM residents
     WHERE status = 'active' AND housing_complex_id = $1`,
    [housingId],
  )

  let created = 0
  for (const f of families) {
    const { rowCount } = await query(
      `INSERT INTO billings (housing_complex_id, no_kk, period_id, total_amount, status)
       VALUES ($1, $2, $3, 250000, 'unpaid')
       ON CONFLICT (housing_complex_id, no_kk, period_id) DO NOTHING`,
      [housingId, f.no_kk, periodId],
    )
    if (rowCount) {
      const { rows: bill } = await query<{ id: string }>(
        `SELECT id FROM billings WHERE housing_complex_id = $1 AND no_kk = $2 AND period_id = $3`,
        [housingId, f.no_kk, periodId],
      )
      const billId = bill[0]?.id
      if (billId) {
        const { rows: existingLines } = await query<{ n: number }>(
          `SELECT COUNT(*)::int AS n FROM billing_line_items WHERE billing_id = $1`,
          [billId],
        )
        if ((existingLines[0]?.n ?? 0) === 0) {
          await query(
            `INSERT INTO billing_line_items (billing_id, item_name, amount, sort_order) VALUES
             ($1, 'Keamanan', 100000, 1),
             ($1, 'Kebersihan', 100000, 2),
             ($1, 'Kas RT', 50000, 3)`,
            [billId],
          )
        }
      }
      created++
    }
  }

  return { period_id: periodId, bills_created: created }
}

export async function listPendingProofs(admin: AdminTenantContext, housingFilter?: string | null) {
  const housingId = resolveHousingFilter(admin, housingFilter)
  const housingSql = housingId ? ' AND r.housing_complex_id = $1' : ''
  const params: unknown[] = housingId ? [housingId] : []

  const { rows } = await query<{
    proof_id: string
    billing_id: string
    resident_name: string
    no_kk: string
    amount: string
    file_path: string
    created_at: Date
  }>(
    `SELECT pp.id AS proof_id, pp.billing_id, r.nama AS resident_name, r.no_kk,
            b.total_amount::text AS amount, pp.file_path, pp.created_at
     FROM payment_proofs pp
     JOIN billings b ON b.id = pp.billing_id
     JOIN residents r ON r.id = pp.resident_id
     WHERE pp.status = 'pending'${housingSql}
     ORDER BY pp.created_at ASC`,
    params,
  )

  return rows.map((r) => ({
    proof_id: r.proof_id,
    billing_id: r.billing_id,
    resident_name: r.resident_name,
    no_kk: r.no_kk,
    amount: Number(r.amount),
    file_path: r.file_path,
    submitted_at: r.created_at.toISOString(),
  }))
}

export async function approvePayment(
  adminCtx: AdminTenantContext,
  proofId: string,
  adminId: string,
) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: proofCheck } = await client.query<{ billing_id: string; housing_complex_id: string }>(
      `SELECT pp.billing_id, r.housing_complex_id::text
       FROM payment_proofs pp
       JOIN billings b ON b.id = pp.billing_id
       JOIN residents r ON r.id = pp.resident_id
       WHERE pp.id = $1 AND pp.status = 'pending'`,
      [proofId],
    )
    if (!proofCheck[0]) throw new NotFoundError('Bukti pembayaran tidak ditemukan')
    resolveHousingComplexId(adminCtx, proofCheck[0].housing_complex_id)

    const { rows } = await client.query<{ billing_id: string }>(
      `UPDATE payment_proofs
       SET status = 'approved', reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING billing_id`,
      [proofId, adminId],
    )
    const billingId = rows[0]?.billing_id
    if (!billingId) throw new NotFoundError('Bukti pembayaran tidak ditemukan')

    await client.query(
      `UPDATE billings SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [billingId],
    )
    await client.query('COMMIT')
    return { billing_id: billingId, status: 'paid' }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

