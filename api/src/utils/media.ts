import { publicUploadUrl } from '../config/env.js'

export function resolvePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return publicUploadUrl(url)
}
