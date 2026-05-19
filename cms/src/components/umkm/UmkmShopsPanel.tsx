import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, X } from 'lucide-react'
import { listHousingComplexes } from '@/api/admin'
import {
  listUmkmShops,
  mediaUrl,
  setUmkmShopStatus,
  type UmkmShopRow,
  type UmkmShopStatus,
} from '@/api/umkm'
import { UMKM_SHOP_CATEGORIES, UMKM_SHOP_STATUSES } from '@/lib/umkmCategories'
import { getCmsSession } from '@/lib/cmsSession'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function statusBadge(status: UmkmShopStatus) {
  const meta = UMKM_SHOP_STATUSES.find((s) => s.value === status)
  return (
    <Badge className={meta?.color ?? ''} variant="secondary">
      {meta?.label ?? status}
    </Badge>
  )
}

type Props = {
  mode: 'all' | 'approval'
  initialStatus?: string
}

export function UmkmShopsPanel({ mode, initialStatus = '' }: Props) {
  const session = getCmsSession()
  const [rows, setRows] = useState<UmkmShopRow[]>([])
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [filterStatus, setFilterStatus] = useState(
    mode === 'approval' ? 'pending' : initialStatus,
  )
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const reload = useCallback(() => {
    void listUmkmShops({
      housing_complex_id: session.is_super_admin ? filterHousing || undefined : undefined,
      status: filterStatus || undefined,
      category: filterCategory || undefined,
      q: search || undefined,
    })
      .then((data) => {
        setRows(data)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [filterCategory, filterHousing, filterStatus, search, session.is_super_admin])

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
        .catch(() => setHousingOptions([]))
    }
    reload()
  }, [reload, session.is_super_admin])

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending').length
    const approved = rows.filter((r) => r.status === 'approved').length
    return { total: rows.length, pending, approved }
  }, [rows])

  async function quickStatus(id: string, status: UmkmShopStatus) {
    try {
      await setUmkmShopStatus(id, status)
      reload()
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Gagal ubah status')
    }
  }

  return (
    <div className="space-y-6">
      {mode === 'all' ? (
        <div className="flex justify-end">
          <Button render={<Link to="/umkm/new" />}>
            <Plus className="mr-2 size-4" />
            Tambah toko
          </Button>
        </div>
      ) : null}

      {loadErr ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {loadErr}
        </p>
      ) : null}

      {mode === 'all' ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total toko</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Menunggu persetujuan</CardDescription>
              <CardTitle className="text-2xl text-amber-700">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aktif di app</CardDescription>
              <CardTitle className="text-2xl text-emerald-700">{stats.approved}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {rows.length} pengajuan menunggu ditinjau. Setujui agar toko muncul di aplikasi warga.
        </p>
      )}

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
        {mode === 'all' ? (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">Semua status</option>
            {UMKM_SHOP_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ) : null}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">Semua kategori</option>
          {UMKM_SHOP_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama toko…"
          className="min-w-[200px] flex-1 rounded-md border px-3 py-1.5 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={reload}>
          Terapkan filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {mode === 'approval' ? 'Antrean persetujuan' : 'Daftar toko'}
          </CardTitle>
          <CardDescription>
            {mode === 'approval'
              ? 'Pengajuan dari tombol “Daftar menjadi mitra” di aplikasi warga.'
              : 'Kelola profil merchant dan menu jualan.'}
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Toko</TableHead>
                <TableHead>Kategori</TableHead>
                {mode === 'all' ? <TableHead>Menu</TableHead> : null}
                <TableHead>Pemilik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-52">Aksi</TableHead>
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
                        <Link
                          to={`/umkm/${row.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {row.name}
                        </Link>
                        {row.tagline ? (
                          <p className="line-clamp-1 text-xs text-muted-foreground">{row.tagline}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">{row.housing_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{row.category}</TableCell>
                  {mode === 'all' ? (
                    <TableCell>
                      {row.active_product_count}/{row.product_count} aktif
                    </TableCell>
                  ) : null}
                  <TableCell className="text-sm text-muted-foreground">
                    {row.owner_name ?? '—'}
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link to={`/umkm/${row.id}`} />}
                      >
                        Kelola
                      </Button>
                      {row.status === 'pending' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-600/90"
                            onClick={() => void quickStatus(row.id, 'approved')}
                          >
                            <Check className="mr-1 size-3.5" />
                            Setujui
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => void quickStatus(row.id, 'rejected')}
                          >
                            <X className="mr-1 size-3.5" />
                            Tolak
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {mode === 'approval' ? 'Tidak ada pengajuan menunggu.' : 'Belum ada toko.'}
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
