import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Settings2 } from 'lucide-react'
import {
  getComplaint,
  listComplaints,
  updateComplaintStatus,
  type ComplaintDetail,
  type ComplaintListRow,
} from '@/api/complaints'
import { listHousingComplexes } from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'submitted', label: 'Diajukan' },
  { value: 'in_review', label: 'Ditinjau' },
  { value: 'in_progress', label: 'Diproses' },
  { value: 'closed', label: 'Selesai' },
  { value: 'rejected', label: 'Ditolak' },
] as const

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'closed') return 'default'
  if (status === 'rejected') return 'destructive'
  if (status === 'in_progress') return 'secondary'
  return 'outline'
}

function formatDt(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

export function ComplaintsListPage() {
  const session = getCmsSession()
  const [rows, setRows] = useState<ComplaintListRow[]>([])
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ComplaintDetail | null>(null)
  const [acting, setActing] = useState(false)

  const reload = useCallback(() => {
    setLoading(true)
    const hid = session.is_super_admin ? filterHousing || undefined : undefined
    void listComplaints({
      housingId: hid,
      status: filterStatus === 'all' ? undefined : filterStatus,
    })
      .then(setRows)
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [filterHousing, filterStatus, session.is_super_admin])

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
        .catch(() => setHousingOptions([]))
    }
    reload()
  }, [reload, session.is_super_admin])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void getComplaint(selectedId)
      .then(setDetail)
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Gagal memuat detail'))
  }, [selectedId])

  async function applyStatus(status: 'in_review' | 'in_progress' | 'closed' | 'rejected') {
    if (!selectedId) return
    let note: string | undefined
    if (status === 'rejected') {
      const input = window.prompt('Alasan penolakan (wajib):')
      if (!input?.trim()) return
      note = input.trim()
    }
    setActing(true)
    try {
      const updated = await updateComplaintStatus(selectedId, { status, note })
      setDetail(updated)
      setMsg(`Status diperbarui: ${updated.status_label}`)
      reload()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal memperbarui status')
    } finally {
      setActing(false)
    }
  }

  const canReview = detail?.status === 'submitted'
  const canProgress = detail?.status === 'in_review'
  const canClose = detail?.status === 'in_progress'
  const canReject =
    detail?.status === 'submitted' ||
    detail?.status === 'in_review' ||
    detail?.status === 'in_progress'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Komplain warga</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tinjau laporan warga dan ubah status progres.
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link to="/complaints/categories" />}>
          <Settings2 className="mr-1 size-4" />
          Master kategori
        </Button>
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      <div className="flex flex-wrap gap-3">
        {session.is_super_admin ? (
          <label className="text-sm">
            Perumahan
            <select
              value={filterHousing}
              onChange={(e) => setFilterHousing(e.target.value)}
              className="ml-2 rounded-md border px-2 py-1"
            >
              <option value="">Semua</option>
              {housingOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-sm">
          Status
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="ml-2 rounded-md border px-2 py-1"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar komplain</CardTitle>
          <CardDescription>
            {loading ? 'Memuat…' : `${rows.length} entri`}
          </CardDescription>
        </CardHeader>
        <ul className="space-y-2 p-6 pt-0">
          {rows.length === 0 ? (
            <li className="text-sm text-muted-foreground">Tidak ada data.</li>
          ) : (
            rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{row.resident_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.category_label} · {formatDt(row.created_at)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{row.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusBadgeVariant(row.status)}>{row.status_label}</Badge>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
                    <Eye className="mr-1 size-4" />
                    Review
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.resident_name}</SheetTitle>
                <SheetDescription>
                  {detail.category_label} · {detail.resident_phone}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 px-4">
                <p className="text-sm leading-relaxed">{detail.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDt(detail.created_at)}</p>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Progress ({detail.progress.percent}%)
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        detail.progress.is_rejected
                          ? 'bg-destructive'
                          : detail.progress.is_complete
                            ? 'bg-primary'
                            : 'bg-primary/80'
                      }`}
                      style={{ width: `${detail.progress.percent}%` }}
                    />
                  </div>
                  <ol className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px]">
                    {detail.progress_steps.map((s) => (
                      <li key={s.status} className="font-medium">
                        {s.label}
                      </li>
                    ))}
                  </ol>
                </div>

                {detail.admin_note ? (
                  <p className="mt-4 rounded-md border bg-muted/40 p-2 text-xs">
                    <span className="font-semibold">Catatan:</span> {detail.admin_note}
                  </p>
                ) : null}

                {detail.attachments.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Lampiran</p>
                    <ul className="mt-1 space-y-1">
                      {detail.attachments.map((a) => (
                        <li key={a.id}>
                          <a
                            href={a.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline"
                          >
                            Buka lampiran
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {detail.status_history.length > 0 ? (
                  <div className="mt-4 pb-4">
                    <p className="text-sm font-semibold">Riwayat</p>
                    <ul className="mt-2 space-y-2 text-xs">
                      {detail.status_history.map((h, i) => (
                        <li key={`${h.created_at}-${i}`} className="border-l-2 pl-2">
                          <span className="font-semibold">{h.status_label}</span>
                          <span className="text-muted-foreground"> · {formatDt(h.created_at)}</span>
                          {h.note ? <p className="text-muted-foreground">{h.note}</p> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </ScrollArea>
              <SheetFooter className="flex-row flex-wrap gap-2 border-t">
                {canReview ? (
                  <Button size="sm" disabled={acting} onClick={() => void applyStatus('in_review')}>
                    Review
                  </Button>
                ) : null}
                {canProgress ? (
                  <Button size="sm" disabled={acting} onClick={() => void applyStatus('in_progress')}>
                    Progress
                  </Button>
                ) : null}
                {canClose ? (
                  <Button size="sm" disabled={acting} onClick={() => void applyStatus('closed')}>
                    Closed
                  </Button>
                ) : null}
                {canReject ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={acting}
                    onClick={() => void applyStatus('rejected')}
                  >
                    Reject
                  </Button>
                ) : null}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
