import { env } from '../config/env.js'

/** Di lokal (development) NIK/KK tidak di-mask kecuali MASK_SENSITIVE_IDS=true. */
export function shouldMaskSensitiveIds(): boolean {
  const override = env.MASK_SENSITIVE_IDS
  if (override !== undefined) {
    return override === 'true' || override === '1'
  }
  return env.NODE_ENV !== 'development'
}

/** Mask 16-digit NIK/KK: 6 digit awal + ****** + 4 digit akhir */
export function maskSensitiveId(value: string): string {
  if (!shouldMaskSensitiveIds()) {
    return value
  }
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 16) {
    return '*'.repeat(Math.min(digits.length, 16) || 16)
  }
  return `${digits.slice(0, 6)}******${digits.slice(-4)}`
}
