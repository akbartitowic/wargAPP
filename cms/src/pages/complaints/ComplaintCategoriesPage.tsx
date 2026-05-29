import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  createComplaintCategory,
  listComplaintCategories,
  updateComplaintCategory,
  type ComplaintCategoryRow,
} from '@/api/complaints'
import { listHousingComplexes } from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ComplaintCategoriesPage() {
  const session = getCmsSession()
  const [rows, setRows] = useState<ComplaintCategoryRow[]>([])
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const reload = useCallback(() => {
    const hid = session.is_super_admin ? filterHousing || undefined : undefined
    void listComplaintCategories(hid, true)
      .then(setRows)
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [filterHousing, session.is_super_admin])

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
        .catch(() => setHousingOptions([]))
    }
    reload()
  }, [reload, session.is_super_admin])

  useEffect(() => {
    if (session.is_super_admin) reload()
  }, [filterHousing, session.is_super_admin, reload])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    try {
      await createComplaintCategory({
        key: newKey,
        label: newLabel,
        ...(session.is_super_admin && filterHousing
          ? { housing_complex_id: filterHousing }
          : {}),
      })
      setNewKey('')
      setNewLabel('')
      reload()
      setMsg('Kategori ditambahkan.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menambah')
    }
  }

  async function toggleActive(row: ComplaintCategoryRow) {
    try {
      await updateComplaintCategory(row.id, { is_active: !row.is_active })
      reload()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal memperbarui')
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/complaints" />}>
        <ArrowLeft className="mr-1 size-4" />
        Kembali ke komplain
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Master kategori komplain</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kategori ini muncul di form komplain aplikasi warga.
        </p>
      </div>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      {session.is_super_admin ? (
        <label className="block max-w-md text-sm">
          Perumahan
          <select
            value={filterHousing}
            onChange={(e) => setFilterHousing(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          >
            <option value="">Pilih perumahan…</option>
            {housingOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah kategori</CardTitle>
        </CardHeader>
        <form onSubmit={(e) => void onAdd(e)} className="flex flex-wrap gap-2 p-6 pt-0">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="key (contoh: keamanan)"
            className="min-w-[10rem] flex-1 rounded-md border px-2 py-1.5 text-sm"
            required
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label tampilan"
            className="min-w-[10rem] flex-1 rounded-md border px-2 py-1.5 text-sm"
            required
          />
          <Button type="submit" size="sm">
            <Plus className="mr-1 size-4" />
            Tambah
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar kategori</CardTitle>
          <CardDescription>{rows.length} kategori</CardDescription>
        </CardHeader>
        <ul className="space-y-2 p-6 pt-0">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">
                  {row.key} · urutan {row.sort_order}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={row.is_active ? 'default' : 'secondary'}>
                  {row.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Button type="button" size="sm" variant="outline" onClick={() => void toggleActive(row)}>
                  {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
