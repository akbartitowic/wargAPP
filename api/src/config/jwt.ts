import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from './env.js'
import type { AdminRole } from '../models/admin.model.js'
import type { AdminTokenPayload, ResidentTokenPayload } from '../types/express.js'

export function signResidentToken(payload: Omit<ResidentTokenPayload, 'type'>): string {
  const body: ResidentTokenPayload = { ...payload, type: 'resident' }
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] }
  return jwt.sign(body, env.JWT_SECRET, opts)
}

export function signAdminToken(payload: Omit<AdminTokenPayload, 'type'>): string {
  const body: AdminTokenPayload = { ...payload, type: 'admin' }
  const opts: SignOptions = {
    expiresIn: env.JWT_ADMIN_EXPIRES_IN as SignOptions['expiresIn'],
  }
  return jwt.sign(body, env.JWT_SECRET, opts)
}

export function verifyResidentToken(token: string): ResidentTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as ResidentTokenPayload
  if (decoded.type !== 'resident') throw new Error('Invalid token type')
  return decoded
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload
  if (decoded.type !== 'admin') throw new Error('Invalid token type')
  return decoded
}

export type { AdminRole }
