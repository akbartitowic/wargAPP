import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { TooltipProvider } from '@/components/ui/tooltip'
import { CmsAuthGuard } from '@/components/cms-auth-guard'
import { CmsRootLayout } from '@/layouts/cms-root-layout'
import { CmsLoginPage } from '@/pages/LoginPage'
import { HousingPage } from '@/pages/HousingPage'
import { CreateHousingPage } from '@/pages/CreateHousingPage'
import { EditHousingPage } from '@/pages/EditHousingPage'
import { AdminsPage } from '@/pages/AdminsPage'
import { CreateAdminPage } from '@/pages/CreateAdminPage'
import { EditAdminPage } from '@/pages/EditAdminPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { CreateResidentPage } from '@/pages/CreateResidentPage'
import { EditResidentPage } from '@/pages/EditResidentPage'
import { ResidentAccountPage } from '@/pages/ResidentAccountPage'
import { NewsListPage } from '@/pages/NewsListPage'
import { CreateNewsPage } from '@/pages/CreateNewsPage'
import { EditNewsPage } from '@/pages/EditNewsPage'
import { NewsCategoriesPage } from '@/pages/NewsCategoriesPage'
import { SuperAdminRoute } from '@/components/super-admin-route'
import {
  BillingIndexRedirect,
  BillingLayout,
} from '@/pages/billing/BillingLayout'
import { BillingPengeluaranPage } from '@/pages/billing/BillingPengeluaranPage'
import { BillingRincianPage } from '@/pages/billing/BillingRincianPage'
import { BillingVerifikasiPage } from '@/pages/billing/BillingVerifikasiPage'
import {
  AuditPage,
  DashboardPage,
  PlanningDocPage,
  UsersPage,
} from '@/pages/cms-pages'
import { LocationsListPage } from '@/pages/locations/LocationsListPage'
import { LocationCreatePage, LocationEditPage } from '@/pages/locations/LocationEditPage'
import { UmkmIndexRedirect, UmkmLayout } from '@/pages/umkm/UmkmLayout'
import { UmkmPerubahanPage } from '@/pages/umkm/UmkmPerubahanPage'
import { UmkmPersetujuanPage } from '@/pages/umkm/UmkmPersetujuanPage'
import { UmkmCreatePage, UmkmEditPage } from '@/pages/umkm/UmkmShopPage'
import { UmkmTokoPage } from '@/pages/umkm/UmkmTokoPage'

const router = createBrowserRouter([
  { path: '/login', element: <CmsLoginPage /> },
  {
    path: '/',
    element: (
      <CmsAuthGuard>
        <CmsRootLayout />
      </CmsAuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'housing',
        element: (
          <SuperAdminRoute>
            <HousingPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'housing/new',
        element: (
          <SuperAdminRoute>
            <CreateHousingPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'housing/:id/edit',
        element: (
          <SuperAdminRoute>
            <EditHousingPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admins',
        element: (
          <SuperAdminRoute>
            <AdminsPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admins/new',
        element: (
          <SuperAdminRoute>
            <CreateAdminPage />
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admins/:id/edit',
        element: (
          <SuperAdminRoute>
            <EditAdminPage />
          </SuperAdminRoute>
        ),
      },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/new', element: <CreateResidentPage /> },
      { path: 'users/:id/edit', element: <EditResidentPage /> },
      { path: 'users/:id/account', element: <ResidentAccountPage /> },
      {
        path: 'billing',
        element: <BillingLayout />,
        children: [
          { index: true, element: <BillingIndexRedirect /> },
          { path: 'rincian', element: <BillingRincianPage /> },
          { path: 'pengeluaran', element: <BillingPengeluaranPage /> },
          { path: 'verifikasi', element: <BillingVerifikasiPage /> },
        ],
      },
      { path: 'news', element: <NewsListPage /> },
      { path: 'news/new', element: <CreateNewsPage /> },
      { path: 'news/categories', element: <NewsCategoriesPage /> },
      { path: 'news/:id/edit', element: <EditNewsPage /> },
      {
        path: 'umkm',
        element: <UmkmLayout />,
        children: [
          { index: true, element: <UmkmIndexRedirect /> },
          { path: 'toko', element: <UmkmTokoPage /> },
          { path: 'persetujuan', element: <UmkmPersetujuanPage /> },
          { path: 'perubahan', element: <UmkmPerubahanPage /> },
        ],
      },
      { path: 'umkm/new', element: <UmkmCreatePage /> },
      { path: 'umkm/:shopId', element: <UmkmEditPage /> },
      { path: 'locations', element: <LocationsListPage /> },
      { path: 'locations/new', element: <LocationCreatePage /> },
      { path: 'locations/:id', element: <LocationEditPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'planning', element: <PlanningDocPage /> },
    ],
  },
])

export default function App() {
  return (
    <TooltipProvider delay={0}>
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}
