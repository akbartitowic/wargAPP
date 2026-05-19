import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPinned, Pencil, Plus, Trash2 } from 'lucide-react'
import { listHousingComplexes } from '@/api/admin'
import { deleteFacility, listFacilities, mediaUrl, type FacilityRow } from '@/api/facilities'
import { getCmsSession } from '@/lib/cmsSession'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function LocationsListPage() {
  const session = getCmsSession()
  const [rows, setRows] = useState<FacilityRow[]>([])
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [search, setSearch] = useState('')
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const reload = useCallback(() => {
    void listFacilities({
      housing_complex_id: session.is_super_admin ? filterHousing || undefined : undefined,
      q: search || undefined,
    })
      .then((data) => {
        setRows(data)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [filterHousing, search, session.is_super_admin])

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
        .catch(() => setHousingOptions([]))
    }
    reload()
  }, [reload, session.is_super_admin])

  async function remove(id: string) {
    if (!confirm('Nonaktifkan fasilitas ini dari aplikasi warga?')) return
    try {
      await deleteFacility(id)
      reload()
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <MapPinned className="size-7 text-primary" />
            Fasilitas umum
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Kelola foto, detail lokasi, koordinat peta, jam buka–tutup. Data ini tampil di menu
            Fasilitas umum pada aplikasi warga.
          </p>
        </div>
        <Button render={<Link to="/locations/new" />}>
          <Plus className="mr-2 size-4" />
          Tambah fasilitas
        </Button>
      </div>

      {loadErr ? <p className="text-sm text-destructive">{loadErr}</p> : null}

      <div className="flex flex-wrap gap-3">
        {session.is_super_admin ? (
          <select
            value={filterHousing}
            onChange={(e) => setFilterHousing(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">Semua perumahan</option>
            {housingOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        ) : null}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau jenis…"
          className="min-w-[200px] flex-1 rounded-md border px-3 py-1.5 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={reload}>
          Terapkan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar fasilitas</CardTitle>
          <CardDescription>
            Warga dapat melihat peta, arah (Google Maps), dan status buka/tutup.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fasilitas</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {row.image_url ? (
                        <img
                          src={mediaUrl(row.image_url) ?? row.image_url}
                          alt=""
                          className="size-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-xs">
                          —
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.housing_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{row.facility_type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.open_time && row.close_time
                      ? `${row.open_time}–${row.close_time}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {row.is_active ? (
                      <Badge className="bg-emerald-600/90">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="ghost" render={<Link to={`/locations/${row.id}`} />}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => void remove(row.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada fasilitas.</p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
