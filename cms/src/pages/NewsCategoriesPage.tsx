import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  createNewsCategory,
  listHousingComplexes,
  listNewsCategories,
  updateNewsCategory,
  type NewsCategoryRow,
} from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function NewsCategoriesPage() {
  const session = getCmsSession()
  const [rows, setRows] = useState<NewsCategoryRow[]>([])
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const reload = useCallback(() => {
    const hid = session.is_super_admin ? filterHousing || undefined : undefined
    void listNewsCategories(hid, true)
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
      await createNewsCategory({
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

  async function toggleActive(row: NewsCategoryRow) {
    try {
      await updateNewsCategory(row.id, { is_active: !row.is_active })
      reload()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal memperbarui')
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/news" />}>
        <ArrowLeft className="mr-1 size-4" />
        Kembali ke berita
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Master kategori berita</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Label kategori ini dipakai sebagai filter chip di aplikasi warga (selain &quot;Semua&quot;).
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
          <CardDescription>
            Key dipakai internal (huruf kecil, strip). Label tampil di app.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onAdd} className="flex flex-wrap items-end gap-2 p-6 pt-0">
          <label className="text-sm">
            Key
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="kegiatan-baru"
              required
              className="mt-1 block w-40 rounded-md border px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <label className="text-sm">
            Label (tampilan FE)
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Kegiatan Baru"
              required
              className="mt-1 block w-48 rounded-md border px-2 py-1.5"
            />
          </label>
          <Button type="submit">
            <Plus className="mr-1 size-4" />
            Tambah
          </Button>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategori terdaftar</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">Urutan</th>
                <th className="pb-2 pr-3">Key</th>
                <th className="pb-2 pr-3">Label (FE)</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60">
                  <td className="py-2 pr-3">{row.sort_order}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{row.key}</td>
                  <td className="py-2 pr-3 font-medium">{row.label}</td>
                  <td className="py-2 pr-3">
                    {row.is_active ? (
                      <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="py-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void toggleActive(row)}>
                      {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">Belum ada kategori.</p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
