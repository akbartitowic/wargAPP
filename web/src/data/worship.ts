import type { Religion } from '@/store/sessionStore'

export type WorshipScheduleRow = {
  id: string
  /** Tampil jika cocok dengan agama warga (atau semua). */
  religions: Religion[] | 'all'
  placeName: string
  address: string
  latitude: number
  longitude: number
  entries: { label: string; time: string }[]
}

export const WORSHIP_SCHEDULES: WorshipScheduleRow[] = [
  {
    id: 'masjid-ikhlas',
    religions: ['Islam'],
    placeName: 'Masjid Al-Ikhlas',
    address: 'Blok pusat komplek, dekat taman utama',
    latitude: -6.2614,
    longitude: 106.7831,
    entries: [
      { label: 'Subuh', time: '04:20 WIB' },
      { label: 'Dzuhur', time: '12:05 WIB' },
      { label: 'Ashar', time: '15:20 WIB' },
      { label: 'Maghrib', time: '18:05 WIB' },
      { label: 'Isya', time: '19:15 WIB' },
    ],
  },
  {
    id: 'gereja-hkbp',
    religions: ['Kristen', 'Katolik'],
    placeName: 'Gereja HKBP sektor timur',
    address: 'Sektor timur — 1,2 km dari gerbang utama',
    latitude: -6.259,
    longitude: 106.791,
    entries: [
      { label: 'Ibadah minggu', time: '08:00 WIB' },
      { label: 'Youth service', time: '17:00 WIB' },
    ],
  },
  {
    id: 'vihara-dharma',
    religions: ['Buddha', 'Khonghucu'],
    placeName: 'Vihara Metta',
    address: 'Cluster hijau — akses dari jalan samping',
    latitude: -6.268,
    longitude: 106.779,
    entries: [{ label: 'Perayaan Waisak (info)', time: 'Minggu pagi' }],
  },
]

export type WorshipPlaceRow = {
  id: string
  religions: Religion[] | 'all'
  name: string
  detail: string
  latitude: number
  longitude: number
}

export const WORSHIP_PLACES: WorshipPlaceRow[] = [
  {
    id: 'masjid-ikhlas',
    religions: ['Islam'],
    name: 'Masjid Al-Ikhlas',
    detail: 'Blok pusat · parkir motor sisi barat',
    latitude: -6.2614,
    longitude: 106.7831,
  },
  {
    id: 'musholla-rt',
    religions: ['Islam'],
    name: 'Musholla RT 05',
    detail: 'Blok B — jadwal imam bergilir warga',
    latitude: -6.2628,
    longitude: 106.7845,
  },
  {
    id: 'gereja-hkbp',
    religions: ['Kristen', 'Katolik'],
    name: 'Gereja HKBP sektor timur',
    detail: 'Sektor timur · parkir mobil belakang',
    latitude: -6.259,
    longitude: 106.791,
  },
  {
    id: 'pura-desa',
    religions: ['Hindu'],
    name: 'Pura Dharma Shanti (wilayah)',
    detail: 'Luar komplek ±15 menit — acara besar terjadwal',
    latitude: -6.255,
    longitude: 106.77,
  },
]

export function worshipScheduleVisibleFor(
  row: WorshipScheduleRow,
  userReligion: Religion,
): boolean {
  if (row.religions === 'all') return true
  return row.religions.includes(userReligion)
}

export function worshipPlaceVisibleFor(
  row: WorshipPlaceRow,
  userReligion: Religion,
): boolean {
  if (row.religions === 'all') return true
  return row.religions.includes(userReligion)
}
