import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { CmsUserMenu } from '@/components/cms-user-menu'
import { getAdminMe } from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export function CmsRootLayout() {
  const session = getCmsSession()
  const [adminLabel, setAdminLabel] = useState<{ name: string; email: string }>({
    name: 'Administrator',
    email: '',
  })

  const scopeLabel = session.is_super_admin
    ? 'Super admin · semua perumahan'
    : session.housing_name
      ? `Perumahan: ${session.housing_name}`
      : 'Admin perumahan'

  useEffect(() => {
    void getAdminMe()
      .then((p) => setAdminLabel({ name: p.full_name, email: p.email }))
      .catch(() => {
        /* tetap tampilkan menu logout meski profil gagal dimuat */
      })
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {scopeLabel}
          </span>
          <CmsUserMenu displayName={adminLabel.name} email={adminLabel.email} />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
