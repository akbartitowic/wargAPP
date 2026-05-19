import type { Response } from 'express'

export type ApiSuccess<T> = {
  status: 'success'
  data: T
}

export type ApiErrorBody = {
  status: 'error'
  message: string
  errors?: unknown
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { status: 'success', data }
  res.status(statusCode).json(body)
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
): void {
  const body: ApiErrorBody = { status: 'error', message, errors }
  res.status(statusCode).json(body)
}
