import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { BillingRouteGuard } from '@/features/ipl/BillingRouteGuard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { IplPage } from '@/features/ipl/IplPage'
import { NewsDetailPage } from '@/features/news/NewsDetailPage'
import { NewsListPage } from '@/features/news/NewsListPage'
import { EditProfilePage } from '@/features/profile/EditProfilePage'
import { FamilyMembersPage } from '@/features/profile/FamilyMembersPage'
import { HelpCenterPage } from '@/features/profile/HelpCenterPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { UmkmListPage } from '@/features/umkm/UmkmListPage'
import { UmkmManageShopPage } from '@/features/umkm/UmkmManageShopPage'
import { UmkmPartnerApplyPage } from '@/features/umkm/UmkmPartnerApplyPage'
import { UmkmProductPage } from '@/features/umkm/UmkmProductPage'
import { UmkmStorePage } from '@/features/umkm/UmkmStorePage'
import { FacilitiesListPage } from '@/features/facilities/FacilitiesListPage'
import { FacilityDetailPage } from '@/features/facilities/FacilityDetailPage'
import { InformasiPage } from '@/pages/InformasiPage'
import { LaporPage } from '@/pages/LaporPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'ipl',
        element: (
          <BillingRouteGuard>
            <IplPage />
          </BillingRouteGuard>
        ),
      },
      { path: 'umkm', element: <UmkmListPage /> },
      { path: 'umkm/daftar-mitra', element: <UmkmPartnerApplyPage /> },
      { path: 'umkm/kelola-toko', element: <UmkmManageShopPage /> },
      { path: 'umkm/:storeId/p/:productSlug', element: <UmkmProductPage /> },
      { path: 'umkm/:storeId', element: <UmkmStorePage /> },
      { path: 'news', element: <NewsListPage /> },
      { path: 'news/:slug', element: <NewsDetailPage /> },
      { path: 'lapor', element: <LaporPage /> },
      { path: 'informasi', element: <InformasiPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/edit', element: <EditProfilePage /> },
      { path: 'profile/family', element: <FamilyMembersPage /> },
      { path: 'profile/help', element: <HelpCenterPage /> },
      { path: 'fasilitas', element: <FacilitiesListPage /> },
      { path: 'fasilitas/:facilityId', element: <FacilityDetailPage /> },
      { path: 'ibadah/jadwal', element: <Navigate to="/fasilitas" replace /> },
      { path: 'ibadah/tempat', element: <Navigate to="/fasilitas" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
