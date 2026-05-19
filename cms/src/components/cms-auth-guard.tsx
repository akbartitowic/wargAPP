import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getCmsSession } from '@/lib/cmsSession'

export function CmsAuthGuard({ children }: { children: ReactNode }) {
  const token = getCmsSession().access_token
  if (!token) return <Navigate to="/login" replace />
  return children
}
