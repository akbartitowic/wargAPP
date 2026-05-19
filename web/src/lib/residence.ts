export type OccupancyType = 'pemilik' | 'kontrak'

export function occupancyLabel(type: OccupancyType | string): string {
  return type === 'kontrak' ? 'Kontrak' : 'Pemilik'
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

export function formatOccupancyStatus(
  type: OccupancyType | string,
  start: string,
  end: string | null | undefined,
): string {
  const label = occupancyLabel(type)
  if (type === 'kontrak' && end) {
    return `${label} · hingga ${formatResidenceDate(end)}`
  }
  if (start) {
    return `${label} · sejak ${formatResidenceDate(start)}`
  }
  return label
}
