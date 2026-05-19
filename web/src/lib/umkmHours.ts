/** Status buka toko dari jam buka–tutup (format HH:mm, zona Asia/Jakarta). */
export function isStoreOpenNow(
  openHHMM: string,
  closeHHMM: string,
  now: Date = new Date(),
): boolean {
  const parts = (s: string) => s.split(':').map((x) => Number(x))
  const [oh, om] = parts(openHHMM)
  const [ch, cm] = parts(closeHHMM)
  if ([oh, om, ch, cm].some((n) => Number.isNaN(n))) return false

  const mins = (d: Date) => {
    const f = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const [h, m] = f.format(d).split(':').map(Number)
    return h * 60 + m
  }

  const cur = mins(now)
  const openM = oh * 60 + om
  const closeM = ch * 60 + cm

  if (closeM >= openM) {
    return cur >= openM && cur <= closeM
  }
  /* tutup melewati tengah malam */
  return cur >= openM || cur <= closeM
}
