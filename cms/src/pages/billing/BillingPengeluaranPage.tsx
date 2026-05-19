import { useState } from 'react'
import { createIplExpense, deleteIplExpense } from '@/api/admin'
import { BillingPeriodToolbar } from '@/components/billing/BillingPeriodToolbar'
import { BillingYearlyCharts } from '@/components/billing/BillingYearlyCharts'
import { BILLING_MONTHS, formatIdr } from '@/lib/billingFormat'
import { useBillingFilters } from '@/hooks/useBillingFilters'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BillingPengeluaranPage() {
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

  const [expTitle, setExpTitle] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Umum')

  async function onAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveHousing) return
    const amount = Number(expAmount.replace(/\D/g, ''))
    if (!expTitle.trim() || amount <= 0) {
      setMsg('Judul dan nominal pengeluaran wajib diisi.')
      return
    }
    try {
      await createIplExpense({
        housing_complex_id: effectiveHousing,
        period_year: year,
        period_month: month,
        title: expTitle.trim(),
        amount,
        category: expCategory,
      })
      setExpTitle('')
      setExpAmount('')
      setMsg('Pengeluaran dicatat.')
      await loadDashboard()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengeluaran')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Catat pengeluaran IPL per bulan dan lihat ringkasan pemasukan vs pengeluaran.
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

      <BillingYearlyCharts dashboard={dashboard} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pengeluaran IPL — {BILLING_MONTHS[month - 1]} {year}
          </CardTitle>
          <CardDescription>
            Total bulan ini: {formatIdr(dashboard?.expenses_current_month_total ?? 0)}
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 p-6 pt-0">
          <form
            onSubmit={onAddExpense}
            className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
          >
            <div className="min-w-[12rem] flex-1">
              <Label>Judul</Label>
              <Input
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                placeholder="Contoh: Perbaikan lampu taman"
                className="mt-1"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label>Kategori</Label>
                <Input
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="mt-1 w-28"
                />
              </div>
              <div>
                <Label>Nominal</Label>
                <Input
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="500000"
                  className="mt-1 w-32"
                />
              </div>
              <Button type="submit">Catat pengeluaran</Button>
            </div>
          </form>
          <ul className="divide-y">
            {(dashboard?.expenses_current_month ?? []).length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">Belum ada pengeluaran.</li>
            ) : (
              dashboard?.expenses_current_month.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category} · {e.spent_at}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatIdr(e.amount)}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void deleteIplExpense(e.id).then(() => loadDashboard())
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </Card>
    </div>
  )
}
