import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchComplaintById, type ComplaintDetail } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { Card } from '@/components/ui/Card'
import {
  ComplaintHistoryTimeline,
  ComplaintProgressBar,
} from '@/features/complaints/ComplaintProgressBar'

export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ComplaintDetail | null>(null)
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isApiConfigured()) return
    setLoading(true)
    void fetchComplaintById(id)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="min-h-full bg-page-grey px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] text-left">
      <header className="flex items-center gap-2 py-2">
        <Link
          to="/komplain"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-royal transition hover:bg-royal/5"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="text-xl font-bold text-royal">Detail komplain</h1>
      </header>

      {loading ? <p className="mt-4 text-sm text-muted">Memuat…</p> : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {data ? (
        <div className="mt-4 space-y-4">
          <Card className="border-royal/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {data.category_label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-royal">{data.description}</p>
            <p className="mt-3 text-xs text-muted">
              Diajukan{' '}
              {new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'long',
                timeStyle: 'short',
              }).format(new Date(data.created_at))}
            </p>
          </Card>

          <Card className="border-royal/10">
            <ComplaintProgressBar
              progress={data.progress}
              steps={data.progress_steps}
              statusLabel={data.status_label}
            />
            {data.admin_note ? (
              <p className="mt-3 rounded-lg bg-royal/[0.04] px-3 py-2 text-xs text-royal">
                <span className="font-semibold">Catatan pengurus:</span> {data.admin_note}
              </p>
            ) : null}
          </Card>

          {data.attachments.length > 0 ? (
            <Card className="border-royal/10">
              <h2 className="text-sm font-bold text-royal">Lampiran</h2>
              <ul className="mt-2 space-y-2">
                {data.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-royal underline-offset-2 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {a.mime_type.includes('pdf') ? 'Buka PDF' : 'Lihat gambar'}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="border-royal/10">
            <ComplaintHistoryTimeline history={data.status_history} />
          </Card>
        </div>
      ) : null}
    </div>
  )
}
