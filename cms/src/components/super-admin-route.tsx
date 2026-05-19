import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getCmsSession } from '@/lib/cmsSession'

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const session = getCmsSession()
  if (!session.access_token) return <Navigate to="/login" replace />
  if (!session.is_super_admin) return <Navigate to="/" replace />
  return children
}
