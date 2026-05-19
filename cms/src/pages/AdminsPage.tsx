import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Shield, Pencil } from 'lucide-react'
import { listAdminAccounts, type AdminAccountRow } from '@/api/admin'
import { ADMIN_ROLE_LABELS } from '@/lib/adminRoles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AdminsPage() {
  const [rows, setRows] = useState<AdminAccountRow[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const reload = useCallback(() => {
    void listAdminAccounts()
      .then((data) => {
        setRows(data)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Shield className="size-7 text-primary" />
            Administrator CMS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola akun yang dapat login ke panel CMS. Hanya super admin yang mengakses halaman ini.
          </p>
        </div>
        <Button render={<Link to="/admins/new" />}>
          <Plus className="mr-2 size-4" />
          Tambah admin
        </Button>
      </div>

      {loadErr ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {loadErr}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar administrator</CardTitle>
          <CardDescription>{rows.length} akun terdaftar</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">Nama</th>
                <th className="pb-2 pr-3">Email</th>
                <th className="pb-2 pr-3">Peran</th>
                <th className="pb-2 pr-3">Perumahan</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Belum ada administrator.{' '}
                    <Link to="/admins/new" className="text-primary underline">
                      Tambah admin
                    </Link>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-3 pr-3 font-medium">{row.full_name}</td>
                    <td className="py-3 pr-3 font-mono text-xs">{row.email}</td>
                    <td className="py-3 pr-3">{ADMIN_ROLE_LABELS[row.role]}</td>
                    <td className="py-3 pr-3 text-xs">{row.housing_name ?? '—'}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
                        {row.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        render={<Link to={`/admins/${row.id}/edit`} />}
                      >
                        <Pencil className="mr-1 size-3.5" />
                        Edit
                      </Button>
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
