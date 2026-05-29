/** Normalisasi path file di DB → path web di bawah `/uploads` (static). */
export function resolveStoredUploadWebPath(storedPath: string): string {
  let p = storedPath.replace(/\\/g, '/')
  if (p.startsWith('http://') || p.startsWith('https://')) return p

  const uploadsIdx = p.indexOf('/uploads/')
  if (uploadsIdx >= 0) return p.slice(uploadsIdx + 1)

  const paymentIdx = p.indexOf('payment-proofs/')
  if (paymentIdx >= 0) {
    const tail = p.slice(paymentIdx)
    return tail.startsWith('uploads/') ? tail : `uploads/${tail}`
  }

  if (p.startsWith('uploads/')) return p
  return `uploads/${p.replace(/^\/+/, '')}`
}
