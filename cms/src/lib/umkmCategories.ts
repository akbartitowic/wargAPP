export const UMKM_SHOP_CATEGORIES = ['Makanan', 'Jasa', 'Kebutuhan'] as const

export type UmkmShopCategory = (typeof UMKM_SHOP_CATEGORIES)[number]

export const UMKM_SHOP_STATUSES = [
  { value: 'pending', label: 'Menunggu', color: 'bg-amber-100 text-amber-900' },
  { value: 'approved', label: 'Aktif', color: 'bg-emerald-100 text-emerald-900' },
  { value: 'rejected', label: 'Ditolak', color: 'bg-red-100 text-red-900' },
  { value: 'inactive', label: 'Nonaktif', color: 'bg-muted text-muted-foreground' },
] as const
