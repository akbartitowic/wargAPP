import { Navigate, Outlet } from 'react-router-dom'
import { UmkmSubNav } from '@/components/umkm/UmkmSubNav'

export function UmkmLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">UMKM &amp; mitra warga</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola toko dan setujui pengajuan mitra dari aplikasi warga.
        </p>
      </div>
      <UmkmSubNav />
      <Outlet />
    </div>
  )
}

export function UmkmIndexRedirect() {
  return <Navigate to="/umkm/toko" replace />
}
