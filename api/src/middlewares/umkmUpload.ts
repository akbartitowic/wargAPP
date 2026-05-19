import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import sharp from 'sharp'
import { env } from '../config/env.js'
import { BadRequestError } from '../utils/errors.js'

const umkmDir = path.join(path.resolve(env.UPLOAD_DIR), 'umkm')
fs.mkdirSync(umkmDir, { recursive: true })

export const umkmImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
    if (!ok) {
      cb(new Error('Hanya JPG, PNG, atau WebP'))
      return
    }
    cb(null, true)
  },
})

export async function processUmkmImage(
  buffer: Buffer,
  variant: 'shop' | 'product',
): Promise<{ filename: string; relativePath: string }> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (w < 320 || h < 320) {
    throw new BadRequestError('Gambar minimal 320×320 piksel')
  }

  const prefix = variant === 'shop' ? 'shop' : 'product'
  const filename = `${prefix}-${Date.now()}.jpg`
  const absolute = path.join(umkmDir, filename)

  if (variant === 'shop') {
    await sharp(buffer)
      .resize(1200, 675, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toFile(absolute)
  } else {
    await sharp(buffer)
      .resize(800, 800, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toFile(absolute)
  }

  return { filename, relativePath: `uploads/umkm/${filename}` }
}
