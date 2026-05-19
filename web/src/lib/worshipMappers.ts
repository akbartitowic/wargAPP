import type { WorshipPlaceRow, WorshipScheduleRow } from '@/data/worship'

type ApiSchedule = {
  id: string
  type: string
  label: string
  time: string
  day_of_week: number | null
  place_name: string
  address: string | null
  latitude: number
  longitude: number
}

type ApiPlace = {
  id: string
  name: string
  type: string
  address: string | null
  latitude: number
  longitude: number
}

export function groupSchedulesByPlace(rows: ApiSchedule[]): WorshipScheduleRow[] {
  const map = new Map<string, WorshipScheduleRow>()

  for (const r of rows) {
    const key = `${r.place_name}|${r.address ?? ''}`
    let row = map.get(key)
    if (!row) {
      row = {
        id: r.id,
        religions: 'all',
        placeName: r.place_name,
        address: r.address ?? '—',
        latitude: r.latitude,
        longitude: r.longitude,
        entries: [],
      }
      map.set(key, row)
    }
    row.entries.push({ label: r.label, time: `${r.time} WIB` })
  }

  return [...map.values()]
}

export function mapApiPlaces(rows: ApiPlace[]): WorshipPlaceRow[] {
  return rows.map((p) => ({
    id: p.id,
    religions: 'all',
    name: p.name,
    detail: p.address ?? p.type,
    latitude: p.latitude,
    longitude: p.longitude,
  }))
}
