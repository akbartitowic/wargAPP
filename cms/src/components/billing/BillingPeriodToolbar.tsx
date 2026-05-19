import { BILLING_MONTHS } from '@/lib/billingFormat'
import { Button } from '@/components/ui/button'

type Props = {
  isSuperAdmin: boolean
  housingOptions: { id: string; name: string }[]
  housingId: string
  onHousingChange: (id: string) => void
  year: number
  onYearChange: (y: number) => void
  month: number
  onMonthChange: (m: number) => void
  loading: boolean
  onRefresh: () => void
}

export function BillingPeriodToolbar({
  isSuperAdmin,
  housingOptions,
  housingId,
  onHousingChange,
  year,
  onYearChange,
  month,
  onMonthChange,
  loading,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {isSuperAdmin ? (
        <label className="text-sm">
          Perumahan
          <select
            value={housingId}
            onChange={(e) => onHousingChange(e.target.value)}
            className="mt-1 block rounded-md border bg-background px-2 py-1.5"
          >
            {housingOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="text-sm">
        Tahun
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="mt-1 block rounded-md border bg-background px-2 py-1.5"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Bulan
        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="mt-1 block rounded-md border bg-background px-2 py-1.5"
        >
          {BILLING_MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
        {loading ? 'Memuat…' : 'Refresh'}
      </Button>
    </div>
  )
}
