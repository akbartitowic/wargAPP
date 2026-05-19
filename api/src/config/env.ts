import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('30d'),
  JWT_ADMIN_EXPIRES_IN: z.string().default('8h'),
  UPLOAD_DIR: z.string().default('./storage'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(2 * 1024 * 1024),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  /** URL publik untuk link file upload (gambar berita, bukti). */
  PUBLIC_BASE_URL: z.string().default('http://localhost:3000'),
  /** `false` = tampilkan NIK/KK utuh (default di development). */
  MASK_SENSITIVE_IDS: z
    .enum(['true', 'false', '1', '0'])
    .optional(),
})

export const env = envSchema.parse(process.env)

export const corsOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim())

export function publicUploadUrl(relativePath: string): string {
  const base = env.PUBLIC_BASE_URL.replace(/\/$/, '')
  const rel = relativePath.replace(/^\//, '')
  return `${base}/${rel}`
}
