import { getApiBaseUrl } from '@/config/api/client'

export function dicebearAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

/** Origin API tanpa /api/v1 — untuk rewrite URL upload. */
export function getPublicAssetOrigin(): string {
  const base = getApiBaseUrl()
  if (!base) return ''
  return base.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '')
}

/** URL foto upload agar bisa dimuat dari app (proxy /uploads di dev). */
export function toDisplayablePhotoUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  if (trimmed.startsWith('/uploads/')) return trimmed

  const origin = getPublicAssetOrigin()
  if (origin && trimmed.startsWith(`${origin}/uploads/`)) {
    return trimmed.slice(origin.length)
  }

  if (trimmed.startsWith('uploads/')) return `/${trimmed}`

  return trimmed
}

export function resolveAvatarUrl(
  fotoUrl: string | null | undefined,
  nameSeed: string,
): string {
  if (fotoUrl?.trim()) {
    const display = toDisplayablePhotoUrl(fotoUrl)
    if (display.startsWith('http://') || display.startsWith('https://')) {
      return display
    }
    if (display.startsWith('/uploads/')) {
      return display
    }
    return display
  }
  return dicebearAvatarUrl(nameSeed.replace(/\s+/g, '').slice(0, 16) || 'warga')
}
