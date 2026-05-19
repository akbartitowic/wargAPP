import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { pool } from '../src/config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const file = path.join(__dirname, '../db/migrations/005_wilayah_ref.sql')
  await pool.query(fs.readFileSync(file, 'utf8'))
  await pool.query(
    `INSERT INTO schema_migrations (name) VALUES ('005_wilayah_ref.sql') ON CONFLICT DO NOTHING`,
  )
  console.log('Migration 005_wilayah_ref.sql applied.')
  console.log('Jalankan: npm run db:import:wilayah')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
