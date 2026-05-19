const AGAMA_OPTIONS = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
  'Lainnya',
] as const

export type CreateResidentPayload = {
  nik: string
  no_kk: string
  nama: string
  no_hp: string
  blok_rumah: string
  agama: (typeof AGAMA_OPTIONS)[number]
  password: string
  is_parent: boolean
}

function onlyDigits(value: FormDataEntryValue | null): string {
  return String(value ?? '').replace(/\D/g, '')
}

export function parseCreateResidentForm(fd: FormData): CreateResidentPayload {
  const agamaRaw = String(fd.get('agama') ?? 'Islam')
  const agama = AGAMA_OPTIONS.includes(agamaRaw as (typeof AGAMA_OPTIONS)[number])
    ? (agamaRaw as (typeof AGAMA_OPTIONS)[number])
    : 'Islam'

  return {
    nik: onlyDigits(fd.get('nik')),
    no_kk: onlyDigits(fd.get('no_kk')),
    nama: String(fd.get('nama') ?? '').trim(),
    no_hp: String(fd.get('no_hp') ?? '').replace(/\s/g, ''),
    blok_rumah: String(fd.get('blok_rumah') ?? '').trim(),
    agama,
    password: String(fd.get('password') ?? ''),
    is_parent: fd.get('is_parent') === 'on',
  }
}

export function validateCreateResidentClient(payload: CreateResidentPayload): string | null {
  if (payload.nik.length !== 16) {
    return 'NIK harus tepat 16 digit angka (tanpa spasi).'
  }
  if (payload.no_kk.length !== 16) {
    return 'No. KK harus tepat 16 digit angka (tanpa spasi).'
  }
  if (payload.nama.length < 2) return 'Nama minimal 2 karakter.'
  if (!/^08\d{8,11}$/.test(payload.no_hp)) {
    return 'No. HP tidak valid. Gunakan format 08xxxxxxxxxx.'
  }
  if (!payload.blok_rumah) return 'Blok rumah wajib diisi.'
  if (payload.password.length < 8) return 'Password minimal 8 karakter.'
  return null
}

export { AGAMA_OPTIONS }
