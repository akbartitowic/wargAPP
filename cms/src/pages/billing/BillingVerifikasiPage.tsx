import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Eye } from 'lucide-react'
import { approveProof, listPendingProofs, type PendingPaymentProof } from '@/api/admin'
import { formatIdr } from '@/lib/billingFormat'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

function formatSubmittedAt(iso: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function ProofPreview({ url, mimeType }: { url: string; mimeType: string }) {
  const isImage = mimeType.startsWith('image/')

  if (!isImage) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Pratinjau tidak tersedia untuk tipe file ini.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
        >
          <ExternalLink className="size-3.5" />
          Buka file
        </a>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      <img
        src={url}
        alt="Bukti transfer"
        className="mx-auto max-h-[min(70vh,640px)] w-full object-contain"
      />
    </div>
  )
}

export function BillingVerifikasiPage() {
  const [queue, setQueue] = useState<PendingPaymentProof[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [selected, setSelected] = useState<PendingPaymentProof | null>(null)
  const [approving, setApproving] = useState(false)

  const reload = useCallback(() => {
    setLoading(true)
    void listPendingProofs()
      .then((rows) => {
        setQueue(rows)
        setMsg(null)
        setSelected((prev) => {
          if (!prev) return null
          return rows.find((r) => r.proof_id === prev.proof_id) ?? null
        })
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Gagal memuat antrean'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function onApprove(proofId: string) {
    setApproving(true)
    try {
      await approveProof(proofId)
      setMsg('Bukti disetujui — tagihan ditandai lunas.')
      setSelected(null)
      reload()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal approve')
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Tinjau bukti transfer dari warga. Buka pratinjau sebelum menyetujui.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
          {loading ? 'Memuat…' : 'Refresh'}
        </Button>
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Antrean verifikasi bukti</CardTitle>
          <CardDescription>
            {queue.length === 0
              ? 'Tidak ada bukti menunggu'
              : `${queue.length} bukti menunggu persetujuan`}
          </CardDescription>
        </CardHeader>
        <ul className="space-y-3 p-6 pt-0">
          {queue.length === 0 ? (
            <li className="text-sm text-muted-foreground">Tidak ada antrean.</li>
          ) : (
            queue.map((q) => (
              <li
                key={q.proof_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{q.resident_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatIdr(q.amount)} · {formatSubmittedAt(q.submitted_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelected(q)}
                  >
                    <Eye className="mr-1.5 size-4" />
                    Lihat bukti
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void onApprove(q.proof_id)}
                    disabled={approving}
                  >
                    Approve
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Review bukti transfer</SheetTitle>
                <SheetDescription>
                  {selected.resident_name} · {formatIdr(selected.amount)}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 px-4">
                <dl className="mb-4 grid gap-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Waktu unggah</dt>
                    <dd className="text-right">{formatSubmittedAt(selected.submitted_at)}</dd>
                  </div>
                  {selected.no_kk ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">No. KK</dt>
                      <dd className="font-mono text-xs">{selected.no_kk}</dd>
                    </div>
                  ) : null}
                </dl>

                <ProofPreview url={selected.file_url} mimeType={selected.mime_type} />
              </ScrollArea>

              <SheetFooter className="flex-row flex-wrap gap-2 border-t">
                <a
                  href={selected.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                >
                  <ExternalLink className="size-3.5" />
                  Buka tab baru
                </a>
                <Button
                  size="sm"
                  className="ml-auto"
                  disabled={approving}
                  onClick={() => void onApprove(selected.proof_id)}
                >
                  {approving ? 'Memproses…' : 'Approve'}
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
