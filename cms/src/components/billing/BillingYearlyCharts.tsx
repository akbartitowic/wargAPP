import type { BillingDashboard } from '@/api/admin'
import { BILLING_MONTHS, formatIdr } from '@/lib/billingFormat'
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

export function BillingYearlyCharts({ dashboard }: { dashboard: BillingDashboard | null }) {
  if (!dashboard) return null
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pemasukan per bulan ({dashboard.year})</CardTitle>
          <CardDescription>Total tagihan lunas per periode.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bulan</TableHead>
                <TableHead className="text-right">KK lunas</TableHead>
                <TableHead className="text-right">Pemasukan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.income_by_month.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{BILLING_MONTHS[row.month - 1]}</TableCell>
                  <TableCell className="text-right">{row.bill_count}</TableCell>
                  <TableCell className="text-right">{formatIdr(row.collected)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengeluaran per bulan ({dashboard.year})</CardTitle>
          <CardDescription>Total penggunaan dana IPL yang dicatat.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bulan</TableHead>
                <TableHead className="text-right">Total keluar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.expense_by_month.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{BILLING_MONTHS[row.month - 1]}</TableCell>
                  <TableCell className="text-right">{formatIdr(row.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
