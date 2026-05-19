import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().min(10, 'NIK atau No HP wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const profileUpdateSchema = z
  .object({
    no_hp: z
      .string()
      .regex(/^08\d{8,11}$/, 'Format No HP tidak valid (contoh: 081234567890)')
      .optional(),
    foto_profil_url: z.string().url().optional(),
  })
  .refine((d) => d.no_hp != null || d.foto_profil_url != null, {
    message: 'Minimal satu field (no_hp atau foto_profil_url) harus diisi',
  })
