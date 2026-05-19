import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { pool } from '../src/config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(128) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(
    `INSERT INTO schema_migrations (name) VALUES ('001_initial_schema.sql'), ('002_seed_dev.sql')
     ON CONFLICT DO NOTHING`,
  )

  await pool.query(`ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'housing_admin'`)

  const file = path.join(__dirname, '../db/migrations/003_multi_tenancy.sql')
  await pool.query(fs.readFileSync(file, 'utf8'))
  await pool.query(
    `INSERT INTO schema_migrations (name) VALUES ('003_multi_tenancy.sql') ON CONFLICT DO NOTHING`,
  )
  console.log('Migration 003_multi_tenancy.sql applied.')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
