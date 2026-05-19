import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchUnpaidBillings,
  generateBills,
  type BillingLineItem,
  type UnpaidBillingRow,
} from '@/api/admin'
import { BillingPeriodToolbar } from '@/components/billing/BillingPeriodToolbar'
import { BillingStatCard } from '@/components/billing/BillingStatCard'
import { BILLING_MONTHS, formatIdr } from '@/lib/billingFormat'
import { useBillingFilters } from '@/hooks/useBillingFilters'
import { Button } from '@/components/ui/button'
import {
  Card,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BillingRincianPage() {
  const {
    session,
    housingOptions,
    housingId,
    setHousingId,
    year,
    setYear,
    month,
    setMonth,
    dashboard,
    loading,
    loadDashboard,
    msg,
    setMsg,
    effectiveHousing,
  } = useBillingFilters()

  const [lineItems, setLineItems] = useState<BillingLineItem[]>([
    { item_name: 'Keamanan', amount: 100_000 },
    { item_name: 'Kebersihan', amount: 100_000 },
    { item_name: 'Kas RT', amount: 50_000 },
  ])
  const [dueDate, setDueDate] = useState('')
  const [unpaid, setUnpaid] = useState<UnpaidBillingRow[]>([])

  const lineTotal = useMemo(
    () => lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [lineItems],
  )

  const p = dashboard?.period

  useEffect(() => {
    if (p?.line_template?.length) {
      setLineItems(p.line_template)
    }
    if (p?.due_date) setDueDate(p.due_date.slice(0, 10))
  }, [p?.line_template, p?.due_date, p?.period_id])

  useEffect(() => {
    if (!p?.period_id) {
      setUnpaid([])
      return
    }
    void fetchUnpaidBillings(p.period_id)
      .then(setUnpaid)
      .catch(() => setUnpaid([]))
  }, [p?.period_id])

  function updateLine(idx: number, patch: Partial<BillingLineItem>) {
    setLineItems((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  async function onGenerate() {
    if (!effectiveHousing) {
      setMsg('Pilih perumahan.')
      return
    }
    const items = lineItems.filter((l) => l.item_name.trim() && l.amount > 0)
    if (!items.length) {
      setMsg('Tambahkan minimal satu rincian tagihan.')
      return
    }
    try {
      const res = await generateBills({
        year,
        month,
        housing_complex_id: effectiveHousing,
        due_date: dueDate || undefined,
        line_items: items,
      })
      const skipNote =
        res.bills_skipped > 0
          ? ` ${res.bills_skipped} alamat dilewati (belum 1 bulan tinggal, nonaktif, atau kontrak sudah berakhir).`
          : ''
      setMsg(
        `Tagihan dibuat: ${res.bills_created} alamat baru, ${res.bills_updated} alamat diperbarui (${res.billable_kk} alamat layak). Total per alamat: ${formatIdr(res.total_per_kk)}.${skipNote}`,
      )
      await loadDashboard()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal generate')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Generate tagihan per alamat (bukan per KK): warga aktif sudah tinggal minimal 1 bulan
          sebelum bulan tagihan (kontrak masih berlaku).
        </p>
        <BillingPeriodToolbar
          isSuperAdmin={session.is_super_admin}
          housingOptions={housingOptions}
          housingId={housingId}
          onHousingChange={setHousingId}
          year={year}
          onYearChange={setYear}
          month={month}
          onMonthChange={setMonth}
          loading={loading}
          onRefresh={() => void loadDashboard()}
        />
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      {p ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BillingStatCard
            label="Alamat layak tagih"
            value={String(p.billable_kk ?? p.total_kk)}
            sub={`Unit: ${p.total_kk} · Lunas: ${p.paid_kk} · Belum: ${p.unpaid_kk} · Pending: ${p.pending_kk}`}
          />
          <BillingStatCard label="Sudah terbayar" value={formatIdr(p.collected_amount)} />
          <BillingStatCard label="Belum terbayar" value={formatIdr(p.outstanding_amount)} />
          <BillingStatCard
            label="Target tagihan periode"
            value={formatIdr(p.expected_amount)}
            sub={p.label}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buat / perbarui tagihan bulan ini</CardTitle>
          <CardDescription>
            Rincian diterapkan ke alamat layak tagih (warga aktif, mulai tinggal ≥1 bulan sebelum
            bulan ini). Total per alamat dihitung otomatis.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 p-6 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rincian</TableHead>
                  <TableHead className="w-40 text-right">Nominal (Rp)</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={row.item_name}
                        onChange={(e) => updateLine(idx, { item_name: e.target.value })}
                        placeholder="Nama pos"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="text-right"
                        value={row.amount || ''}
                        onChange={(e) =>
                          updateLine(idx, { amount: Number(e.target.value) || 0 })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={lineItems.length <= 1}
                        onClick={() =>
                          setLineItems((rows) => rows.filter((_, i) => i !== idx))
                        }
                        aria-label="Hapus baris"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLineItems((rows) => [...rows, { item_name: '', amount: 0 }])
              }
            >
              <Plus className="mr-1 size-4" />
              Tambah rincian
            </Button>
            <p className="text-lg font-semibold">Total per KK: {formatIdr(lineTotal)}</p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="due-date">Jatuh tempo</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-44"
              />
            </div>
            <Button type="button" onClick={() => void onGenerate()}>
              Generate tagihan {BILLING_MONTHS[month - 1]} {year}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warga belum membayar</CardTitle>
          <CardDescription>
            KK dengan status belum lunas atau menunggu verifikasi bukti.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          {unpaid.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {p?.period_id
                ? 'Semua KK sudah lunas atau belum ada tagihan untuk periode ini.'
                : 'Generate tagihan terlebih dahulu.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wali / KK</TableHead>
                  <TableHead>Blok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tagihan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaid.map((u) => (
                  <TableRow key={u.billing_id}>
                    <TableCell className="font-medium">{u.resident_name}</TableCell>
                    <TableCell>{u.blok_rumah}</TableCell>
                    <TableCell>
                      {u.status === 'pending' ? 'Menunggu verifikasi' : 'Belum dibayar'}
                    </TableCell>
                    <TableCell className="text-right">{formatIdr(u.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
