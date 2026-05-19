export type AlamatParts = {
  nama_jalan: string
  blok_rumah: string
  rt: string
  rw: string
  kelurahan: string
  kecamatan: string
  kode_pos: string
}

export function formatAlamatLengkap(parts: AlamatParts): string {
  const jalan = parts.nama_jalan.trim()
  const blok = parts.blok_rumah.trim()
  const rt = parts.rt.trim()
  const rw = parts.rw.trim()
  const kel = parts.kelurahan.trim()
  const kec = parts.kecamatan.trim()
  const kode = parts.kode_pos.trim()

  const unit = [jalan, blok ? `Blok ${blok}` : '', rt && rw ? `RT ${rt}/RW ${rw}` : '']
    .filter(Boolean)
    .join(', ')

  const wilayah = [kel, kec, kode].filter(Boolean).join(', ')
  return [unit, wilayah].filter(Boolean).join(', ') || '—'
}
