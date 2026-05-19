export const OCCUPANCY_OPTIONS = [
  { value: 'pemilik', label: 'Pemilik' },
  { value: 'kontrak', label: 'Kontrak' },
] as const

export type OccupancyType = (typeof OCCUPANCY_OPTIONS)[number]['value']

export function occupancyLabel(type: string): string {
  if (type === 'kontrak') return 'Kontrak'
  if (type === 'pemilik') return 'Pemilik'
  return type
}

export function formatResidenceDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function validateOccupancyDates(
  occupancyType: OccupancyType,
  start: string,
  end: string,
): string | null {
  if (!start) return 'Tanggal mulai tinggal wajib diisi.'
  if (occupancyType === 'kontrak' && !end) {
    return 'Tanggal akhir tinggal wajib untuk warga kontrak.'
  }
  if (end && end < start) {
    return 'Tanggal akhir tidak boleh sebelum tanggal mulai.'
  }
  return null
}
