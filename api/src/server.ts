import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './config/database.js'

const app = createApp()

async function main() {
  try {
    await pool.query('SELECT 1')
    console.log('Database connected')
  } catch (e) {
    console.warn('Database not reachable — start Postgres (docker compose up -d)', e)
  }

  app.listen(env.PORT, () => {
    console.log(`Warga API listening on http://localhost:${env.PORT}/api/v1`)
  })
}

void main()
