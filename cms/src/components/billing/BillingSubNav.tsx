import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/billing/rincian', label: 'Rincian tagihan' },
  { to: '/billing/pengeluaran', label: 'Pengeluaran IPL' },
  { to: '/billing/verifikasi', label: 'Verifikasi bukti' },
] as const

export function BillingSubNav() {
  const location = useLocation()

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
      aria-label="Sub menu IPL"
    >
      {tabs.map((tab) => {
        const active = location.pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
