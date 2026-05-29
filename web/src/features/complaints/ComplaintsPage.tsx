import { ArrowLeft, ChevronRight, Plus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchComplaintCategories,
  fetchMyComplaints,
  submitComplaint,
  type ComplaintCategory,
  type ComplaintListItem,
} from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { Card } from '@/components/ui/Card'
import { ComplaintProgressBar } from '@/features/complaints/ComplaintProgressBar'

const MAX_TOTAL_BYTES = 10 * 1024 * 1024

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function ComplaintsPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'list' | 'form'>('list')
  const [items, setItems] = useState<ComplaintListItem[]>([])
  const [categories, setCategories] = useState<ComplaintCategory[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!isApiConfigured()) return
    setLoading(true)
    void Promise.all([fetchMyComplaints(), fetchComplaintCategories()])
      .then(([list, cats]) => {
        setItems(list)
        setCategories(cats)
        setCategoryId((prev) => prev || cats[0]?.id || '')
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const totalBytes = files.reduce((s, f) => s + f.size, 0)

  function onPickFiles(list: FileList | null) {
    if (!list?.length) return
    const next = [...files, ...Array.from(list)]
    const total = next.reduce((s, f) => s + f.size, 0)
    if (total > MAX_TOTAL_BYTES) {
      setMsg('Total lampiran maksimal 10 MB')
      return
    }
    if (next.length > 8) {
      setMsg('Maksimal 8 file lampiran')
      return
    }
    setMsg(null)
    setFiles(next)
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId) {
      setMsg('Pilih kategori')
      return
    }
    if (description.trim().length < 10) {
      setMsg('Deskripsi minimal 10 karakter')
      return
    }
    setSubmitting(true)
    setMsg(null)
    try {
      const created = await submitComplaint({
        category_id: categoryId,
        description: description.trim(),
        files,
      })
      setDescription('')
      setFiles([])
      setTab('list')
      reload()
      navigate(`/komplain/${created.id}`)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal mengirim')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-page-grey px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] text-left">
      <header className="flex items-center gap-2 py-2">
        <Link
          to="/"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-royal transition hover:bg-royal/5"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="text-xl font-bold text-royal">Komplain warga</h1>
      </header>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('list')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            tab === 'list' ? 'bg-royal text-beige' : 'bg-surface text-royal border border-royal/15'
          }`}
        >
          Riwayat
        </button>
        <button
          type="button"
          onClick={() => setTab('form')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            tab === 'form' ? 'bg-royal text-beige' : 'bg-surface text-royal border border-royal/15'
          }`}
        >
          Ajukan baru
        </button>
      </div>

      {msg ? <p className="mt-3 text-sm text-danger">{msg}</p> : null}

      {tab === 'form' ? (
        <Card className="mt-4 border-royal/10">
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <label className="block text-sm">
              <span className="font-semibold text-royal">Kategori</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-royal/15 bg-surface px-3 py-2.5 text-sm"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-royal">Deskripsi</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Jelaskan masalah secara rinci…"
                className="mt-1.5 w-full resize-y rounded-xl border border-royal/15 bg-surface px-3 py-2.5 text-sm"
                required
                minLength={10}
              />
            </label>

            <div>
              <p className="text-sm font-semibold text-royal">Bukti (opsional)</p>
              <p className="mt-0.5 text-xs text-muted">
                JPG, PNG, WebP, atau PDF — total maks. 10 MB ({formatBytes(totalBytes)} terpakai)
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                className="sr-only"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-royal/25 py-3 text-sm font-semibold text-royal"
              >
                <Plus className="h-4 w-4" />
                Tambah lampiran
              </button>
              {files.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-royal/[0.04] px-2 py-1.5 text-xs"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        className="shrink-0 font-semibold text-danger"
                        onClick={() => removeFile(i)}
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-royal py-3 text-sm font-bold text-beige disabled:opacity-60"
            >
              {submitting ? 'Mengirim…' : 'Kirim komplain'}
            </button>
          </form>
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-muted">Memuat…</p>
          ) : items.length === 0 ? (
            <Card className="border-royal/10">
              <p className="text-sm text-muted">Belum ada komplain. Ajukan lewat tab &quot;Ajukan baru&quot;.</p>
            </Card>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                to={`/komplain/${item.id}`}
                className="block rounded-2xl border border-royal/10 bg-surface p-4 shadow-sm transition hover:border-royal/25"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {item.category_label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-royal">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-royal/35" aria-hidden />
                </div>
                <div className="mt-3">
                  <ComplaintProgressBar
                    progress={item.progress}
                    steps={[]}
                    statusLabel={item.status_label}
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
