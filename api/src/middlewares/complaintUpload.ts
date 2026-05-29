import fs from 'node:fs'
import path from 'node:path'
import type { Request } from 'express'
import multer from 'multer'
import { env } from '../config/env.js'

export const COMPLAINT_MAX_TOTAL_BYTES = 10 * 1024 * 1024
export const COMPLAINT_MAX_FILES = 8

const uploadRoot = path.resolve(env.UPLOAD_DIR)
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadRoot, 'complaints')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext =
      file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/webp'
          ? '.webp'
          : file.mimetype === 'application/pdf'
            ? '.pdf'
            : '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.mimetype)) {
    cb(new Error('Lampiran hanya JPG, PNG, WebP, atau PDF'))
    return
  }
  cb(null, true)
}

export const complaintUpload = multer({
  storage,
  limits: { fileSize: COMPLAINT_MAX_TOTAL_BYTES, files: COMPLAINT_MAX_FILES },
  fileFilter,
})

export function complaintStoredPath(absolutePath: string): string {
  const rel = path.relative(path.resolve(env.UPLOAD_DIR), absolutePath).replace(/\\/g, '/')
  return rel.startsWith('uploads/') ? rel : `uploads/${rel}`
}
