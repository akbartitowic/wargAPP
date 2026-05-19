/** Status buka/tutup berdasarkan waktu server (Asia/Jakarta). */
export function computeShopOpenStatus(
  openTime: string,
  closeTime: string,
  now = new Date(),
  isManualClosed = false,
): { is_open: boolean; label: string } {
  if (isManualClosed) {
    return { is_open: false, label: 'Tutup sementara' }
  }
  const tz = 'Asia/Jakarta'
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  const currentMinutes = hour * 60 + minute

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const open = toMinutes(openTime.slice(0, 5))
  const close = toMinutes(closeTime.slice(0, 5))

  let isOpen: boolean
  if (close > open) {
    isOpen = currentMinutes >= open && currentMinutes < close
  } else {
    // tutup lewat tengah malam
    isOpen = currentMinutes >= open || currentMinutes < close
  }

  return {
    is_open: isOpen,
    label: isOpen ? 'Buka' : 'Tutup',
  }
}
