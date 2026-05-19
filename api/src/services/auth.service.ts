import bcrypt from 'bcrypt'
import { signResidentToken } from '../config/jwt.js'
import { env } from '../config/env.js'
import { userRepository } from '../repositories/user.repository.js'
import { UnauthorizedError } from '../utils/errors.js'

export async function loginResident(identifier: string, password: string) {
  const { rows } = await userRepository.findByIdentifier(identifier)
  const user = rows[0]
  if (!user) {
    throw new UnauthorizedError('NIK/No HP atau password salah')
  }
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    throw new UnauthorizedError('NIK/No HP atau password salah')
  }
  const token = signResidentToken({
    sub: user.id,
    nik: user.nik,
    no_kk: user.no_kk,
  })
  return {
    access_token: token,
    token_type: 'Bearer' as const,
    expires_in: env.JWT_EXPIRES_IN,
  }
}
