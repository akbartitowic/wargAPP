import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { listAuditLogs, listHousingComplexes, listResidents } from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { ResidentsByKkTable } from '@/components/users/ResidentsByKkTable'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Beranda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan aktivitas dan pintasan modul CMS Warga App.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Warga & KK</CardTitle>
            <CardDescription>
              Master data NIK/KK, wali keluarga, soft delete, import massal.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">IPL</CardTitle>
            <CardDescription>
              Generator tagihan, antrean verifikasi bukti, export laporan.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Konten</CardTitle>
            <CardDescription>
              Berita (RTE, hero 16:9, prioritas, jadwal), UMKM & lokasi.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

function Placeholder({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Belum diimplementasi</CardTitle>
          <CardDescription>
            Modul ini akan dihubungkan ke API. Rencana fitur ada di
            dokumentasi monorepo.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export function UsersPage() {
  const session = getCmsSession()
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof listResidents>>
  >([])
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [loadErr, setLoadErr] = useState<string | null>(null)

  function reload() {
    const housingParam = session.is_super_admin ? filterHousing || undefined : undefined
    void listResidents(housingParam)
      .then((data) => {
        setRows(data)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(String(e)))
  }

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
        .catch(() => setHousingOptions([]))
    }
    reload()
  }, [])

  useEffect(() => {
    if (session.is_super_admin) reload()
  }, [filterHousing])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Daftar warga</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data warga per KK dan akun login Warga App (NIK atau No. HP + password).
          </p>
        </div>
        <Button render={<Link to="/users/new" />}>
          <UserPlus className="mr-2 size-4" />
          Tambah warga
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
      {session.is_super_admin ? (
        <label className="block max-w-md text-sm">
          Filter perumahan
          <select
            value={filterHousing}
            onChange={(e) => setFilterHousing(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          >
            <option value="">Semua perumahan</option>
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
          <CardTitle className="text-base">Warga terdaftar</CardTitle>
          <CardDescription>
            Satu No. KK dengan beberapa anggota ditampilkan sebagai grup. Kolom hunian menampilkan
            pemilik/kontrak, tanggal tinggal, dan status aktif/nonaktif akun login.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <ResidentsByKkTable rows={rows} />
        </div>
      </Card>
    </div>
  )
}

export function AuditPage() {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof listAuditLogs>>>([])

  useEffect(() => {
    void listAuditLogs().then(setLogs).catch(() => setLogs([]))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <Card>
        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Waktu</th>
                <th className="pb-2">Aksi</th>
                <th className="pb-2">Entitas</th>
                <th className="pb-2">Actor</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/60">
                  <td className="py-2 whitespace-nowrap text-xs">
                    {new Date(l.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2 font-mono text-xs">{l.action}</td>
                  <td className="py-2 text-xs">{l.entity_type ?? '—'}</td>
                  <td className="py-2 text-xs">{l.actor_id.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  return (
    <Placeholder title="Pengaturan">
      RBAC, batas sesi idle 30 menit, integrasi API, preferensi lingkungan.
    </Placeholder>
  )
}

export function PlanningDocPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Perencanaan CMS</h1>
      <p className="text-sm text-muted-foreground">
        Ringkasan untuk tim produk. Dokumen lengkap (Markdown) ada di repo:{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          docs/CMS-PLANNING.md
        </code>
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
        <li>
          <strong>RBAC:</strong> Super Admin, Admin Keuangan (IPL), Admin
          Konten (Berita &amp; UMKM).
        </li>
        <li>
          <strong>Keamanan:</strong> audit log, auto-logout idle 30 menit.
        </li>
        <li>
          <strong>User:</strong> NIK unik, wali = akses IPL, soft delete,
          import massal.
        </li>
        <li>
          <strong>Berita:</strong> RTE, hero 16:9, prioritas hero app,
          jadwal post.
        </li>
        <li>
          <strong>IPL:</strong> generator tagihan, antrean verifikasi, export
          laporan.
        </li>
        <li>
          <strong>UMKM &amp; lokasi:</strong> approval toko, titik koordinat
          untuk Maps.
        </li>
        <li>
          <strong>UI:</strong> sidebar, tabel server-side pagination, filter
          blok/KK/status IPL.
        </li>
      </ul>
    </div>
  )
}
