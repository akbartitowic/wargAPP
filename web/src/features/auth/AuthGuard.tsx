import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isApiConfigured } from '@/config/api/client'
import { bootstrapSessionFromApi } from '@/lib/sessionBootstrap'
import { useAuthStore } from '@/store/authStore'

export function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.access_token)
  const location = useLocation()
  const [ready, setReady] = useState(!isApiConfigured())

  useEffect(() => {
    if (!isApiConfigured() || !token) {
      setReady(true)
      return
    }
    let cancelled = false
    void bootstrapSessionFromApi()
      .catch(() => {
        useAuthStore.getState().logout()
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  if (isApiConfigured() && !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isApiConfigured()) {
    return <>{children}</>
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-beige text-royal">
        <p className="text-sm font-medium">Memuat sesi…</p>
      </div>
    )
  }

  return <>{children}</>
}
