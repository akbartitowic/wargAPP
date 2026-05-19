import type { Request, Response } from 'express'
import { loginSchema } from '../validators/auth.validator.js'
import * as authService from '../services/auth.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Payload tidak valid', parsed.error.flatten().fieldErrors)
  }
  const data = await authService.loginResident(parsed.data.identifier, parsed.data.password)
  sendSuccess(res, data)
}
