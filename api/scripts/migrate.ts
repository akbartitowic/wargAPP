import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { pool } from '../src/config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(128) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function isApplied(name: string): Promise<boolean> {
  const { rows } = await pool.query<{ n: number }>(
    `SELECT 1 AS n FROM schema_migrations WHERE name = $1`,
    [name],
  )
  return rows.length > 0
}

async function markApplied(name: string) {
  await pool.query(`INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [
    name,
  ])
}

async function main() {
  await ensureMigrationsTable()
  const dir = path.join(__dirname, '../db/migrations')
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (await isApplied(file)) {
      console.log(`Skip (sudah diterapkan): ${file}`)
      continue
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8')
    await pool.query(sql)
    await markApplied(file)
    console.log(`Diterapkan: ${file}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
