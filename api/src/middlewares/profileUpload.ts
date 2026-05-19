import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import sharp from 'sharp'
import { env } from '../config/env.js'
import { BadRequestError } from '../utils/errors.js'

const profileDir = path.join(path.resolve(env.UPLOAD_DIR), 'profile')
fs.mkdirSync(profileDir, { recursive: true })

const storage = multer.memoryStorage()

export const profilePhotoUpload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
    if (!ok) {
      cb(new Error('Hanya JPG, PNG, atau WebP'))
      return
    }
    cb(null, true)
  },
})

export async function processProfilePhoto(buffer: Buffer): Promise<{
  filename: string
  relativePath: string
}> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (w < 200 || h < 200) {
    throw new BadRequestError('Foto minimal 200×200 piksel')
  }

  const filename = `avatar-${Date.now()}.jpg`
  const absolute = path.join(profileDir, filename)

  await sharp(buffer)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88 })
    .toFile(absolute)

  return { filename, relativePath: `uploads/profile/${filename}` }
}
