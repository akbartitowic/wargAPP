import type { ResidentRow } from '@/api/admin'

export type FamilyGroup = {
  no_kk: string
  no_kk_display: string
  blok_rumah: string
  housing_name: string
  alamat_lengkap: string
  nama_jalan: string
  rt: string
  rw: string
  waliName: string
  waliId: string | null
  members: ResidentRow[]
  memberCount: number
}

export function buildFamilyGroups(rows: ResidentRow[]): FamilyGroup[] {
  const map = new Map<string, ResidentRow[]>()
  for (const r of rows) {
    const key = r.no_kk
    const list = map.get(key) ?? []
    list.push(r)
    map.set(key, list)
  }

  return [...map.entries()]
    .map(([no_kk, members]) => {
      const sorted = [...members].sort((a, b) => {
        if (a.is_parent !== b.is_parent) return a.is_parent ? -1 : 1
        return a.nama.localeCompare(b.nama, 'id')
      })
      const wali = sorted.find((m) => m.is_parent)
      const first = sorted[0]
      return {
        no_kk,
        no_kk_display: first?.no_kk ?? first?.no_kk_masked ?? '—',
        blok_rumah: first?.blok_rumah ?? '—',
        housing_name: first?.housing_name ?? '—',
        alamat_lengkap: first?.alamat_lengkap ?? '—',
        nama_jalan: wali?.nama_jalan ?? first?.nama_jalan ?? '—',
        rt: wali?.rt ?? first?.rt ?? '—',
        rw: wali?.rw ?? first?.rw ?? '—',
        waliName: wali?.nama ?? 'Belum ada wali',
        waliId: wali?.id ?? null,
        members: sorted,
        memberCount: sorted.length,
      }
    })
    .sort((a, b) => a.blok_rumah.localeCompare(b.blok_rumah, 'id'))
}

export type FamilySearchMode = 'all' | 'kk' | 'nama' | 'blok'

export function filterFamilies(
  groups: FamilyGroup[],
  query: string,
  mode: FamilySearchMode,
): FamilyGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups

  return groups.filter((g) => {
    if (mode === 'kk') {
      return g.no_kk.includes(q.replace(/\D/g, '')) || g.no_kk_display.toLowerCase().includes(q)
    }
    if (mode === 'nama') {
      return g.waliName.toLowerCase().includes(q)
    }
    if (mode === 'blok') {
      return g.blok_rumah.toLowerCase().includes(q)
    }
    return (
      g.no_kk_display.toLowerCase().includes(q) ||
      g.waliName.toLowerCase().includes(q) ||
      g.blok_rumah.toLowerCase().includes(q) ||
      g.no_kk.includes(q.replace(/\D/g, ''))
    )
  })
}
