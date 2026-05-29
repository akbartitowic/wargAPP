import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  MessageSquareWarning,
  Newspaper,
  Shield,
  UserCircle,
  Store,
  Users,
  Receipt,
  CircleDollarSign,
  BadgeCheck,
} from 'lucide-react'
import { getCmsSession } from '@/lib/cmsSession'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const baseItems: {
  title: string
  url: string
  icon: typeof Users
  superAdminOnly?: boolean
}[] = [
  { title: 'Beranda', url: '/', icon: LayoutDashboard },
  { title: 'Perumahan', url: '/housing', icon: Building2, superAdminOnly: true },
  { title: 'Administrator', url: '/admins', icon: Shield, superAdminOnly: true },
  { title: 'Warga', url: '/users', icon: Users },
  { title: 'Rincian tagihan', url: '/billing/rincian', icon: Receipt },
  { title: 'Pengeluaran IPL', url: '/billing/pengeluaran', icon: CircleDollarSign },
  { title: 'Verifikasi bukti', url: '/billing/verifikasi', icon: BadgeCheck },
  { title: 'Berita', url: '/news', icon: Newspaper },
  { title: 'Komplain warga', url: '/complaints', icon: MessageSquareWarning },
  { title: 'UMKM', url: '/umkm', icon: Store },
  { title: 'Lokasi & fasum', url: '/locations', icon: MapPin },
  { title: 'Audit log', url: '/audit', icon: ClipboardList, superAdminOnly: true },
]

export function AppSidebar() {
  const location = useLocation()
  const isSuperAdmin = getCmsSession().is_super_admin
  const items = baseItems.filter((item) => !item.superAdminOnly || isSuperAdmin)

  function active(url: string): boolean {
    if (url === '/') return location.pathname === '/'
    if (url === '/users') {
      return location.pathname === '/users' || location.pathname.startsWith('/users/')
    }
    if (url === '/admins') {
      return location.pathname === '/admins' || location.pathname.startsWith('/admins/')
    }
    if (url === '/news') {
      return location.pathname === '/news' || location.pathname.startsWith('/news/')
    }
    if (url.startsWith('/billing')) {
      return location.pathname === url || location.pathname.startsWith(`${url}/`)
    }
    if (url === '/complaints') {
      return location.pathname === '/complaints' || location.pathname.startsWith('/complaints/')
    }
    return location.pathname === url || location.pathname.startsWith(`${url}/`)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
          <span className="text-sm font-semibold tracking-tight">Warga CMS</span>
          <span className="text-xs text-muted-foreground">Command Center</span>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <span className="text-xs font-bold">W</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modul</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={active(item.url)}
                    tooltip={item.title}
                    render={<Link to={item.url} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarGroupLabel>Akun</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={active('/profile')}
                  tooltip="Profil & password"
                  render={<Link to="/profile" />}
                >
                  <UserCircle className="size-4" />
                  <span>Profil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="border-t border-sidebar-border pt-4">
          <SidebarGroupLabel>Dokumentasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={active('/planning')}
                  tooltip="Perencanaan CMS"
                  render={<Link to="/planning" />}
                >
                  <BookOpen className="size-4" />
                  <span>Perencanaan CMS</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
