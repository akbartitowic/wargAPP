import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Pencil, Plus, Power } from 'lucide-react'
import {
  deactivateHousingComplex,
  listHousingComplexesManage,
  type HousingComplexRow,
} from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function HousingPage() {
  const [rows, setRows] = useState<HousingComplexRow[]>([])
  const [showInactive, setShowInactive] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgOk, setMsgOk] = useState(false)

  const reload = useCallback(() => {
    void listHousingComplexesManage(showInactive)
      .then(setRows)
      .catch((e) => setMsg(String(e)))
  }, [showInactive])

  useEffect(() => {
    reload()
  }, [reload])

  async function onDeactivate(row: HousingComplexRow) {
    if (row.status === 'inactive') return
    if (!confirm(`Nonaktifkan perumahan "${row.name}"? Warga tidak bisa login sampai diaktifkan kembali.`)) {
      return
    }
    setMsg(null)
    setMsgOk(false)
    try {
      await deactivateHousingComplex(row.id)
      setMsg(`Perumahan "${row.name}" dinonaktifkan.`)
      setMsgOk(true)
      reload()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menonaktifkan')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Building2 className="size-7 text-primary" />
            Daftar perumahan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola tenant perumahan. Untuk menambah perumahan baru, gunakan form terpisah.
          </p>
        </div>
        <Button render={<Link to="/housing/new" />}>
          <Plus className="mr-2 size-4" />
          Tambah perumahan
        </Button>
      </div>

      {msg ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            msgOk
              ? 'border-green-200 bg-green-50 text-green-900'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
          role="alert"
        >
          {msg}
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Perumahan terdaftar</CardTitle>
            <CardDescription>{rows.length} perumahan</CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Tampilkan nonaktif
          </label>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">Nama</th>
                <th className="pb-2 pr-3">Slug</th>
                <th className="pb-2 pr-3">Kelurahan</th>
                <th className="pb-2 pr-3">Kode pos</th>
                <th className="pb-2 pr-3">Warga</th>
                <th className="pb-2 pr-3">Admin</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Belum ada perumahan.{' '}
                    <Link to="/housing/new" className="text-primary underline">
                      Tambah perumahan
                    </Link>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-3 pr-3 font-medium">{row.name}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">{row.slug}</td>
                    <td className="py-3 pr-3 text-xs">
                      {row.kelurahan}
                      <span className="mt-0.5 block text-muted-foreground">Kec. {row.kecamatan}</span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">{row.kode_pos}</td>
                    <td className="py-3 pr-3">{row.resident_count}</td>
                    <td className="py-3 pr-3 text-xs">{row.admin_email ?? '—'}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
                        {row.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          render={<Link to={`/housing/${row.id}/edit`} />}
                        >
                          <Pencil className="mr-1 size-3.5" />
                          Edit
                        </Button>
                        {row.status === 'active' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => void onDeactivate(row)}
                          >
                            <Power className="mr-1 size-3.5" />
                            Nonaktifkan
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
