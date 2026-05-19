import { Navigate, Outlet } from 'react-router-dom'
import { BillingSubNav } from '@/components/billing/BillingSubNav'

export function BillingLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">IPL &amp; tagihan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola rincian tagihan, pengeluaran IPL, dan verifikasi bukti pembayaran.
        </p>
      </div>
      <BillingSubNav />
      <Outlet />
    </div>
  )
}

export function BillingIndexRedirect() {
  return <Navigate to="/billing/rincian" replace />
}
