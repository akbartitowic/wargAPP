import { query } from '../config/database.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

export type WilayahRow = {
  kode: string
  nama: string
  level: number
  parent_kode: string | null
  kodepos?: string | null
}

export type WilayahChain = {
  provinsi: WilayahRow | null
  kabupaten: WilayahRow | null
  kecamatan: WilayahRow | null
  kelurahan: WilayahRow | null
  kode_pos: string | null
}

const MAX_LIMIT = 10

function clampLimit(limit?: number): number {
  if (!limit || limit < 1) return MAX_LIMIT
  return Math.min(limit, MAX_LIMIT)
}

export async function searchWilayah(opts: {
  parent?: string | null
  q?: string
  limit?: number
}): Promise<WilayahRow[]> {
  const limit = clampLimit(opts.limit)
  const parent = opts.parent?.trim() || null
  const q = opts.q?.trim() ?? ''

  const params: unknown[] = []
  let where = ''

  if (parent) {
    params.push(parent)
    where = `w.parent_kode = $${params.length}`
  } else {
    where = 'w.level = 1'
  }

  if (q.length >= 1) {
    params.push(`%${q}%`)
    where += ` AND w.nama ILIKE $${params.length}`
  }

  params.push(limit)

  const { rows } = await query<WilayahRow & { kodepos: string | null }>(
    `SELECT w.kode, w.nama, w.level, w.parent_kode, kp.kodepos
     FROM wilayah w
     LEFT JOIN wilayah_kodepos kp ON kp.kode = w.kode
     WHERE ${where}
     ORDER BY w.nama ASC
     LIMIT $${params.length}`,
    params,
  )

  return rows.map(({ kode, nama, level, parent_kode, kodepos }) => ({
    kode,
    nama,
    level,
    parent_kode,
    kodepos,
  }))
}

export async function getWilayahByKode(kode: string): Promise<WilayahRow | null> {
  const { rows } = await query<WilayahRow & { kodepos: string | null }>(
    `SELECT w.kode, w.nama, w.level, w.parent_kode, kp.kodepos
     FROM wilayah w
     LEFT JOIN wilayah_kodepos kp ON kp.kode = w.kode
     WHERE w.kode = $1`,
    [kode],
  )
  const row = rows[0]
  if (!row) return null
  return {
    kode: row.kode,
    nama: row.nama,
    level: row.level,
    parent_kode: row.parent_kode,
    kodepos: row.kodepos,
  }
}

export async function getWilayahChain(kelurahanKode: string): Promise<WilayahChain> {
  const chain: WilayahRow[] = []
  let current: WilayahRow | null = await getWilayahByKode(kelurahanKode)
  if (!current) throw new NotFoundError('Kode wilayah tidak ditemukan')

  while (current) {
    chain.unshift(current)
    if (!current.parent_kode) break
    current = await getWilayahByKode(current.parent_kode)
  }

  const byLevel = (lvl: number) => chain.find((c) => c.level === lvl) ?? null
  const kelurahan = byLevel(4)
  const kecamatan = byLevel(3)
  const kabupaten = byLevel(2)
  const provinsi = byLevel(1)

  if (!kelurahan || kelurahan.level !== 4) {
    throw new ValidationError('Kode harus tingkat kelurahan/desa (level 4)')
  }

  return {
    provinsi,
    kabupaten,
    kecamatan,
    kelurahan,
    kode_pos: kelurahan.kodepos ?? null,
  }
}

export type ResolvedHousingWilayah = {
  kelurahan_kode: string
  kecamatan: string
  kelurahan: string
  kode_pos: string
}

export async function resolveKelurahanForHousing(kelurahanKode: string): Promise<ResolvedHousingWilayah> {
  const chain = await getWilayahChain(kelurahanKode)
  if (!chain.kecamatan) {
    throw new ValidationError('Data kecamatan tidak lengkap untuk kode wilayah ini')
  }
  const kodePos = chain.kode_pos?.trim()
  if (!kodePos || !/^\d{5}$/.test(kodePos)) {
    throw new ValidationError('Kode pos tidak tersedia untuk kelurahan ini')
  }

  return {
    kelurahan_kode: chain.kelurahan!.kode,
    kecamatan: chain.kecamatan.nama,
    kelurahan: chain.kelurahan!.nama,
    kode_pos: kodePos,
  }
}
