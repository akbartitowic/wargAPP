import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors.js'
import { sendError } from '../utils/response.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.errors)
    return
  }
  if (err instanceof ZodError) {
    sendError(res, 422, 'Validasi gagal', err.flatten().fieldErrors)
    return
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 400, 'Ukuran file melebihi batas (maks. 2MB)')
      return
    }
    sendError(res, 400, err.message)
    return
  }
  if (err instanceof Error && err.message.includes('Hanya JPG')) {
    sendError(res, 400, err.message)
    return
  }
  console.error(err)
  sendError(res, 500, 'Terjadi kesalahan pada server')
}
