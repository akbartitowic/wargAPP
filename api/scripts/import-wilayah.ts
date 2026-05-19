import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { pool } from '../src/config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../data/wilayah')

const SOURCES = {
  wilayah: {
    url: 'https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql',
    file: 'wilayah.sql',
    table: 'wilayah',
    columns: ['kode', 'nama'] as const,
  },
  kodepos: {
    url: 'https://raw.githubusercontent.com/cahyadsn/wilayah_kodepos/master/db/wilayah_kodepos.sql',
    file: 'wilayah_kodepos.sql',
    table: 'wilayah_kodepos',
    columns: ['kode', 'kodepos'] as const,
  },
}

function unescapeSql(s: string): string {
  return s.replace(/''/g, "'")
}

/** Parse VALUES tuples from MySQL INSERT dumps. */
function parseInsertTuples(sql: string): string[][] {
  const rows: string[][] = []
  const re = /\('([^']*(?:''[^']*)*)'\s*(?:,\s*'([^']*(?:''[^']*)*)')?\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(sql)) !== null) {
    const cols = [unescapeSql(m[1]), m[2] ? unescapeSql(m[2]) : ''].filter((c) => c !== '')
    if (cols.length) rows.push(cols)
  }
  return rows
}

function wilayahLevel(kode: string): number {
  return kode.split('.').length
}

function parentKode(kode: string): string | null {
  const parts = kode.split('.')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('.')
}

async function ensureFile(name: keyof typeof SOURCES): Promise<string> {
  const spec = SOURCES[name]
  const dest = path.join(DATA_DIR, spec.file)
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log(`Mengunduh ${spec.url} …`)
    const res = await fetch(spec.url)
    if (!res.ok) throw new Error(`Gagal unduh ${spec.url}: ${res.status}`)
    fs.writeFileSync(dest, await res.text())
  }
  return dest
}

async function importWilayah(filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf8')
  const tuples = parseInsertTuples(sql)
  console.log(`Wilayah: ${tuples.length} baris`)

  const batchSize = 500
  await pool.query('TRUNCATE wilayah_kodepos, wilayah RESTART IDENTITY CASCADE')

  for (let i = 0; i < tuples.length; i += batchSize) {
    const batch = tuples.slice(i, i + batchSize)
    const values: unknown[] = []
    const placeholders: string[] = []
    let p = 1
    for (const [kode, nama] of batch) {
      const level = wilayahLevel(kode)
      const parent = parentKode(kode)
      placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++})`)
      values.push(kode, nama, level, parent)
    }
    await pool.query(
      `INSERT INTO wilayah (kode, nama, level, parent_kode) VALUES ${placeholders.join(', ')}
       ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama, level = EXCLUDED.level, parent_kode = EXCLUDED.parent_kode`,
      values,
    )
    if ((i + batchSize) % 5000 === 0 || i + batchSize >= tuples.length) {
      console.log(`  … ${Math.min(i + batchSize, tuples.length)} / ${tuples.length}`)
    }
  }
}

async function importKodepos(filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf8')
  const tuples = parseInsertTuples(sql)
  console.log(`Kodepos: ${tuples.length} baris`)

  const batchSize = 500
  for (let i = 0; i < tuples.length; i += batchSize) {
    const batch = tuples.slice(i, i + batchSize)
    const values: unknown[] = []
    const placeholders: string[] = []
    let p = 1
    for (const [kode, kodepos] of batch) {
      placeholders.push(`($${p++}, $${p++})`)
      values.push(kode, kodepos)
    }
    await pool.query(
      `INSERT INTO wilayah_kodepos (kode, kodepos) VALUES ${placeholders.join(', ')}
       ON CONFLICT (kode) DO UPDATE SET kodepos = EXCLUDED.kodepos`,
      values,
    )
    if ((i + batchSize) % 10000 === 0 || i + batchSize >= tuples.length) {
      console.log(`  … ${Math.min(i + batchSize, tuples.length)} / ${tuples.length}`)
    }
  }
}

async function linkDemoHousing() {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id::text FROM housing_complexes WHERE slug = 'perumahan-demo' LIMIT 1`,
  )
  const housingId = rows[0]?.id
  if (!housingId) return

  const { rows: kel } = await pool.query<{ kode: string; nama: string; kodepos: string | null }>(
    `SELECT w.kode, w.nama, kp.kodepos
     FROM wilayah w
     LEFT JOIN wilayah_kodepos kp ON kp.kode = w.kode
     WHERE w.level = 4 AND w.nama ILIKE '%menteng%'
     LIMIT 1`,
  )
  const pick = kel[0]
  if (!pick) {
    console.log('Tidak ada kelurahan demo; lewati link perumahan-demo.')
    return
  }

  const { rows: kec } = await pool.query<{ nama: string }>(
    `SELECT nama FROM wilayah WHERE kode = $1`,
    [pick.kode.split('.').slice(0, 3).join('.')],
  )

  await pool.query(
    `UPDATE housing_complexes SET
       kelurahan_kode = $2,
       kelurahan = $3,
       kecamatan = $4,
       kode_pos = COALESCE($5, kode_pos)
     WHERE id = $1`,
    [housingId, pick.kode, pick.nama, kec[0]?.nama ?? 'Kecamatan Contoh', pick.kodepos ?? '10310'],
  )
  console.log(`Perumahan demo → kelurahan ${pick.kode} (${pick.nama})`)
}

async function main() {
  const wilayahFile = await ensureFile('wilayah')
  const kodeposFile = await ensureFile('kodepos')

  const { rows: cnt } = await pool.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM wilayah`)
  if (Number(cnt[0]?.n) === 0) {
    await importWilayah(wilayahFile)
  } else {
    console.log(`Wilayah: ${cnt[0]?.n} baris (lewati impor wilayah).`)
  }

  const { rows: kcnt } = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM wilayah_kodepos`,
  )
  if (Number(kcnt[0]?.n) === 0) {
    await importKodepos(kodeposFile)
  } else {
    console.log(`Kodepos: ${kcnt[0]?.n} baris (lewati impor kodepos).`)
  }

  await linkDemoHousing()
  console.log('Import wilayah selesai.')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
