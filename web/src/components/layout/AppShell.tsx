import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { SessionExpiredBanner } from '@/components/session/SessionExpiredBanner'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-beige text-royal">
      <div
        className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
        style={{
          paddingTop: 'max(0px, env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="mx-auto min-h-full w-full max-w-lg border-x border-royal/20 bg-beige shadow-[0_0_32px_rgba(0,35,102,0.1)]">
          <SessionExpiredBanner />
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
