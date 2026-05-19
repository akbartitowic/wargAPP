import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { pool } from '../src/config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const file = path.join(__dirname, '../db/migrations/004_address_fields.sql')
  await pool.query(fs.readFileSync(file, 'utf8'))
  await pool.query(
    `INSERT INTO schema_migrations (name) VALUES ('004_address_fields.sql') ON CONFLICT DO NOTHING`,
  )
  console.log('Migration 004_address_fields.sql applied.')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
