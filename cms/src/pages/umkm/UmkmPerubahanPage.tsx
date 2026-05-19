import { useCallback, useEffect, useState } from 'react'
import {
  approveUmkmChangeRequest,
  listUmkmChangeRequests,
  rejectUmkmChangeRequest,
  type UmkmChangeRequestRow,
} from '@/api/umkm'
import { UmkmSubNav } from '@/components/umkm/UmkmSubNav'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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

export function UmkmPerubahanPage() {
  const [rows, setRows] = useState<UmkmChangeRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listUmkmChangeRequests())
      setMsg(null)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal memuat pengajuan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onApprove(id: string) {
    try {
      await approveUmkmChangeRequest(id)
      setMsg('Perubahan disetujui dan diterapkan.')
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal menyetujui')
    }
  }

  async function onReject(id: string) {
    const note = window.prompt('Alasan penolakan (opsional):') ?? ''
    try {
      await rejectUmkmChangeRequest(id, note || undefined)
      setMsg('Pengajuan ditolak.')
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal menolak')
    }
  }

  return (
    <div className="space-y-6">
      <UmkmSubNav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Persetujuan perubahan mitra</h1>
        <p className="text-sm text-muted-foreground">
          Edit profil toko dan menu dari mitra UMKM — setujui agar tampil di aplikasi warga.
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">{msg}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Antrean pengajuan</CardTitle>
          <CardDescription>
            Tutup/buka sementara toko tidak perlu disetujui (langsung oleh mitra).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada pengajuan menunggu.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Toko</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Perubahan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.shop_name}</div>
                      <div className="text-xs text-muted-foreground">{r.housing_name}</div>
                    </TableCell>
                    <TableCell>{r.owner_name ?? '—'}</TableCell>
                    <TableCell className="max-w-xs text-sm">{r.summary}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => void onApprove(r.id)}>
                          Setujui
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void onReject(r.id)}>
                          Tolak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
