import fs from 'node:fs'
import path from 'node:path'
import type { Request } from 'express'
import multer from 'multer'
import { env } from '../config/env.js'

const uploadRoot = path.resolve(env.UPLOAD_DIR)
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadRoot, 'payment-proofs')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const allowed = ['image/jpeg', 'image/png']
  if (!allowed.includes(file.mimetype)) {
    cb(new Error('Hanya file JPG atau PNG yang diperbolehkan'))
    return
  }
  cb(null, true)
}

export const paymentProofUpload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
  fileFilter,
})
