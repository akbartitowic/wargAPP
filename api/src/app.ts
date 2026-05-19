import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { corsOrigins, env } from './config/env.js'
import { rootRouter } from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { sendError } from './utils/response.js'

export function createApp() {
  const app = express()

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use(
    '/uploads',
    express.static(path.resolve(env.UPLOAD_DIR), { maxAge: env.NODE_ENV === 'production' ? '7d' : 0 }),
  )

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV })
  })

  app.use('/api/v1', rootRouter)

  app.use((_req, res) => {
    sendError(res, 404, 'Endpoint tidak ditemukan')
  })

  app.use(errorHandler)

  return app
}
