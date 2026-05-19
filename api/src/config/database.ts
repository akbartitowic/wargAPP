import pg from 'pg'
import { env } from './env.js'

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
})

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err)
})

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params)
}
