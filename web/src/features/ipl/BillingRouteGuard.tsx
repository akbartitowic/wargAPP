import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSessionStore } from '@/store/sessionStore'

export function BillingRouteGuard({ children }: { children: ReactNode }) {
  const allowed = useSessionStore((s) => s.is_parent && s.can_view_billing)
  if (!allowed) {
    return <Navigate to="/" replace />
  }
  return children
}
