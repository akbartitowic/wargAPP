import { useCallback, useEffect, useState } from 'react'
import { approveProof, listPendingProofs } from '@/api/admin'
import { formatIdr } from '@/lib/billingFormat'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type ProofRow = Awaited<ReturnType<typeof listPendingProofs>>[number]

export function BillingVerifikasiPage() {
  const [queue, setQueue] = useState<ProofRow[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    void listPendingProofs()
      .then((rows) => {
        setQueue(rows)
        setMsg(null)
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Gagal memuat antrean'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function onApprove(proofId: string) {
    try {
      await approveProof(proofId)
      setMsg('Bukti disetujui — tagihan ditandai lunas.')
      reload()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal approve')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Tinjau bukti transfer dari warga. Setelah disetujui, tagihan menjadi lunas.
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
                    {formatIdr(q.amount)} · {q.submitted_at}
                  </p>
                </div>
                <Button size="sm" onClick={() => void onApprove(q.proof_id)}>
                  Approve
                </Button>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}
