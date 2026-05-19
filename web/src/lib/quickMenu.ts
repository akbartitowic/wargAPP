import type { QuickMenuKey } from '@/store/sessionStore'

const QUICK_MENU_KEYS: QuickMenuKey[] = [
  'ipl',
  'umkm',
  'fasilitas_umum',
  'retail',
  'lapor',
  'informasi',
]

const LEGACY_WORSHIP_KEYS = new Set(['jadwal_ibadah', 'lokasi_ibadah'])

function normalizeQuickMenuKey(key: string): QuickMenuKey | null {
  if (LEGACY_WORSHIP_KEYS.has(key)) return 'fasilitas_umum'
  return QUICK_MENU_KEYS.includes(key as QuickMenuKey) ? (key as QuickMenuKey) : null
}

export function normalizeQuickMenuOrder(keys: string[]): QuickMenuKey[] {
  const out: QuickMenuKey[] = []
  for (const raw of keys) {
    const k = normalizeQuickMenuKey(raw)
    if (!k || out.includes(k)) continue
    out.push(k)
  }
  return out.length ? out : ['ipl', 'umkm', 'fasilitas_umum']
}
