import { getApiBaseUrl } from '@/config/api/client'
import { toDisplayablePhotoUrl } from '@/lib/avatar'

const UMKM_PLACEHOLDER = 'https://picsum.photos/seed/warga-umkm/800/520'

/** URL gambar upload API → path yang bisa di-proxy Vite (`/uploads/...`) atau URL absolut. */
export function resolveMediaUrl(url: string | null | undefined, placeholder?: string): string {
  const fallback = placeholder ?? UMKM_PLACEHOLDER
  if (!url?.trim()) return fallback

  const display = toDisplayablePhotoUrl(url.trim())
  if (display.startsWith('http://') || display.startsWith('https://')) {
    return display
  }
  if (display.startsWith('/uploads/')) {
    return display
  }

  const base = getApiBaseUrl()
  if (base && !display.startsWith('/')) {
    return `${base.replace(/\/$/, '')}/${display.replace(/^\//, '')}`
  }

  return display || fallback
}

export function resolveMediaUrlOptional(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const resolved = resolveMediaUrl(url, '')
  return resolved || null
}
