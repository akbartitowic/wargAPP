import type { LucideIcon } from 'lucide-react'
import { Home, Megaphone, MessageSquareWarning, ReceiptText, Store, UserRound } from 'lucide-react'

export type MainNavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Item navigasi utama (sama dengan bottom bar). */
export function getMainNavItems(canAccessBilling: boolean): MainNavItem[] {
  return [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/umkm', label: 'UMKM', icon: Store },
    ...(canAccessBilling
      ? [{ to: '/ipl', label: 'Tagihan', icon: ReceiptText } satisfies MainNavItem]
      : []),
    { to: '/news', label: 'Berita', icon: Megaphone },
    { to: '/komplain', label: 'Komplain', icon: MessageSquareWarning },
    { to: '/profile', label: 'Profil', icon: UserRound },
  ]
}
