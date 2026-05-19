import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import sharp from 'sharp'
import { env } from '../config/env.js'
import { BadRequestError } from '../utils/errors.js'

const newsDir = path.join(path.resolve(env.UPLOAD_DIR), 'news')
fs.mkdirSync(newsDir, { recursive: true })

const storage = multer.memoryStorage()

export const newsHeroUpload = multer({
  storage,
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

const TARGET_RATIO = 16 / 9

export async function processNewsHeroImage(buffer: Buffer): Promise<{
  filename: string
  relativePath: string
}> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (w < 640 || h < 360) {
    throw new BadRequestError('Gambar minimal 640×360 piksel')
  }

  const ratio = w / h
  let cropW = w
  let cropH = h
  if (ratio > TARGET_RATIO) cropW = Math.round(h * TARGET_RATIO)
  else if (ratio < TARGET_RATIO) cropH = Math.round(w / TARGET_RATIO)

  const left = Math.max(0, Math.floor((w - cropW) / 2))
  const top = Math.max(0, Math.floor((h - cropH) / 2))
  const filename = `hero-${Date.now()}.jpg`
  const absolute = path.join(newsDir, filename)

  await sharp(buffer)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(1280, 720, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toFile(absolute)

  return { filename, relativePath: `uploads/news/${filename}` }
}
