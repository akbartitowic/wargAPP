import { NavLink } from 'react-router-dom'
import { getMainNavItems } from '@/lib/mainNav'
import { useSessionStore } from '@/store/sessionStore'

const rowClass =
  'flex w-full items-center gap-3 rounded-xl border border-royal/10 bg-royal/[0.03] px-3 py-3 text-left transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/30'

export function MainNavDrawerList({ onNavigate }: { onNavigate?: () => void }) {
  const canAccessBilling = useSessionStore((s) => s.is_parent)
  const items = getMainNavItems(canAccessBilling)

  return (
    <nav className="flex flex-col gap-2" aria-label="Menu aplikasi">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              rowClass,
              isActive ? 'border-royal/25 bg-royal/8 text-royal' : 'text-royal',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={
                  isActive
                    ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-royal text-beige'
                    : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-royal shadow-sm'
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="flex-1 text-sm font-semibold">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
