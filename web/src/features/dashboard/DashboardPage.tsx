import {
  BillingOverlapCard,
  DashboardHeroHeader,
  HomeNewsSection,
  HomeQuickActions,
  MemberOverlapStack,
} from '@/features/dashboard/components/HomeWidgets'
import { PwaInstallHint } from '@/components/pwa/PwaInstallHint'
import { useSessionStore } from '@/store/sessionStore'

export function DashboardPage() {
  const canBill = useSessionStore((s) => s.is_parent && s.can_view_billing)

  return (
    <div className="flex flex-col bg-beige pb-2">
      <div className="relative z-0 overflow-hidden rounded-b-[1.75rem] border-b border-white/20 bg-royal shadow-[0_12px_28px_-6px_rgba(0,35,102,0.35)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.18) 0%, transparent 55%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-black/15"
          aria-hidden
        />
        <DashboardHeroHeader />
      </div>

      {canBill ? <BillingOverlapCard /> : <MemberOverlapStack />}

      <div className="relative border-t-2 border-royal/15 bg-beige">
        <div className="px-4 pt-3">
          <PwaInstallHint />
        </div>

        <HomeQuickActions />
        <HomeNewsSection />
      </div>
    </div>
  )
}
