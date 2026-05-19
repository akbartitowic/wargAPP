import {
  Home,
  Megaphone,
  ReceiptText,
  Store,
  UserRound,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSessionStore } from '@/store/sessionStore'

const labelClass =
  'mt-1 max-w-[4.25rem] text-center text-[10px] font-semibold leading-tight'

export function BottomNav() {
  const canAccessBilling = useSessionStore((s) => s.is_parent)

  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/umkm', label: 'UMKM', icon: Store, end: false },
    ...(canAccessBilling
      ? [    { to: '/ipl', label: 'Tagihan', icon: ReceiptText, end: false } as const]
      : []),
    { to: '/news', label: 'Berita', icon: Megaphone, end: false },
    { to: '/profile', label: 'Profil', icon: UserRound, end: false },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-lg border border-royal/20 border-b-0 bg-surface shadow-[0_-6px_24px_rgba(0,35,102,0.12)] backdrop-blur-md"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px))',
      }}
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1 pt-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-0.5 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/30',
                isActive ? 'text-royal' : 'text-royal/50',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-royal text-beige shadow-sm'
                      : 'flex h-10 w-10 items-center justify-center rounded-xl text-inherit'
                  }
                >
                  <Icon className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
                </span>
                <span className={labelClass}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
