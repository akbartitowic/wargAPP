import { ArrowLeft, Calendar, ReceiptText, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchBillingCurrent,
  fetchBillingHistory,
  uploadPaymentProof,
} from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { Card } from '@/components/ui/Card'
import { formatIDR } from '@/lib/format'
import { useSessionStore } from '@/store/sessionStore'

function billingStatusPill(
  status: 'unpaid' | 'pending' | 'paid',
): { label: string; wrap: string; dot: string } {
  if (status === 'paid') {
    return {
      label: 'Lunas',
      wrap: 'bg-success-soft text-success',
      dot: 'bg-success',
    }
  }
  if (status === 'pending') {
    return {
      label: 'Pending',
      wrap: 'bg-amber-100 text-amber-900',
      dot: 'bg-amber-500',
    }
  }
  return {
    label: 'Belum dibayar',
    wrap: 'bg-danger-soft text-danger',
    dot: 'bg-danger',
  }
}

export function IplPage() {
  const housing_name = useSessionStore((s) => s.housing_name)
  const setFromServer = useSessionStore((s) => s.setFromServer)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadHint, setUploadHint] = useState<string | null>(null)
  const [billingId, setBillingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(isApiConfigured())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [billing_status, setBillingStatus] = useState<'unpaid' | 'pending' | 'paid'>('unpaid')
  const [current_ipl_amount, setCurrentIplAmount] = useState(0)
  const [rincian, setRincian] = useState<{ label: string; amount: number }[]>([])
  const [history, setHistory] = useState<{ id: string; period: string; amount: number }[]>([])
  const [bulan, setBulan] = useState('')
  const [emptyHint, setEmptyHint] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) return
    setLoading(true)
    setLoadError(null)
    void fetchBillingCurrent()
      .then((bill) => {
        setBillingId(bill.billing_id ?? null)
        setBulan(bill.period.label)
        setRincian(bill.line_items.map((l) => ({ label: l.name, amount: l.amount })))
        setBillingStatus(bill.status)
        setCurrentIplAmount(bill.total_amount)
        setEmptyHint(
          !bill.billing_id && bill.total_amount === 0
            ? (bill.message ??
                'Belum ada tagihan untuk alamat Anda. Minta pengurus generate tagihan di CMS (menu Tagihan → Rincian).')
            : null,
        )
        setFromServer({
          billing_status: bill.status,
          current_ipl_amount: bill.total_amount,
        })
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : 'Gagal memuat tagihan')
      })
      .finally(() => setLoading(false))

    void fetchBillingHistory()
      .then((rows) =>
        setHistory(
          rows.map((r) => ({
            id: r.billing_id,
            period: r.label,
            amount: r.total_amount,
          })),
        ),
      )
      .catch(() => {
        /* ignore */
      })
  }, [setFromServer])

  const pill = billingStatusPill(billing_status)
  const paid = billing_status === 'paid'
  const pending = billing_status === 'pending'
  const canPayOrUpload = billing_status === 'unpaid'
  const periodLabel = bulan || 'Bulan berjalan'

  async function onProofSelected(file: File | undefined) {
    if (!file || !billingId) {
      setUploadHint('Tagihan aktif tidak ditemukan.')
      return
    }
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      setUploadHint('Hanya JPG atau PNG (maks. 2MB).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadHint('Ukuran file maksimal 2MB.')
      return
    }
    try {
      await uploadPaymentProof(billingId, file)
      setBillingStatus('pending')
      setFromServer({ billing_status: 'pending' })
      setUploadHint('Bukti terkirim. Menunggu verifikasi admin.')
    } catch (e) {
      setUploadHint(e instanceof Error ? e.message : 'Upload gagal')
    }
  }

  return (
    <div className="min-h-full bg-page-grey pb-28 text-left">
      <header className="sticky top-0 z-20 flex items-center justify-center border-b border-royal/10 bg-surface px-2 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm">
        <Link
          to="/"
          className="absolute left-2 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-royal transition hover:bg-royal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/25"
          aria-label="Kembali ke beranda"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <div className="text-center">
          <h1 className="text-base font-bold text-royal">Tagihan IPL</h1>
          {housing_name ? (
            <p className="text-xs text-muted">{housing_name}</p>
          ) : null}
        </div>
      </header>

      <div className="space-y-6 px-4 py-5">
        {loading ? (
          <p className="text-center text-sm text-muted">Memuat tagihan…</p>
        ) : null}
        {loadError ? (
          <p className="text-center text-sm text-danger">{loadError}</p>
        ) : null}

        {!loading && !loadError ? (
          <>
            <Card className="border-royal/10 shadow-[0_8px_24px_rgba(0,35,102,0.06)]">
              <BillingCardBody
                periodLabel={periodLabel}
                pill={pill}
                current_ipl_amount={current_ipl_amount}
                rincian={rincian}
              />
              {emptyHint ? (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  {emptyHint}
                </p>
              ) : null}
            </Card>

            <section aria-labelledby="metode-heading">
              <h2 id="metode-heading" className="text-base font-bold text-royal">
                Pilih metode pembayaran
              </h2>

              <div
                className={`mt-4 space-y-3 ${!canPayOrUpload ? 'pointer-events-none opacity-45' : ''}`}
              >
                <div className="rounded-2xl border border-royal/12 bg-surface p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/8 text-royal">
                      <ReceiptText className="h-6 w-6" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-royal">Transfer manual</p>
                      <p className="mt-0.5 text-sm text-muted">
                        Unggah bukti transfer (JPG/PNG, maks. 2MB)
                      </p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(e) => void onProofSelected(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    disabled={!canPayOrUpload || paid || pending}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-royal py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" aria-hidden />
                    Unggah bukti
                  </button>
                  {uploadHint ? (
                    <p className="mt-2 text-center text-xs font-medium text-royal">
                      {uploadHint}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {history.length > 0 ? (
              <section>
                <h2 className="flex items-center gap-2 text-base font-bold text-royal">
                  <Calendar className="h-5 w-5" aria-hidden />
                  Riwayat 6 bulan
                </h2>
                <ul className="mt-3 space-y-2">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between rounded-xl border border-royal/10 bg-surface px-4 py-3"
                    >
                      <span className="text-sm font-medium text-royal">{h.period}</span>
                      <span className="text-sm font-bold text-royal">
                        {formatIDR(h.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(paid || pending) && (
              <p className="text-center text-xs text-muted">
                {paid
                  ? 'Tagihan bulan ini sudah lunas.'
                  : 'Bukti sedang diverifikasi pengurus.'}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

function BillingCardBody({
  periodLabel,
  pill,
  current_ipl_amount,
  rincian,
}: {
  periodLabel: string
  pill: { label: string; wrap: string; dot: string }
  current_ipl_amount: number
  rincian: { label: string; amount: number }[]
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted">Tagihan bulan</p>
          <p className="mt-0.5 text-lg font-bold text-royal">{periodLabel}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${pill.wrap}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} aria-hidden />
          {pill.label}
        </span>
      </div>

      <div className="mt-6 border-t border-royal/10 pt-5">
        <p className="text-xs font-medium text-muted">Total tagihan</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-royal">
          {formatIDR(current_ipl_amount)}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
          Rincian tagihan
        </h2>
        {rincian.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Belum ada rincian pos tagihan.</p>
        ) : (
          <ul className="mt-3 divide-y divide-royal/10">
            {rincian.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-2 py-3 first:pt-0"
              >
                <span className="text-sm text-royal">{row.label}</span>
                <span className="text-sm font-semibold text-royal">
                  {formatIDR(row.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
